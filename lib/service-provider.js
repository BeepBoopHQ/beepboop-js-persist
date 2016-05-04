var Wreck = require('wreck')

module.exports = function serviceProvider (config) {
  if (!config) throw new Error('Must set config for service provider')
  if (!config.token) throw new Error('Must set token for service provider')
  if (!config.url) throw new Error('Must set url for service provider')

  var wreck = Wreck.defaults({
    headers: { 'Authorization': 'Bearer ' + config.token },
    timeout: 10000
  })

  function wrap (value) {
    return config.serialize ? JSON.stringify(value) : value
  }

  function unwrap (value) {
    return config.serialize ? JSON.parse(value) : value
  }

  return {
    type: 'service',

    get: function (key, cb) {
      wreck.request('GET', config.url + '/persist/kv/' + key, {}, function (err, res) {
        if (err) return cb(err)
        if (res.statusCode === 404) return cb(null, undefined)

        wreck.read(res, {json: true}, function (err, body) {
          if (err) return cb(err)
          if (res.statusCode === 500 || res.statusCode === 400) return cb(new Error(body && body.error))
          if (res.statusCode !== 200) return cb(new Error('Unexpected response (' + res.statusCode + ')'))

          cb(null, unwrap(body.value))
        })
      })
    },
    mget: function (keys, cb) {
      var payload = JSON.stringify({ keys: keys })

      wreck.request('POST', config.url + '/persist/mget', {payload: payload}, function (err, res) {
        if (err) return cb(err)

        wreck.read(res, {json: true}, function (err, body) {
          if (err) return cb(err)
          if (res.statusCode === 500 || res.statusCode === 400) return cb(new Error(body && body.error))
          if (res.statusCode !== 200) return cb(new Error('Unexpected response (' + res.statusCode + ')'))

          var values = (body || []).map(function (result) {
            // getting a null is like getting a 404 on a single get
            if (result === null) {
              return undefined
            }

            return unwrap(result.value)
          })

          cb(null, values)
        })
      })
    },
    set: function (key, value, cb) {
      // can't serialize this - treat as an error
      if (value === undefined) {
        return cb(new Error('cannot set a value of undefined'))
      }

      var payload = JSON.stringify({ value: wrap(value) })

      wreck.request('PUT', config.url + '/persist/kv/' + key, {payload: payload}, function (err, res) {
        if (err) return cb(err)
        if (res.statusCode === 404) return cb(null, '')

        wreck.read(res, {json: true}, function (err, body) {
          if (err) return cb(err)
          if (res.statusCode === 500 || res.statusCode === 400) return cb(new Error(body && body.error))
          if (res.statusCode !== 200) return cb(new Error('Unexpected response (' + res.statusCode + ')'))

          cb(null, unwrap(body.value))
        })
      })
    },
    del: function (key, cb) {
      wreck.request('DELETE', config.url + '/persist/kv/' + key, {}, function (err, res) {
        if (err) return cb(err)
        if (res.statusCode === 404) return cb(null)
        if (res.statusCode === 200) return cb(null)

        wreck.read(res, {json: true}, function (err, body) {
          if (err) return cb(err)
          if (res.statusCode === 500 || res.statusCode === 400) return cb(new Error(body && body.error))

          cb(new Error('Unexpected response (' + res.statusCode + ')'))
        })
      })
    },
    list: function (cb) {
      wreck.request('GET', config.url + '/persist/kv', {}, function (err, res) {
        if (err) return cb(err)
        if (res.statusCode === 404) return cb(null, [])

        wreck.read(res, {json: true}, function (err, body) {
          if (err) return cb(err)
          if (res.statusCode === 500 || res.statusCode === 400) return cb(new Error(body && body.error))
          if (res.statusCode !== 200) return cb(new Error('Unexpected response (' + res.statusCode + ')'))

          cb(null, body)
        })
      })
    }
  }
}
