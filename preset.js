const { basename } = require('path');
const debug = require('debug')('css-modules:preset');
const { dirname } = require('path');
const seekout = require('seekout');
const hook = require('./lib/index');

const preset = seekout('cmrh.conf.js', dirname(module.parent.filename));

if (preset) {
  debug(`→ ${basename(preset)}`);
  /* eslint-disable global-require, import/no-dynamic-require */
  hook(require(preset));
  /* eslint-enable global-require, import/no-dynamic-require */
} else {
  debug('→ defaults');
  hook({});
}
