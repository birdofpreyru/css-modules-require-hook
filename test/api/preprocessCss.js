const { identity } = require('lodash');
const { detachHook } = require('../sugar');
const { dropCache } = require('../sugar');

suite('api/preprocessCss', () => {
  const preprocessCss = spy(identity);

  test('should be called', () => assert(preprocessCss.called));

  setup(() => {
    hook({ preprocessCss });
    require('./fixture/oceanic.css');
  });

  teardown(() => {
    detachHook('.css');
    dropCache('./api/fixture/oceanic.css');
  });
});
