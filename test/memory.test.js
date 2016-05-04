var assert = require('chai').assert
var MemoryProvider = require('../lib/memory-provider')

describe('Memory provider', () => {
  it('should initialize', () => {
    var memory = MemoryProvider()
    assert(typeof memory === 'object')
  })

  it('should set without a callback', function (done) {
    var memory = MemoryProvider()

    assert.doesNotThrow(function () {
      memory.set(getKey(), 'value')

      done()
    })
  })

  describe('without serialize', function () {
    var config = {}

    testMiss(config)
    testSetUndefined(config)
    testSetGetDelGet(config, null)
    testSetGetDelGet(config, 0)
    testSetGetDelGet(config, '')
    testSetGetDelGet(config, 'my value')
    testSetGetDelGet(config, { foo: 'bar', beep: ['boop', 'boop', 'boop'] })
  })

  describe('with serialize', function () {
    var config = {
      serialize: true
    }

    testMiss(config)
    testSetUndefined(config)
    testSetGetDelGet(config, null)
    testSetGetDelGet(config, 0)
    testSetGetDelGet(config, '')
    testSetGetDelGet(config, 'my value')
    testSetGetDelGet(config, { foo: 'bar', beep: ['boop', 'boop', 'boop'] })
  })

  function testSetGetDelGet (config, value) {
    it('should handle "' + value + '"', function (done) {
      var provider = MemoryProvider(config)
      var key = getKey()

      provider.set(key, value, function (err, v) {
        assert.isNull(err)
        assert.deepEqual(v, value)

        provider.get(key, function (err, v) {
          assert.isNull(err)
          assert.deepEqual(v, value)

          provider.del(key, function (err) {
            assert.isNull(err)

            provider.get(key, function (err, v) {
              assert.isNull(err)
              assert.isUndefined(v)

              done()
            })
          })
        })
      })
    })
  }

  function testSetUndefined (config) {
    it('should not allow setting undefined', function (done) {
      var provider = MemoryProvider(config)

      provider.set(getKey(), undefined, function (err) {
        assert.isNotNull(err)

        done()
      })
    })
  }

  function testMiss (config) {
    it('should return undefined for misses', function (done) {
      var memory = MemoryProvider()

      memory.get(getKey(), function (err, v) {
        assert.isNull(err)
        assert.isUndefined(v)

        done()
      })
    })
  }
})

var idx = 0
function getKey () {
  return ['testkey', ++idx, Date.now()].join(':')
};
