var deap = require('deap')
var serviceProvider = require('./lib/service-provider')
var memoryProvider = require('./lib/memory-provider')
var Logger = require('./lib/logger')

module.exports = function NewKV (options) {
  var config = deap.update({
    debug: false,
    serialize: true,
    token: process.env.BEEPBOOP_TOKEN,
    url: 'http://persist'
  }, options || {})

  var logger = config.logger || Logger(config.debug)
  var provider = !config.token ? memoryProvider(config) : serviceProvider(config)

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
