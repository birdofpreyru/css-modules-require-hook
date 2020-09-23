const { plugin } = require('postcss');

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

const Through = plugin('through', (processor) => (css) => processor(css));

exports.dropCache = dropCache;
exports.detachHook = detachHook;
exports.Through = Through;
