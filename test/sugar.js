/**
 * Drops require cache for the certain module
 *
 * @param {string} modulePath
 */
function dropCache(modulePath) {
  delete require.cache[require.resolve(modulePath)];
}

/**
 * @param {string} extension
 */
function detachHook(extension) {
  delete require.extensions[extension];
}

const Through =  (processor) => ({
  postcssPlugin: 'through',
  Once: (css) => processor(css),
});
Through.postcss = true;

exports.dropCache = dropCache;
exports.detachHook = detachHook;
exports.Through = Through;
