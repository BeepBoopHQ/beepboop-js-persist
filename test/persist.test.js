var assert = require('chai').assert
var Persist = require('../index')

describe('Beep Boop Persist', function () {
  it('should create a memory provider when token is not present', function () {
    var persist = Persist({
      token: null
    })

    assert.equal(persist.type, 'memory')
  })

  it('should create a service provider when token is present', function () {
    var persist = Persist({
      token: 'TOKEN'
    })

    assert.equal(persist.type, 'service')
  })
})
