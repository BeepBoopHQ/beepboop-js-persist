var assert = require('chai').assert
var Persist = require('../index')

describe('Memory provider', () => {
  it('should initialize', () => {
    var provider = Persist({ token: null })
    assert(typeof provider === 'object')
  })

  it('should set without a callback', function (done) {
    var provider = Persist({ token: null })

    assert.doesNotThrow(function () {
      provider.set(getKey(), 'value')

      done()
    })
  })

  describe('list keys', function () {
    it('should handle no keys', function (done) {
      var provider = Persist({ token: null })

      provider.list(function (err, keys) {
        assert.isNull(err)
        assert.isArray(keys)
        assert.lengthOf(keys, 0)

        done()
      })
    })

    it('should return keys after set', function (done) {
      var provider = Persist({ token: null })
      var keys = [getKey(), getKey()]

      provider.set(keys[0], 'beep', function (err) {
        assert.isNull(err)

        provider.set(keys[1], 'boop', function (err) {
          assert.isNull(err)

          provider.list(function (err, k) {
            assert.isNull(err)
            assert.isArray(k)
            assert.lengthOf(k, keys.length)

            done()
          })
        })
      })
    })

    it("shouldn't return a key after del", function (done) {
      var provider = Persist({ token: null })
      var key = getKey()

      provider.set(key, 'beep', function (err) {
        assert.isNull(err)

        provider.list(function (err, keys) {
          assert.isNull(err)
          assert.isArray(keys)
          assert.lengthOf(keys, 1)

          provider.del(key, function (err) {
            assert.isNull(err)

            provider.list(function (err, keys) {
              assert.isNull(err)
              assert.isArray(keys)
              assert.lengthOf(keys, 0)

              done()
            })
          })
        })
      })
    })

    it('should filter keys', function (done) {
      var provider = Persist({ token: null })
      var key1 = 'beep'
      var key2 = 'boop'
      var value = 'beepboop'

      provider.set(key1, value, function (err) {
        assert.isNull(err)

        provider.set(key2, value, function (err) {
          assert.isNull(err)

          provider.list('be', function (err, keys) {
            assert.isNull(err)
            assert.isArray(keys)
            assert.lengthOf(keys, 1)
            assert.equal(keys[0], key1)

            provider.list('bo', function (err, keys) {
              assert.isNull(err)
              assert.isArray(keys)
              assert.lengthOf(keys, 1)
              assert.equal(keys[0], key2)

              provider.list('b', function (err, keys) {
                assert.isNull(err)
                assert.isArray(keys)
                assert.lengthOf(keys, 2)
                assert.deepEqual(keys, [key1, key2])

                done()
              })
            })
          })
        })
      })
    })
  })

  describe('without serialize', function () {
    var config = { token: null }

    testMiss(config)
    testSetUndefined(config)
    testSetGetDelGet(config, null)
    testSetGetDelGet(config, 0)
    testSetGetDelGet(config, '')
    testSetGetDelGet(config, 'my value')
    testSetGetDelGet(config, { foo: 'bar', beep: ['boop', 'boop', 'boop'] })
    testMgetAllMisses(config)
    testMgetAllHits(config)
    testMgetHitAndMiss(config)
  })

  describe('with serialize', function () {
    var config = {
      token: null,
      serialize: true
    }

    testMiss(config)
    testSetUndefined(config)
    testSetGetDelGet(config, null)
    testSetGetDelGet(config, 0)
    testSetGetDelGet(config, '')
    testSetGetDelGet(config, 'my value')
    testSetGetDelGet(config, { foo: 'bar', beep: ['boop', 'boop', 'boop'] })
    testMgetAllMisses(config)
    testMgetAllHits(config)
    testMgetHitAndMiss(config)
  })

  function testSetGetDelGet (config, value) {
    it('should handle "' + value + '"', function (done) {
      var provider = Persist(config)
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
      var provider = Persist(config)

      provider.set(getKey(), undefined, function (err) {
        assert.isNotNull(err)

        done()
      })
    })
  }

  function testMiss (config) {
    it('should return undefined for misses', function (done) {
      var provider = Persist({ token: null })

      provider.get(getKey(), function (err, v) {
        assert.isNull(err)
        assert.isUndefined(v)

        done()
      })
    })
  }

  function testMgetAllMisses (config) {
    it('should handle an mget w/ misses', function (done) {
      var provider = Persist({ token: null })
      var keys = [getKey(), getKey()]

      provider.mget(keys, function (err, values) {
        assert.isNull(err)
        assert.deepEqual(values, [undefined, undefined])

        done()
      })
    })
  }

  function testMgetAllHits (config) {
    it('should handle an mget w/ all hits', function (done) {
      var provider = Persist({ token: null })
      var one = {
        key: getKey(),
        value: 1
      }
      var two = {
        key: getKey(),
        value: 1
      }

      provider.set(one.key, one.value, function (err) {
        assert.isNull(err)

        provider.set(two.key, two.value, function (err) {
          assert.isNull(err)

          provider.mget([one.key, two.key], function (err, values) {
            assert.isNull(err)
            assert.deepEqual(values, [one.value, two.value])

            done()
          })
        })
      })
    })
  }

  function testMgetHitAndMiss (config) {
    it('should handle an mget w/ hit and miss', function (done) {
      var provider = Persist({ token: null })
      var one = {
        key: getKey(),
        value: 1
      }
      var twoKey = getKey()

      provider.set(one.key, one.value, function (err) {
        assert.isNull(err)

        provider.mget([one.key, twoKey], function (err, values) {
          assert.isNull(err)
          assert.deepEqual(values, [one.value, undefined])

          done()
        })
      })
    })
  }
})

var idx = 0
function getKey () {
  return ['testkey', ++idx, Date.now()].join(':')
};
