'use strict'
const join = require('path').join
const fse = require('fs-extra')
const Persist = require('../index')
const providerHarness = require('./provider-harness')

function randDir () {
  return join('/tmp', Math.random().toString(36).substring(7))
}

describe('FS provider', () => {
  let tempDirectories = []
  let providerFactory = (config) => {
    config = (typeof config === 'object') ? config : {}
    config.token = null
    config.provider = 'fs'
    config.directory = randDir()
    tempDirectories.push(config.directory)
    return Persist(config)
  }
  providerHarness(providerFactory)

  after(() => {
    tempDirectories.forEach((dir) => {
      fse.remove(dir)
    })
  })
})
