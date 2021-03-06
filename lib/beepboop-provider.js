'use strict'
const Wreck = require('wreck')
const url = require('url')

module.exports = function serviceProvider (config) {
  if (!config) throw new Error('Must set config for service provider')
  if (!config.token) throw new Error('Must set token for service provider')
  if (!config.url) throw new Error('Must set url for service provider')

  let wreck = Wreck.defaults({
    baseUrl: config.url,
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
    type: 'beepboop',

    get: function (key, cb) {
      wreck.request('GET', '/persist/kv/' + key, null, function (err, res) {
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
      let payload = JSON.stringify({ keys: keys })
      let headers = { 'Content-Type': 'application/json' }

      wreck.request('POST', '/persist/mget', { payload, headers }, function (err, res) {
        if (err) return cb(err)

        wreck.read(res, {json: true}, function (err, body) {
          if (err) return cb(err)
          if (res.statusCode === 500 || res.statusCode === 400) return cb(new Error(body && body.error))
          if (res.statusCode !== 200) return cb(new Error('Unexpected response (' + res.statusCode + ')'))

          let values = (body || []).map(function (result) {
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

      if (!config.serialize && typeof value !== 'string') {
        return cb(new Error(`value may only be string when serialize=false, not ${typeof value}`))
      }

      let payload = JSON.stringify({ value: wrap(value) })
      let headers = { 'Content-Type': 'application/json' }

      wreck.request('PUT', '/persist/kv/' + key, { payload, headers }, function (err, res) {
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
      wreck.request('DELETE', '/persist/kv/' + key, null, function (err, res) {
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
    list: function (begins, cb) {
      let reqUrl = {
        pathname: '/persist/kv'
      }
      if (typeof begins === 'string') {
        reqUrl.query = { begins: begins }
      }

      wreck.request('GET', url.format(reqUrl), null, function (err, res) {
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
