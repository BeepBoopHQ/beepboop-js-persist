'use strict'
const restify = require('restify')
const Persist = require('../index')

module.exports = () => {
  let server = restify.createServer()
  let stores = {}

  function store (namespace) {
    if (!stores[namespace]) {
      stores[namespace] = Persist()
    }
    return stores[namespace]
  }

  server.use(restify.authorizationParser())
  server.use(restify.bodyParser())
  server.use(restify.queryParser())

  server.get('/persist/kv/:key', (req, res) => {
    let key = req.params.key
    let ns = req.authorization.credentials
    store(ns).get(key, (err, val) => {
      if (err) return res.send(500, { error: err })
      if (val === undefined) return res.send(404)
      res.send({
        key: key,
        value: val
      })
    })
  })

  server.put('/persist/kv/:key', (req, res) => {
    let key = req.params.key
    let ns = req.authorization.credentials
    let body = req.body
    store(ns).set(key, body.value, (err, val) => {
      if (err) return res.send(500, { error: err })
      res.send({
        key: key,
        value: val
      })
    })
  })

  server.del('/persist/kv/:key', (req, res) => {
    let key = req.params.key
    let ns = req.authorization.credentials
    store(ns).del(key, (err) => {
      if (err) return res.send(500)
      res.send(200)
    })
  })

  server.post('/persist/mget', (req, res) => {
    let ns = req.authorization.credentials
    let keys = req.body.keys
    store(ns).mget(req.body.keys, (err, values) => {
      if (err) return res.send(500)
      let resp = []
      for (let i = 0; i < keys.length; i++) {
        if (values[i] === undefined) {
          resp.push(null)
        } else {
          resp.push({ key: keys[i], value: values[i] })
        }
      }
      res.send(resp)
    })
  })

  server.get('/persist/kv', (req, res) => {
    let ns = req.authorization.credentials
    let before = req.params.before
    store(ns).list(before, (err, keys) => {
      if (err) return res.send(500)
      res.send(keys)
    })
  })

  return server
}
