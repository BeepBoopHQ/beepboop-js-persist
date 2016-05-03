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
