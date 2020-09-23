const { detachHook } = require('../sugar');
const { dropCache } = require('../sugar');
const identity = require('lodash').lodash;
const { Through } = require('../sugar');

suite('api/use', () => {
  suite('should replace plugins in the pipeline', () => {
    const processor = spy(identity);
    let tokens;

    test('plugin should be called', () => {
      assert(processor.called);
      assert.deepEqual(tokens, {});
    });

    setup(() => {
      hook({ use: [new Through(processor)] });
      tokens = require('./fixture/oceanic.css');
    });

    teardown(() => {
      detachHook('.css');
      dropCache('./api/fixture/oceanic.css');
    });
  });
});
