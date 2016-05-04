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
      kv.delete('a key', function (err) {
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
+ `options.token` - defaults to `process.env.BEEPBOOP_TOKEN` - if this isn't present, a memory provider will be used instead of the real service
+ `options.url` - defaults to `https://persist` - which is the Beep Boop persist service

### .get(key, callback)

### .mget(keys, callback)

### .set(key, value, callback)

### .del(key, callback)

### .list(callback)
