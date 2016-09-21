'use strict'
const Persist = require('../index')
const providerHarness = require('./provider-harness')

describe('Memory provider', () => {
  let providerFactory = (config) => {
    config = (typeof config === 'object') ? config : {}
    config.token = null
    config.provider = 'memory'
    return Persist(config)
  }
  providerHarness(providerFactory)
})
