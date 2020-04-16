/* eslint-disable no-underscore-dangle */

/**
 * @param {function} compile
 * @param {string}   extension
 * @param {function} isException
 */
module.exports = function attachHook(compile, extension, isException) {
  const existingHook = require.extensions[extension];

  require.extensions[extension] = function cssModulesHook(m, filename) {
    if (isException(filename)) {
      existingHook(m, filename);
      return undefined;
    }
    const tokens = compile(filename);
    return m._compile(`module.exports = ${JSON.stringify(tokens)}`, filename);
  };
};
