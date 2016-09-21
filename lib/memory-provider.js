'use strict'
module.exports = function memoryProvider (config) {
  let serialize = config && !!config.serialize

  let store = {}

  function getValue (key) {
    let value = store[key]
    if (value === undefined) {
      return value
    }

    return serialize ? JSON.parse(value) : value
  }

  return {
    type: 'memory',

    get: function (key, cb) {
      cb(null, getValue(key))

      return this
    },
    mget: function (keys, cb) {
      let values = (keys || []).map(function (key) {
        return getValue(key)
      })

      cb(null, values)
    },
    set: function (key, value, cb) {
      // can't serialize this - treat as an error
      if (value === undefined) {
        return cb(new Error('cannot set a value of undefined'))
      }

      if (!serialize && typeof value !== 'string') {
        return cb(new Error('value may only be string when serialize=false, not ' + typeof value))
      }

      store[key] = serialize ? JSON.stringify(value) : value

      cb(null, value)
    },
    del: function (key, cb) {
      delete store[key]
      cb(null)
    },
    list: function (before, cb) {
      let keys = Object.keys(store)

      if (typeof before === 'string') {
        keys = keys.filter(function (key) {
          let regex = new RegExp('^' + before)
          return regex.test(key)
        })
      }

      cb(null, keys)
    }
  }
}
