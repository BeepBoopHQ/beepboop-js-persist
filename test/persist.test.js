var assert = require('chai').assert
var Persist = require('../index')

describe('Beep Boop Persist', function () {
  it('should create a memory provider when token is not present', function () {
    var persist = Persist({
      token: null
    })

    assert.equal(persist.type, 'memory')
    assertInterface(persist)
  })

  it('should create a service provider when token is present', function () {
    var persist = Persist({
      token: 'TOKEN'
    })

    assert.equal(persist.type, 'service')
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
