
module.exports = function memoryProvider (options) {
  var serialize = options && options.serialize

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

      return this
    },
    set: function (key, value, cb) {
      // can't serialize this - treat as an error
      if (value === undefined) {
        if (cb) return cb(new Error('cannot set a value of undefined'))
      }

      store[key] = serialize ? JSON.stringify(value) : value

      if (cb) cb(null, value)

      return this
    },
    del: function (key, cb) {
      delete store[key]
      cb(null)

      return this
    },
    list: function (cb) {
      cb(null, Object.keys(store))

      return this
    }
  }
}
