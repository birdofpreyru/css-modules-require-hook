
const { assign, camelCase, reduce } = require('lodash');

/**
 * @param  {string} str
 * @return {string}
 */
function camelizeDashes(str) {
  return str.replace(/-+(\w)/g, (m, letter) => letter.toUpperCase());
}

const camelizeKeys = (acc, value, key) => {
  const camelizedKey = camelCase(key);
  if (camelizedKey !== key) acc[camelizedKey] = value;
  return acc;
};

const camelizeDashedKeys = (acc, value, key) => {
  const camelizedKey = camelizeDashes(key);
  if (camelizedKey !== key) acc[camelizedKey] = value;
  return acc;
};

const camelizeOnlyKeys = (acc, value, key) => {
  const camelizedKey = camelCase(key);
  if (camelizedKey !== key) acc[camelizedKey] = value;
  else acc[key] = value;
  return acc;
};

const camelizeOnlyDashedKeys = (acc, value, key) => {
  const camelizedKey = camelizeDashes(key);
  if (camelizedKey !== key) acc[camelizedKey] = value;
  else acc[key] = value;
  return acc;
};

/**
 * @param  {object} tokens
 * @param  {boolean|string} camelCaseArg 'dashes|dashesOnly|only'
 * @return {object}
 */
function transformTokens(tokens, camelCaseArg) {
  switch (camelCaseArg) {
    case true:
      return reduce(tokens, camelizeKeys, assign({}, tokens));

    case 'dashes':
      return reduce(tokens, camelizeDashedKeys, assign({}, tokens));

    case 'dashesOnly':
      return reduce(tokens, camelizeOnlyDashedKeys, {});

    case 'only':
      return reduce(tokens, camelizeOnlyKeys, {});

    default:
  }

  return tokens;
}

exports.camelizeDashes = camelizeDashes;
exports.transformTokens = transformTokens;
