var Wreck = require('wreck')

module.exports = function NewKV (token, serviceURL) {
  if (!token) token = process.env.BEEPBOOP_TOKEN
  if (!serviceURL) serviceURL = 'http://persist'
  return (token) ? serviceProvider(token, serviceURL) : memoryProvider()
}

function serviceProvider (token, serviceURL) {
  var wreck = Wreck.defaults({
    headers: { 'Authorization': 'Bearer ' + token },
    timeout: 1000
  })

  return {
    get: function (key, cb) {
      wreck.request('GET', serviceURL + '/kv/' + key, {}, function (err, res) {
        if (err) return cb(err)
        if (res.statusCode === 404) return cb(null, '')
        wreck.read(res, {json: true}, function (err, body) {
          if (err) return cb(err)
          if (res.statusCode === 200) return cb(null, body.value)
          if (res.statusCode === 500 || res.statusCode === 400) return cb(new Error(body.error))
          return cb(new Error('Unexpected response (' + res.statusCode + ')'))
        })
      })
    },
    set: function (key, value, cb) {
      wreck.request('PUT', serviceURL + '/kv/' + key, {payload: {value: value + ''}}, function (err, res) {
        if (err) return cb(err)
        if (res.statusCode === 404) return cb(null, '')
        wreck.read(res, {json: true}, function (err, body) {
          if (err) return cb(err)
          if (res.statusCode === 200) return cb(null, body.value)
          if (res.statusCode === 500 || res.statusCode === 400) return cb(new Error(body.error))
          return cb(new Error('Unexpected response (' + res.statusCode + ')'))
        })
      })
    },
    del: function (key, cb) {
      wreck.request('DELETE', serviceURL + '/kv/' + key, {}, function (err, res) {
        if (err) return cb(err)
        if (res.statusCode === 404) return cb(null)
        if (res.statusCode === 200) return cb(null)
        wreck.read(res, {json: true}, function (err, body) {
          if (err) return cb(err)
          if (res.statusCode === 500 || res.statusCode === 400) return cb(new Error(body.error))
          return cb(new Error('Unexpected response (' + res.statusCode + ')'))
        })
      })
    },
    list: function (cb) {
      wreck.request('GET', serviceURL + '/kv', {}, function (err, res) {
        if (err) return cb(err)
        if (res.statusCode === 404) return cb(null, [])
        wreck.read(res, {json: true}, function (err, body) {
          if (err) return cb(err)
          if (res.statusCode === 200) return cb(null, body)
          if (res.statusCode === 500 || res.statusCode === 400) return cb(new Error(body.error))
          return cb(new Error('Unexpected response (' + res.statusCode + ')'))
        })
      })
    }
  }
}

function memoryProvider () {
  var store = {}
  console.log('USING PERSIST IN MEMORY PROVIDER')

  return {
    get: function (key, cb) {
      return cb(null, store[key])
    },
    put: function (key, value, cb) {
      store[key] = value
      return cb(null, store[key])
    },
    del: function (key, cb) {
      delete store[key]
      cb()
    },
    list: function (cb) {
      cb(null, Object.keys(store))
    }
  }
}
