/**
 * Provides the default implementation of generateScopedName(..) function,
 * matching the implementation used by css-loader@5.0.1 (the way the loader
 * is coded, it is not possible just to import and reuse their implementation).
 */

const path = require('path');

const cssesc = require('cssesc');
const { interpolateName } = require('loader-utils');

const filenameReservedRegex = /[<>:"/\\|?*]/g;
// eslint-disable-next-line no-control-regex
const reControlChars = /[\u0000-\u001f\u0080-\u009f]/g;

/**
 * Taken from css-laoder@5.0.1 as is.
 */
function normalizePath(file) {
  return path.sep === '\\' ? file.replace(/\\/g, '/') : file;
}

/**
 * This is a copy/paste of defaultGetLocalIdent(..) from css-loader@5.0.1.
 */
function getLocalIdent(
  loaderContext,
  localIdentName,
  localName,
  options,
) {
  const { context, hashPrefix } = options;
  const { resourcePath } = loaderContext;
  const request = normalizePath(path.relative(context, resourcePath));

  // eslint-disable-next-line no-param-reassign
  options.content = `${hashPrefix + request}\x00${localName}`;

  return interpolateName(loaderContext, localIdentName, options);
}

/**
 * Taken from css-loader@5.0.1
 * @param {string} localident
 */
function escapeLocalident(localident) {
  return cssesc(
    localident
      // For `[hash]` placeholder
      .replace(/^((-?[0-9])|--)/, '_$1')
      .replace(filenameReservedRegex, '-')
      .replace(reControlChars, '-')
      .replace(/\./g, '-'),
    { isIdentifier: true },
  );
}

/**
 * Creates a default implementation of generateScopedName(..),
 * matching that used by css-loader@5.0.1.
 * @param {string} context Filesystem context path.
 * @param {string} [template='[hash:base64]'] Optional. Template for classname
 *  generation. Defaults [hash:base64].
 * @param {string} [hashPrefix=''] Optional. Hash prefix. Defaults empty string.
 * @return {function} generateScopedName(..).
 */
module.exports = function getGenerateScopedName(
  context,
  template = '[hash:base64]',
  hashPrefix = '',
) {
  return (localName, assetPath) => escapeLocalident(
    getLocalIdent(
      { resourcePath: assetPath },
      template,
      unescape(localName),
      { context, hashPrefix },
    ),
  ).replace(/\\\[local\\]/gi, localName);
};
