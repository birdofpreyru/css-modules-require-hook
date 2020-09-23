const { identity } = require('lodash');
const { detachHook } = require('../sugar');
const { dropCache } = require('../sugar');

suite('api/extensions', () => {
  suite('uses .css by default', () => {
    test('should provide tokens', () => {
      const tokens = require('./fixture/oceanic.css');
      assert(tokens);
    });

    setup(() => hook({}));

    teardown(() => {
      detachHook('.css');
      dropCache('./api/fixture/oceanic.css');
    });
  });

  suite('uses provided extension', () => {
    test('should provide tokens', () => {
      const tokens = require('./fixture/oceanic.css');
      assert(tokens);
    });

    setup(() => hook({ extensions: '.css' }));

    teardown(() => {
      detachHook('.css');
      dropCache('./api/fixture/oceanic.css');
    });
  });

  suite('uses multiple extensions', () => {
    test('should provide tokens', () => {
      const tokens = require('./fixture/oceanic.css');
      assert(tokens);
    });

    test('should provide tokens', () => {
      const tokens = require('./fixture/oceanic.scss');
      assert(tokens);
    });

    setup(() => hook({ extensions: ['.css', '.scss'] }));

    teardown(() => {
      detachHook('.css');
      dropCache('./api/fixture/oceanic.css');
      dropCache('./api/fixture/oceanic.scss');
    });
  });
});
