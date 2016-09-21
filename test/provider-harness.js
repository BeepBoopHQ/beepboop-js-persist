'use strict'
const assert = require('chai').assert

module.exports = (providerFactory) => {
  describe('harness', () => {
    it('should initialize', () => {
      let provider = providerFactory()
      assert(typeof provider === 'object')
    })

    it('should set without a callback', function (done) {
      let provider = providerFactory()

      assert.doesNotThrow(function () {
        provider.set(getKey(), 'value')
        done()
      })
    })

    describe('list keys', function () {
      it('should handle no keys', function (done) {
        let provider = providerFactory()

        provider.list(function (err, keys) {
          assert.isNull(err)
          assert.isArray(keys)
          assert.lengthOf(keys, 0)

          done()
        })
      })

      it('should return keys after set', function (done) {
        let provider = providerFactory()
        let keys = [getKey(), getKey()]

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
        let provider = providerFactory()
        let key = getKey()

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
        let provider = providerFactory()
        let key1 = 'beep'
        let key2 = 'boop'
        let value = 'beepboop'

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
                  assert.deepEqual(keys.sort(), [key1, key2].sort())

                  done()
                })
              })
            })
          })
        })
      })
    })

    describe('without serialize', function () {
      let config = { serialize: false }

      testMiss(config)
      testSetUndefined(config)
      testSetNotStringNotSerialized(config, null)
      testSetNotStringNotSerialized(config, 0)
      testSetGetDelGet(config, '', '')
      testSetGetDelGet(config, 'my value', 'my value')
      testSetNotStringNotSerialized(config, { foo: 'bar', beep: ['boop', 'boop', 'boop'] })
      testMgetAllMisses(config)
      testMgetAllHits(config)
      testMgetHitAndMiss(config)
    })

    describe('with serialize', function () {
      let config = { serialize: true }

      testMiss(config)
      testSetUndefined(config)
      testSetGetDelGet(config, null, null)
      testSetGetDelGet(config, 0, 0)
      testSetGetDelGet(config, '', '')
      testSetGetDelGet(config, 'my value', 'my value')
      let o = { foo: 'bar', beep: ['boop', 'boop', 'boop'] }
      testSetGetDelGet(config, o, o)
      testMgetAllMisses(config)
      testMgetAllHits(config)
      testMgetHitAndMiss(config)
    })

    function testSetGetDelGet (config, value, expected) {
      it('should handle "' + value + '"', function (done) {
        let provider = providerFactory(config)
        let key = getKey()

        provider.set(key, value, function (err, v) {
          assert.isNull(err)
          assert.deepEqual(v, expected)

          provider.get(key, function (err, v) {
            assert.isNull(err)
            assert.deepEqual(v, expected)

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

    function testSetNotStringNotSerialized (config, value) {
      it('should not allow setting non-string "' + value + '"', function (done) {
        let provider = providerFactory(config)

        provider.set(getKey(), value, function (err) {
          assert.isNotNull(err)

          done()
        })
      })
    }

    function testSetUndefined (config) {
      it('should not allow setting undefined', function (done) {
        let provider = providerFactory(config)

        provider.set(getKey(), undefined, function (err) {
          assert.isNotNull(err)

          done()
        })
      })
    }

    function testMiss (config) {
      it('should return undefined for misses', function (done) {
        let provider = providerFactory()

        provider.get(getKey(), function (err, v) {
          assert.isNull(err)
          assert.isUndefined(v)

          done()
        })
      })
    }

    function testMgetAllMisses (config) {
      it('should handle an mget w/ misses', function (done) {
        let provider = providerFactory()
        let keys = [getKey(), getKey()]

        provider.mget(keys, function (err, values) {
          assert.isNull(err)
          assert.deepEqual(values, [undefined, undefined])

          done()
        })
      })
    }

    function testMgetAllHits (config) {
      it('should handle an mget w/ all hits', function (done) {
        let provider = providerFactory()
        let one = {
          key: getKey(),
          value: 1
        }
        let two = {
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
        let provider = providerFactory()
        let one = {
          key: getKey(),
          value: 1
        }
        let twoKey = getKey()

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

  let idx = 0
  function getKey () {
    return ['testkey', ++idx, Date.now()].join(':')
  }
}
