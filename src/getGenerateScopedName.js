/**
 * Provides the default implementation of generateScopedName(..) function,
 * matching the implementation used by css-loader@5.2.4 (the way the loader
 * is coded, it is not possible just to import and reuse their implementation).
 */

const path = require('path');

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

const regexSingleEscape = /[ -,./:-@[\]^`{-~]/;
const regexExcessiveSpaces = /(^|\\+)?(\\[\dA-F]{1,6}) (?![\d A-Fa-f])/g;

const escape = (string) => {
  let output = '';
  let counter = 0;

  while (counter < string.length) {
    const character = string.charAt(counter++);

    let value;

    // eslint-disable-next-line no-control-regex
    if (/[\t\n\u000B\f\r]/.test(character)) {
      const codePoint = character.charCodeAt();

      value = `\\${codePoint.toString(16).toUpperCase()} `;
    } else if (character === '\\' || regexSingleEscape.test(character)) {
      value = `\\${character}`;
    } else {
      value = character;
    }

    output += value;
  }

  const firstChar = string.charAt(0);

  if (/^-[\d-]/.test(output)) {
    output = `\\-${output.slice(1)}`;
  } else if (/\d/.test(firstChar)) {
    output = `\\3${firstChar} ${output.slice(1)}`;
  }

  // Remove spaces after `\HEX` escapes that are not followed by a hex digit,
  // since they’re redundant. Note that this is only possible if the escape
  // sequence isn’t preceded by an odd number of backslashes.
  output = output.replace(regexExcessiveSpaces, (aa, bb, cc) => {
    if (bb && bb.length % 2) {
      // It’s not safe to remove the space, so don’t.
      return aa;
    }

    // Strip the space.
    return (bb || '') + cc;
  });

  return output;
};

function gobbleHex(str) {
  const lower = str.toLowerCase();
  let hex = '';
  let spaceTerminated = false;

  // eslint-disable-next-line no-undefined
  for (let i = 0; i < 6 && lower[i] !== undefined; i++) {
    const code = lower.charCodeAt(i);
    // check to see if we are dealing with a valid hex char [a-f|0-9]
    const valid = (code >= 97 && code <= 102) || (code >= 48 && code <= 57);
    // https://drafts.csswg.org/css-syntax/#consume-escaped-code-point
    spaceTerminated = code === 32;

    if (!valid) {
      break;
    }

    hex += lower[i];
  }

  if (hex.length === 0) {
    // eslint-disable-next-line no-undefined
    return undefined;
  }

  const codePoint = parseInt(hex, 16);

  const isSurrogate = codePoint >= 0xd800 && codePoint <= 0xdfff;
  // Add special case for
  // "If this number is zero, or is for a surrogate, or is greater than
  // the maximum allowed code point"
  // https://drafts.csswg.org/css-syntax/#maximum-allowed-code-point
  if (isSurrogate || codePoint === 0x0000 || codePoint > 0x10ffff) {
    return ['\uFFFD', hex.length + (spaceTerminated ? 1 : 0)];
  }

  return [
    String.fromCodePoint(codePoint),
    hex.length + (spaceTerminated ? 1 : 0),
  ];
}

const CONTAINS_ESCAPE = /\\/;

function unescape(str) {
  const needToProcess = CONTAINS_ESCAPE.test(str);

  if (!needToProcess) {
    return str;
  }

  let ret = '';

  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\') {
      const gobbled = gobbleHex(str.slice(i + 1, i + 7));

      // eslint-disable-next-line no-undefined
      if (gobbled !== undefined) {
        ret += gobbled[0];
        i += gobbled[1];

        // eslint-disable-next-line no-continue
        continue;
      }

      // Retain a pair of \\ if double escaped `\\\\`
      // https://github.com/postcss/postcss-selector-parser/commit/268c9a7656fb53f543dc620aa5b73a30ec3ff20e
      if (str[i + 1] === '\\') {
        ret += '\\';
        i += 1;

        // eslint-disable-next-line no-continue
        continue;
      }

      // if \\ is at the end of the string retain it
      // https://github.com/postcss/postcss-selector-parser/commit/01a6b346e3612ce1ab20219acc26abdc259ccefb
      if (str.length === i + 1) {
        ret += str[i];
      }

      // eslint-disable-next-line no-continue
      continue;
    }

    ret += str[i];
  }

  return ret;
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
  let relativeMatchResource = '';
  const { context, hashPrefix } = options;
  const { _module: mdl, resourcePath } = loaderContext;

  if (mdl && mdl.matchResource) {
    relativeMatchResource = `${normalizePath(
      path.relative(context, mdl.matchResource),
    )}\u0000`;
  }

  const relativeResourcePath = normalizePath(
    path.relative(context, resourcePath),
  );

  // eslint-disable-next-line no-param-reassign
  options.content = `${hashPrefix}${relativeMatchResource}${
    relativeResourcePath}\u0000${localName}`;

  return interpolateName(loaderContext, localIdentName, options);
}

/**
 * Taken from css-loader@5.0.1
 * @param {string} localident
 */
function escapeLocalident(localident) {
  return escape(
    localident
      // For `[hash]` placeholder
      .replace(/^((-?[0-9])|--)/, '_$1')
      .replace(filenameReservedRegex, '-')
      .replace(reControlChars, '-')
      .replace(/\./g, '-'),
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
    ).replace(/\[local]/gi, localName),
  );
};
