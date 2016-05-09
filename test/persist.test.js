var assert = require('chai').assert
var Persist = require('../index')

describe('Beep Boop Persist', function () {
  it('should create a memory provider when token is not present', function () {
    var persist = Persist({
      token: null,
      url: null
    })

    assert.equal(persist.type, 'memory')
    assertInterface(persist)
  })

  it('should create a beepboop provider when token and url are present', function () {
    var persist = Persist({
      token: 'TOKEN',
      url: 'http://persist'
    })

    assert.equal(persist.type, 'beepboop')
    assertInterface(persist)
  })

  it('should allow overriding provider w/ memory', function () {
    var persist = Persist({
      provider: 'memory',
      token: 'TOKEN',
      url: 'http://persist'
    })

    assert.equal(persist.type, 'memory')
    assertInterface(persist)
  })

  it('should deafult to memory when token is missing', function () {
    var persist = Persist({
      token: null,
      url: 'http://persist'
    })

    assert.equal(persist.type, 'memory')
    assertInterface(persist)
  })

  it('should deafult to memory when url is missing', function () {
    var persist = Persist({
      token: 'TOKEN',
      url: null
    })

    assert.equal(persist.type, 'memory')
    assertInterface(persist)
  })

  it('should deafult to memory if an invalid provider is specified', function () {
    var persist = Persist({
      provider: 'invalid'
    })

    assert.equal(persist.type, 'memory')
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
