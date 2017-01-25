[![Sponsored by Beep Boop](https://img.shields.io/badge/%E2%9D%A4%EF%B8%8F_sponsored_by-%E2%9C%A8_Robots%20%26%20Pencils%20%2F%20Beep%20Boop_%E2%9C%A8-FB6CBE.svg)](https://beepboophq.com)

# [Beep Boop](https://beepboophq.com) Persist Key/Value Store JS Client

This is a node.js client for the [Beep Boop Persist service](https://beepboophq.com/docs/article/api-persist).
Though Persist only stores simple strings, this client will automatically `JSON.stringify` and `JSON.parse` objects passed
as values. 

If running on Beep Boop the below example should just work. If running outside of Beep Boop it will fall back to an in memory 
store. See further configuration options below.

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
+ `options.url` - defaults to `process.env.BEEPBOOP_PERSIST_URL || process.env.BEEPBOOP_API_URL || 'https://beepboophq.com/api/v1'` - service url passed into environment by Beep Boop
+ `options.debug` - defaults to `false` - if `true` then api calls and errors are logged.
+ `options.logger` - defaults to `null` - Should be an object w/ a `debug` and `error` function.
+ `options.provider` - defaults to `null`, acceptable values are `"memory"`, `"beepboop"`, or `"fs"` - this provides a way to override provider selection logic.  If this isn't explicitly set, then the `"beepboop"` provider is used when both `token` and `url` are present.  Otherwise the `"memory"` provider is used. `"fs"` can be used when running outside of Beep Boop to make data survive restarts. This provider shouldn't be used while running on Beep Boop though since the disks are ephemeral.
+ `options.directory` - defaults to `.persist` under module - Only used with the `fs` filesystem provider (meant for testing only) to control where data is stored.

### .set(key, value, callback)

Set a value for a key. If `value` is not a string it will be `JSON.stringify()`'d if `options.serialize` is `true`

```javascript
let obj = { foo: 'bar', baz: 1 }
kv.set('a key', obj, function (err) {
  // check for err
})
```

### .get(key, callback)

Get a value for a key. If `val` is a string, it will be passed as such, otherwise it is `JSON.parse()`'d if `options.serialize` is `true`

```javascript
kv.get('a key', function (err, val) {
  // check for err
})
```

### .mget(keys, callback)

Get multiple values for a key. 

```javascript
kv.set('key1', 'string value', function (err) {})
kv.set('key2', { foo: 'bar' }, function (err) {})

let keys = ['key1', 'key1', 'non-existent-key']

kv.mget(keys, function (err, result) {
  // check for err

  // result = ['string value', { foo: 'bar' }, null]
})
```

### .del(key, callback)

Delete a value at a key

```javascript
kv.del('a key', function (err) {
  // check for err
})
```

### .list(begins, callback)

List all keys:

```javascript
kv.list(function (err, keys) {
  // check for err

  // keys is array of strings like ['key1', 'key2', 'baz3']
})
```

List keys that begin with a prefix:

```javascript
// beings with 'key' for example
kv.list('key', function (err, keys) {
  // check for err

  // keys is array of strings like ['key1', 'key2']
})
```
