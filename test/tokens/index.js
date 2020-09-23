const { basename } = require('path');
const { readdirSync } = require('fs');
const { readFileSync } = require('fs');
const { resolve } = require('path');
const { detachHook } = require('../sugar');

/**
 * @param {string} testCase
 */
function describeTest(testCase) {
  const source = readfile(testCase, 'source.css');
  if (source === null) {
    return;
  }

  // @todo add a small shortcut to choose certain tests
  test(basename(testCase), () => {
    const expected = JSON.parse(readfile(testCase, 'expected.json'));
    assert.deepEqual(require(resolve(testCase, 'source.css')), expected);
  });
}

/**
 * @param  {string} dir
 * @return {string[]}
 */
function readdir(dir) {
  return readdirSync(resolve(__dirname, dir))
    .map((nesteddir) => resolve(__dirname, dir, nesteddir));
}

/**
 * @param  {...string} file
 * @return {string|null}
 */
function readfile(file) {
  try {
    return readFileSync(resolve.apply(null, arguments), 'utf8');
  } catch (e) {
    return null;
  }
}

suite('tokens', () => {
  setup(() => hook({}));
  teardown(() => detachHook('.css'));
  readdir('./cases').forEach(describeTest);
});
