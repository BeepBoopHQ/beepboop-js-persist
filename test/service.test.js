var assert = require('chai').assert
var nock = require('nock')
var ServiceProvider = require('../lib/service-provider')

describe('Service provider', () => {
  it('should require config', () => {
    assert.throws(function () {
      ServiceProvider()
    })
  })

  it('should initialize w/ token and url', () => {
    assert.doesNotThrow(function () {
      ServiceProvider({
        token: 'TOKEN',
        url: 'https://persist'
      })
    })
  })

  it('should set without a callback', function (done) {
    var config = {
      token: 'TOKEN',
      url: 'https://persist'
    }
    var provider = ServiceProvider(config)
    var value = 'value'
    var key = getKey()

    var set = nock(config.url)
      .put('/kv/' + key, JSON.stringify({ value: value }))
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

  describe('without serialize', function () {
    var config = {
      url: 'https://persist',
      token: 'TOKEN',
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
      url: 'https://persist',
      token: 'TOKEN',
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
      var service = ServiceProvider(config)
      var key = getKey()
      var preparedValue = config.serialize ? JSON.stringify(value) : value

      var set = nock(config.url)
        .put('/kv/' + key, JSON.stringify({ value: preparedValue }))
        .reply(200, {
          key: key,
          value: preparedValue
        })

      var get = nock(config.url)
        .get('/kv/' + key)
        .reply(200, {
          key: key,
          value: preparedValue
        })

      var del = nock(config.url)
        .delete('/kv/' + key)
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
              .get('/kv/' + key)
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
      var provider = ServiceProvider(config)
      var key = getKey()

      var get = nock(config.url)
        .get('/kv/' + key)
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
      var service = ServiceProvider(config)

      service.set(getKey(), undefined, function (err) {
        assert.isNotNull(err)

        done()
      })
    })
  }

  function testMgetAllMisses (config) {
    it('should handle an mget w/ misses', function (done) {
      var provider = ServiceProvider(config)
      var keys = [getKey(), getKey()]

      var mget = nock(config.url)
        .post('/kv/mget', JSON.stringify({ keys: keys }))
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
      var provider = ServiceProvider(config)
      var one = {
        key: getKey(),
        value: 1
      }
      var twoKey = getKey()
      var keys = [one.key, twoKey]
      var preparedValue = config.serialize ? JSON.stringify(one.value) : one.value

      var set = nock(config.url)
        .put('/kv/' + one.key, JSON.stringify({ value: preparedValue }))
        .reply(200, {
          key: one.key,
          value: preparedValue
        })

      var mget = nock(config.url)
        .post('/kv/mget', JSON.stringify({ keys: keys }))
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
      var provider = ServiceProvider(config)
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
        .put('/kv/' + one.key, JSON.stringify({ value: one.preparedValue }))
        .reply(200, {
          key: one.key,
          value: one.preparedValue
        })

      var set2 = nock(config.url)
        .put('/kv/' + two.key, JSON.stringify({ value: two.preparedValue }))
        .reply(200, {
          key: two.key,
          value: two.preparedValue
        })

      var mget = nock(config.url)
        .post('/kv/mget', JSON.stringify({ keys: keys }))
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
