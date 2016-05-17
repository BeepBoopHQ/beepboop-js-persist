# [Beep Boop](https://beepboophq.com) Persist Key/Value Store JS Client

*The Persist service is still experimental*

Keys and values are simple strings. If running on Beep Boop the below example should
just work. If running outside of Beep Boop it will fall back to an in memory store.

```javascript
var kv = require('beepboop-persist')()

kv.set('a key', 'the key, is water', function (err) {
  // handle error :)
  kv.get('a key', function (err, val) {
    // handle error :)
    // val should be 'the key, is water'

    kv.list(function (err, keys) {
      // handle error :)
      // keys should be ['a key']
      kv.del('a key', function (err) {
        // handle error :)
        // 'a key' should be deleted
      })
    })
  })
})
```

## BeepBoopPersist([options])
Returns a Beep Boop Perist api:

+ `options.serialize` - defaults to `true` - all values will be run through `JSON.stringify()` and `JSON.parse()`
+ `options.token` - defaults to `process.env.BEEPBOOP_TOKEN` - auth token passed into environment by Beep Boop
+ `options.url` - defaults to `process.env.BEEPBOOP_PERSIST_URL` - service url passed into environment by Beep Boop
+ `options.debug` - defaults to `false` - if `true` then api calls and errors are logged.
+ `options.logger` - defaults to `null` - Should be an object w/ a `debug` and `error` function.
+ `options.provider` - defaults to `null`, acceptable values are `"memory"` or `"beepboop"` - this provides a way to override provider selection logic.  If this isn't explicitly set, then the `"beepboop"` provider is used when both `token` and `url` are present.  Otherwise the `"memory"` provider is used.

### .get(key, callback)

### .mget(keys, callback)

### .set(key, value, callback)

### .del(key, callback)

### .list(callback)
