
module.exports = function memoryProvider (config) {
  var serialize = config && !!config.serialize

  var store = {}

  function getValue (key) {
    var value = store[key]
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
      var values = (keys || []).map(function (key) {
        return getValue(key)
      })

      cb(null, values)
    },
    set: function (key, value, cb) {
      // can't serialize this - treat as an error
      if (value === undefined) {
        return cb(new Error('cannot set a value of undefined'))
      }

      store[key] = serialize ? JSON.stringify(value) : value

      cb(null, value)
    },
    del: function (key, cb) {
      delete store[key]
      cb(null)
    },
    list: function (before, cb) {
      var keys = Object.keys(store)

      if (typeof before === 'string') {
        keys = keys.filter(function (key) {
          var regex = new RegExp('^' + before)
          return regex.test(key)
        })
      }

      cb(null, keys)
    }
  }
}
