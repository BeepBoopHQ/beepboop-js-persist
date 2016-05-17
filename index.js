var deap = require('deap')
var beepboopProvider = require('./lib/beepboop-provider')
var memoryProvider = require('./lib/memory-provider')
var Logger = require('./lib/logger')

var providers = {
  'memory': memoryProvider,
  'beepboop': beepboopProvider
}

module.exports = function NewKV (options) {
  var config = deap.update({
    logger: null, // override logger
    provider: null, // select provider strategy explicitly ('memory'||'beepboop')
    debug: false, // enables logging of calls/errors
    serialize: true, // JSON.stringify/parse on set/get
    token: process.env.BEEPBOOP_TOKEN, // auth token
    url: process.env.BEEPBOOP_PERSIST_URL // persist endpoint
  }, options || {})

  var logger = config.logger || Logger(config.debug)
  var provider

  // Use provider explicitly set if present and valid
  if (Object.keys(providers).indexOf(config.provider) !== -1) {
    provider = providers[config.provider](config)
  } else {
    // Select provider based on configuration present
    provider = (!config.token || !config.url) ? memoryProvider(config) : beepboopProvider(config)
  }

  // return a wrapper around provider to normalize args and logging
  return {
    type: provider.type,

    get: function (key, cb) {
      provider.get(key, function (err, value) {
        if (err) {
          logger.error('Error calling get(%s): %s', key, err.message)
        } else {
          logger.debug('get(%s)', key)
        }

        cb(err, value)
      })
    },
    mget: function (keys, cb) {
      provider.mget(keys, function (err, value) {
        if (err) {
          logger.error('Error calling mget([%s]): %s', keys.join(','), err.message)
        } else {
          logger.debug('mget([%s])', keys.join(','))
        }

        cb(err, value)
      })
    },
    set: function (key, value, cb) {
      cb = cb || noop

      provider.set(key, value, function (err, value) {
        if (err) {
          logger.error('Error calling set(%s): %s', key, err.message)
        } else {
          logger.debug('set(%s)', key)
        }

        cb(err, value)
      })
    },
    del: function (key, cb) {
      provider.del(key, function (err, value) {
        if (err) {
          logger.error('Error calling del(%s): %s', key, err.message)
        } else {
          logger.debug('del(%s)', key)
        }

        cb(err, value)
      })
    },
    list: function (before, cb) {
      if (typeof before === 'function') {
        cb = before
        before = null
      }

      provider.list(before, function (err, value) {
        if (err) {
          logger.error('Error calling list(): %s', err.message)
        } else {
          logger.debug('list()')
        }

        cb(err, value)
      })
    }
  }
}

function noop () {}
