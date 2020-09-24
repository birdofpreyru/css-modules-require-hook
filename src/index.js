const { assign, identity, negate } = require('lodash');
const { dirname, relative, resolve } = require('path');
const { readFileSync } = require('fs');

const { getModulesOptions } = require('css-loader/dist/utils');

const globToRegex = require('glob-to-regexp');

const postcss = require('postcss');
const Values = require('postcss-modules-values');
const LocalByDefault = require('postcss-modules-local-by-default');
const ExtractImports = require('postcss-modules-extract-imports');
const Scope = require('postcss-modules-scope');
const ResolveImports = require('postcss-modules-resolve-imports');

const debugFetch = require('debug')('css-modules:fetch');
const debugSetup = require('debug')('css-modules:setup');
const validate = require('./validate');
const attachHook = require('./attachHook');
const { transformTokens } = require('./transformTokens');

// As of now CSS loader does not export its default getLocalIdent(..) function,
// which we need to generate the classnames. However, this goofy way to get it
// works fine. If one day internal changes in css-loader break this workaround,
// it will be necessary just to commit them a patch which exports the function.
const { getLocalIdent } = getModulesOptions({ modules: true }, {});

/**
 * @param  {*} option
 * @return {array}
 */
function toArray(option) {
  return Array.isArray(option)
    ? option
    : [option];
}

/**
 * @param  {function|regex|string} ignore glob, regex or function
 * @return {function}
 */
function buildExceptionChecker(ignore) {
  if (ignore instanceof RegExp) return (filepath) => ignore.test(filepath);

  if (typeof ignore === 'string') return (filepath) => globToRegex(ignore).test(filepath);

  return ignore || negate(identity);
}

module.exports = function setupHook(options) {
  const {
    camelCase,
    devMode,
    extensions = '.css',
    ignore,
    preprocessCss = identity,
    processCss,
    processorOpts,
    append = [],
    prepend = [],
    createImportedName,
    generateScopedName,
    hashPrefix = '',
    mode,
    resolve: resolveOpts,
    use,
    rootDir: context = process.cwd(),
  } = options;
  debugSetup(options);
  validate(options);

  /* An attempt to fix
   * https://github.com/css-modules/css-modules-require-hook/issues/115
   */
  const processCssQueue = [];
  const processCssPlugin = processCss && (
    () => ({
      postcssPlugin: 'process-css-plugin',
      Root: (root) => {
        const tree = root.clone();
        tree.walkRules((rule) => {
          if (rule.selector && (rule.selector.match(/^:(export|import)/))) {
            rule.remove();
          }
        });
        processCssQueue.push({
          css: tree.toString(),
          file: tree.source.input.file,
        });
      },
    })
  );
  if (processCssPlugin) processCssPlugin.postcss = true;

  const exts = toArray(extensions);
  const tokensByFile = {};

  // debug option is preferred NODE_ENV === 'development'
  const debugMode = typeof devMode !== 'undefined'
    ? devMode
    : process.env.NODE_ENV === 'development';

  let scopedName;
  if (generateScopedName) {
    scopedName = typeof generateScopedName !== 'function'
      // for example '[name]__[local]___[hash:base64:5]'
      ? (className, resourcePath) => getLocalIdent(
        { resourcePath },
        generateScopedName,
        className,
        { context, hashPrefix },
      ) : generateScopedName;
  } else {
    // small fallback
    scopedName = (local, filename) => Scope.generateScopedName(
      local,
      relative(context, filename),
    );
  }

  let plugins = use;
  if (!plugins) {
    plugins = [
      ...prepend,
      Values,
      mode
        ? new LocalByDefault({ mode })
        : LocalByDefault,
      createImportedName
        ? new ExtractImports({ createImportedName })
        : ExtractImports,
      new Scope({ generateScopedName: scopedName }),
    ];
    if (processCssPlugin) plugins.push(processCssPlugin);
    plugins.push(
      new ResolveImports({ resolve: { extensions: exts, ...resolveOpts } }),
      ...append,
    );
  }

  // https://github.com/postcss/postcss#options
  const runner = postcss(plugins);

  /**
   * @todo   think about replacing sequential fetch function calls with requires calls
   * @param  {string} _to
   * @param  {string} from
   * @return {object}
   */
  function fetch(_to, from) {
    // getting absolute path to the processing file
    const filename = /[^\\/?%*:|"<>.]/i.test(_to[0])
      ? require.resolve(_to)
      : resolve(dirname(from), _to);

    // checking cache
    let tokens = tokensByFile[filename];
    if (tokens) {
      debugFetch(`${filename} → cache`);
      debugFetch(tokens);
      return tokens;
    }

    const source = preprocessCss(readFileSync(filename, 'utf8'), filename);
    // https://github.com/postcss/postcss/blob/master/docs/api.md#processorprocesscss-opts
    const lazyResult = runner.process(source, assign({}, processorOpts, { from: filename }));

    // https://github.com/postcss/postcss/blob/master/docs/api.md#lazywarnings
    lazyResult.warnings().forEach((message) => console.warn(message.text));

    tokens = lazyResult.root.exports || {};

    if (!debugMode) {
      // updating cache
      tokensByFile[filename] = tokens;
    } else {
      // clearing cache in development mode
      delete require.cache[filename];
    }

    if (processCss) {
      processCssQueue.reverse();
      processCssQueue.forEach(({ css, file }) => processCss(css, file));
    }

    debugFetch(`${filename} → fs`);
    debugFetch(tokens);

    return tokens;
  }

  const isException = buildExceptionChecker(ignore);

  const hook = (filename) => {
    const tokens = fetch(filename, filename);
    return camelCase ? transformTokens(tokens, camelCase) : tokens;
  };

  // @todo add possibility to specify particular config for each extension
  exts.forEach((extension) => attachHook(hook, extension, isException));
};
