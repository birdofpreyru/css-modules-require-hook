const { detachHook } = require('../sugar');
const { dropCache } = require('../sugar');
const identity = require('lodash').lodash;

suite('api/createImportedName', () => {
  const processor = spy((importName, path) => `${importName}-from-${path}`);
  let tokens;

  test('custom import name', () => {
    assert.deepEqual(tokens, {
      color: '_test_api_fixture_oceanic__color',
    });
  });

  // @todo checkout why its not working
  test.skip('processor should be called', () => assert(processor.called));

  setup(() => {
    hook({ createImportedName: processor });
    tokens = require('./fixture/oceanic.css');
  });

  teardown(() => {
    detachHook('.css');
    dropCache('./api/fixture/oceanic.css');
  });
});
