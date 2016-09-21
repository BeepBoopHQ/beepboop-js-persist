'use strict'
const Persist = require('../index')
const providerHarness = require('./provider-harness')

describe('Beep Boop Persist provider', () => {
  let server = require('./mock-server')()
  let port = null

  before((done) => {
    getPort((freePort) => {
      port = freePort
      server.listen(port, () => {
        done()
      })
    })
  })

  let providerFactory = (config) => {
    config = (typeof config === 'object') ? config : {}
    config.token = null
    config.provider = 'beepboop'
    config.token = Math.random().toString(36).substring(7)
    config.url = `http://localhost:${port}`
    return Persist(config)
  }
  providerHarness(providerFactory)

  after(() => {
    server.close()
  })
})

// utility code for getting an open port
let net = require('net')
let portrange = 45032

function getPort (cb) {
  let port = portrange
  portrange += 1

  let server = net.createServer()
  server.listen(port, function () {
    server.once('close', function () {
      cb(port)
    })
    server.close()
  })
  server.on('error', function () {
    getPort(cb)
  })
}
