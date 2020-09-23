const { identity } = require('lodash');
const { detachHook } = require('../sugar');
const { dropCache } = require('../sugar');

suite('api/processCss()', () => {
  const processCss = spy(identity);

  test('should be called', () => assert(processCss.called));

  setup(() => {
    hook({ processCss });
    require('./fixture/oceanic.css');
  });

  teardown(() => {
    detachHook('.css');
    dropCache('./api/fixture/oceanic.css');
  });
});
