var assert = require('chai').assert
var nock = require('nock')
var Persist = require('../index')
var BeepBoopProvider = require('../lib/beepboop-provider')

describe('Service provider', () => {
  it('should require config', () => {
    assert.throws(function () {
      BeepBoopProvider()
    })
  })

  it('should set without a callback', function (done) {
    var config = {
      provider: 'beepboop',
      token: 'TOKEN',
      url: 'http://persist',
      serialize: false
    }
    var provider = Persist(config)
    var value = 'value'
    var key = getKey()

    var set = nock(config.url)
      .put('/persist/kv/' + key, JSON.stringify({ value: value }))
      .reply(200, {
        key: key,
        value: value
      })

    assert.doesNotThrow(function () {
      provider.set(key, 'value')
      assert.isTrue(set.isDone())

      done()
    })
  })

  describe('list keys', function () {
    var config = {
      provider: 'beepboop',
      token: 'TOKEN',
      url: 'http://persist',
      serialize: false
    }

    it('should handle no keys', function (done) {
      var provider = Persist(config)

      var getKeys = nock(config.url)
        .get('/persist/kv')
        .reply(200, [])

      provider.list(function (err, keys) {
        assert.isNull(err)
        assert.isArray(keys)
        assert.lengthOf(keys, 0)
        assert.isTrue(getKeys.isDone())

        done()
      })
    })

    it('should return keys after set', function (done) {
      var provider = Persist(config)
      var keys = [getKey(), getKey()]
      var values = ['beep', 'boop']

      var set1 = nock(config.url)
        .put('/persist/kv/' + keys[0], JSON.stringify({ value: values[0] }))
        .reply(200, {
          key: keys[0],
          value: values[0]
        })

      var set2 = nock(config.url)
        .put('/persist/kv/' + keys[1], JSON.stringify({ value: values[1] }))
        .reply(200, {
          key: keys[1],
          value: values[1]
        })

      var getKeys = nock(config.url)
        .get('/persist/kv')
        .reply(200, keys)

      provider.set(keys[0], values[0], function (err) {
        assert.isNull(err)
        assert.isTrue(set1.isDone())

        provider.set(keys[1], values[1], function (err) {
          assert.isNull(err)
          assert.isTrue(set2.isDone())

          provider.list(function (err, k) {
            assert.isNull(err)
            assert.isArray(k)
            assert.lengthOf(k, keys.length)
            assert.isTrue(getKeys.isDone())

            done()
          })
        })
      })
    })

    it("shouldn't return a key after del", function (done) {
      var provider = Persist(config)
      var key = getKey()
      var value = 'beep'

      var set = nock(config.url)
        .put('/persist/kv/' + key, JSON.stringify({ value: value }))
        .reply(200, {
          key: key,
          value: value
        })

      var getKeys1 = nock(config.url)
        .get('/persist/kv')
        .reply(200, [key])

      var del = nock(config.url)
        .delete('/persist/kv/' + key)
        .reply(200)

      var getKeys2 = nock(config.url)
        .get('/persist/kv')
        .reply(200, [])

      provider.set(key, 'beep', function (err) {
        assert.isNull(err)
        assert.isTrue(set.isDone())

        provider.list(function (err, keys) {
          assert.isNull(err)
          assert.isArray(keys)
          assert.lengthOf(keys, 1)
          assert.isTrue(getKeys1.isDone())

          provider.del(key, function (err) {
            assert.isNull(err)
            assert.isTrue(del.isDone())

            provider.list(function (err, keys) {
              assert.isNull(err)
              assert.isArray(keys)
              assert.lengthOf(keys, 0)
              assert.isTrue(getKeys2.isDone())

              done()
            })
          })
        })
      })
    })

    it('should filter keys', function (done) {
      var provider = Persist(config)
      var key1 = 'beep'
      var key2 = 'boop'
      var value = 'beepboop'
      var filter1 = 'be'
      var filter2 = 'bo'
      var filter3 = 'b'

      var set1 = nock(config.url)
        .put('/persist/kv/' + key1, JSON.stringify({ value: value }))
        .reply(200, {
          key: key1,
          value: value
        })

      var set2 = nock(config.url)
        .put('/persist/kv/' + key2, JSON.stringify({ value: value }))
        .reply(200, {
          key: key2,
          value: value
        })

      var getKeys1 = nock(config.url)
        .get('/persist/kv?before=' + filter1)
        .reply(200, [key1])

      var getKeys2 = nock(config.url)
        .get('/persist/kv?before=' + filter2)
        .reply(200, [key2])

      var getKeys3 = nock(config.url)
        .get('/persist/kv?before=' + filter3)
        .reply(200, [key1, key2])

      provider.set(key1, value, function (err) {
        assert.isNull(err)
        assert.isTrue(set1.isDone())

        provider.set(key2, value, function (err) {
          assert.isNull(err)
          assert.isTrue(set2.isDone())

          provider.list('be', function (err, keys) {
            assert.isNull(err)
            assert.isArray(keys)
            assert.lengthOf(keys, 1)
            assert.equal(keys[0], key1)
            assert.isTrue(getKeys1.isDone())

            provider.list('bo', function (err, keys) {
              assert.isNull(err)
              assert.isArray(keys)
              assert.lengthOf(keys, 1)
              assert.equal(keys[0], key2)
              assert.isTrue(getKeys2.isDone())

              provider.list('b', function (err, keys) {
                assert.isNull(err)
                assert.isArray(keys)
                assert.lengthOf(keys, 2)
                assert.deepEqual(keys, [key1, key2])
                assert.isTrue(getKeys3.isDone())

                done()
              })
            })
          })
        })
      })
    })
  })

  describe('without serialize', function () {
    var config = {
      provider: 'beepboop',
      token: 'TOKEN',
      url: 'http://persist',
      serialize: false
    }

    testSetUndefined(config)
    testMiss(config)
    testSetGetDelGet(config, null)
    testSetGetDelGet(config, 0)
    testSetGetDelGet(config, '')
    testSetGetDelGet(config, 'my value')
    testSetGetDelGet(config, { foo: 'bar', beep: ['boop', 'boop', 'boop'] })
    testMgetAllMisses(config)
    testMgetHitAndMiss(config)
    testMgetAllHits(config)
  })

  describe('with serialize', function () {
    var config = {
      provider: 'beepboop',
      token: 'TOKEN',
      url: 'http://persist',
      serialize: true
    }

    testSetUndefined(config)
    testMiss(config)
    testSetGetDelGet(config, null)
    testSetGetDelGet(config, 0)
    testSetGetDelGet(config, '')
    testSetGetDelGet(config, 'my value')
    testSetGetDelGet(config, { foo: 'bar', beep: ['boop', 'boop', 'boop'] })
    testMgetAllMisses(config)
    testMgetHitAndMiss(config)
    testMgetAllHits(config)
  })

  function testSetGetDelGet (config, value) {
    it('should handle "' + value + '"', function (done) {
      var service = Persist(config)
      var key = getKey()
      var preparedValue = config.serialize ? JSON.stringify(value) : value

      var set = nock(config.url)
        .put('/persist/kv/' + key, JSON.stringify({ value: preparedValue }))
        .reply(200, {
          key: key,
          value: preparedValue
        })

      var get = nock(config.url)
        .get('/persist/kv/' + key)
        .reply(200, {
          key: key,
          value: preparedValue
        })

      var del = nock(config.url)
        .delete('/persist/kv/' + key)
        .reply(200)

      service.set(key, value, function (err, v) {
        assert.isNull(err)
        assert.deepEqual(v, value)
        assert.isTrue(set.isDone())

        service.get(key, function (err, v) {
          assert.isNull(err)
          assert.deepEqual(v, value)
          assert.isTrue(get.isDone())

          service.del(key, function (err) {
            assert.isNull(err)
            assert.isTrue(del.isDone())

            var get2 = nock(config.url)
              .get('/persist/kv/' + key)
              .reply(404)

            service.get(key, function (err, v) {
              assert.isNull(err)
              assert.isTrue(get2.isDone())
              assert.isUndefined(v)

              done()
            })
          })
        })
      })
    })
  }

  function testMiss (config) {
    it('should return undefined for misses', function (done) {
      var provider = Persist(config)
      var key = getKey()

      var get = nock(config.url)
        .get('/persist/kv/' + key)
        .reply(404)

      provider.get(key, function (err, v) {
        assert.isNull(err)
        assert.isUndefined(v)
        assert.isTrue(get.isDone())

        done()
      })
    })
  }

  function testSetUndefined (config) {
    it('should not allow setting undefined', function (done) {
      var service = Persist(config)

      service.set(getKey(), undefined, function (err) {
        assert.isNotNull(err)

        done()
      })
    })
  }

  function testMgetAllMisses (config) {
    it('should handle an mget w/ misses', function (done) {
      var provider = Persist(config)
      var keys = [getKey(), getKey()]

      var mget = nock(config.url)
        .post('/persist/mget', JSON.stringify({ keys: keys }))
        .reply(200, [null, null])

      provider.mget(keys, function (err, values) {
        assert.isNull(err)
        assert.deepEqual(values, [undefined, undefined])
        assert.isTrue(mget.isDone())

        done()
      })
    })
  }

  function testMgetHitAndMiss (config) {
    it('should handle an mget w/ hit and miss', function (done) {
      var provider = Persist(config)
      var one = {
        key: getKey(),
        value: 1
      }
      var twoKey = getKey()
      var keys = [one.key, twoKey]
      var preparedValue = config.serialize ? JSON.stringify(one.value) : one.value

      var set = nock(config.url)
        .put('/persist/kv/' + one.key, JSON.stringify({ value: preparedValue }))
        .reply(200, {
          key: one.key,
          value: preparedValue
        })

      var mget = nock(config.url)
        .post('/persist/mget', JSON.stringify({ keys: keys }))
        .reply(200, [
          {
            key: one.key,
            value: one.value
          },
          null
        ])

      provider.set(one.key, one.value, function (err) {
        assert.isNull(err)
        assert.isTrue(set.isDone())

        provider.mget(keys, function (err, values) {
          assert.isNull(err)
          assert.deepEqual(values, [one.value, undefined])
          assert.isTrue(mget.isDone())

          done()
        })
      })
    })
  }

  function testMgetAllHits (config) {
    it('should handle an mget w/ all hits', function (done) {
      var provider = Persist(config)
      var one = {
        key: getKey(),
        value: 1
      }
      one.preparedValue = config.serialize ? JSON.stringify(one.value) : one.value
      var two = {
        key: getKey(),
        value: 2
      }
      two.preparedValue = config.serialize ? JSON.stringify(two.value) : two.value
      var keys = [one.key, two.key]

      var set1 = nock(config.url)
        .put('/persist/kv/' + one.key, JSON.stringify({ value: one.preparedValue }))
        .reply(200, {
          key: one.key,
          value: one.preparedValue
        })

      var set2 = nock(config.url)
        .put('/persist/kv/' + two.key, JSON.stringify({ value: two.preparedValue }))
        .reply(200, {
          key: two.key,
          value: two.preparedValue
        })

      var mget = nock(config.url)
        .post('/persist/mget', JSON.stringify({ keys: keys }))
        .reply(200, [
          {
            key: one.key,
            value: one.value
          },
          {
            key: two.key,
            value: two.value
          }
        ])

      provider.set(one.key, one.value, function (err) {
        assert.isNull(err)
        assert.isTrue(set1.isDone())

        provider.set(two.key, two.value, function (err) {
          assert.isNull(err)
          assert.isTrue(set2.isDone())

          provider.mget(keys, function (err, values) {
            assert.isNull(err)
            assert.deepEqual(values, [one.value, two.value])
            assert.isTrue(mget.isDone())

            done()
          })
        })
      })
    })
  }
})

var idx = 0
function getKey () {
  return ['testkey', ++idx, Date.now()].join(':')
};
