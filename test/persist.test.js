'use strict'
const assert = require('chai').assert
const Persist = require('../index')

describe('Beep Boop Persist', function () {
  it('should create a memory provider when token is not present', function () {
    let persist = Persist({
      token: null,
      url: null
    })

    assert.equal(persist.type, 'memory')
    assertInterface(persist)
  })

  it('should create a beepboop provider when token and url are present', function () {
    let persist = Persist({
      token: 'TOKEN',
      url: 'http://persist'
    })

    assert.equal(persist.type, 'beepboop')
    assertInterface(persist)
  })

  it('should allow overriding provider w/ memory', function () {
    let persist = Persist({
      provider: 'memory',
      token: 'TOKEN',
      url: 'http://persist'
    })

    assert.equal(persist.type, 'memory')
    assertInterface(persist)
  })

  it('should deafult to memory when token is missing', function () {
    let persist = Persist({
      token: null,
      url: 'http://persist'
    })

    assert.equal(persist.type, 'memory')
    assertInterface(persist)
  })

  it('should deafult to memory when url is missing', function () {
    let persist = Persist({
      token: 'TOKEN',
      url: null
    })

    assert.equal(persist.type, 'memory')
    assertInterface(persist)
  })

  it('should deafult to memory if an invalid provider is specified', function () {
    let persist = Persist({
      provider: 'invalid'
    })

    assert.equal(persist.type, 'memory')
    assertInterface(persist)
  })

  it('should allow overriding provider w/ fs', function () {
    let persist = Persist({
      provider: 'fs',
      token: 'TOKEN'
    })

    assert.equal(persist.type, 'fs')
    assertInterface(persist)
  })

  function assertInterface (persist) {
    assert.isFunction(persist.get)
    assert.isFunction(persist.mget)
    assert.isFunction(persist.set)
    assert.isFunction(persist.del)
    assert.isFunction(persist.list)
  }
})
