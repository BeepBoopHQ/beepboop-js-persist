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
  })

  function testSetGetDelGet (config, value) {
    it('should handle "' + value + '"', function (done) {
      var service = ServiceProvider(config)
      var key = getKey()
      var preparedValue = config.serialize ? JSON.stringify(value) : value

      var set = nock(config.url)
        .put('/kv/' + key, JSON.stringify({ value: preparedValue }))
        .reply(200, {
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
        .reply(200, {})

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
})

var idx = 0
function getKey () {
  return ['testkey', ++idx, Date.now()].join(':')
};
