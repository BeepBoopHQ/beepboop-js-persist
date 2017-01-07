'use strict'
const fs = require('fs')
const fse = require('fs-extra')
const join = require('path').join

module.exports = function fsProvider (config) {
  let serialize = config && !!config.serialize
  let directory = (config && config.directory) || join(__dirname, '.persist')
  fse.mkdirpSync(directory)

  let provider = {
    type: 'fs',

    get: function (key, cb) {
      key = encodeURIComponent(key)

      fs.readFile(join(directory, key), 'utf8', function (err, value) {
        if (err && err.code === 'ENOENT') {
          return cb(null)
        }
        if (err) {
          return cb(err)
        }
        value = (serialize) ? JSON.parse(value) : value
        cb(null, value)
      })
    },

    mget: function (keys, cb) {
      keys = keys || []
      let total = 0
      let values = []
      let anyError = null

      let gather = (err, idx, val) => {
        anyError = anyError || err
        values[idx] = val
        total++
        if (keys.length === total) {
          cb(anyError, values)
        }
      }
      keys.map((key, idx) => {
        provider.get(key, (err, val) => {
          gather(err, idx, val)
        })
      })
    },

    set: function (key, value, cb) {
      key = encodeURIComponent(key)
      // can't serialize this - treat as an error
      if (value === undefined) {
        return cb(new Error('cannot set a value of undefined'))
      }

      if (!serialize && typeof value !== 'string') {
        return cb(new Error('value may only be string when serialize=false, not ' + typeof value))
      }

      let strValue = serialize ? JSON.stringify(value) : value
      strValue += ''

      fse.outputFile(join(directory, key), strValue, 'utf8', (err) => {
        cb(err, serialize ? value : strValue)
      })
    },

    del: function (key, cb) {
      key = encodeURIComponent(key)
      fs.unlink(join(directory, key), cb)
    },

    list: function (begins, cb) {
      if (typeof begins === 'function') {
        cb = begins
        begins = ''
      }
      if (typeof begins !== 'string') {
        begins = ''
      }
      fs.readdir(directory, (err, items) => {
        if (err) return cb(err)
        let entries = items
          .filter((item) => {
            return fs.statSync(join(directory, item)).isFile()
          })
          .map(decodeURIComponent)
          .filter((key) => {
            return new RegExp('^' + begins).test(key)
          })
        cb(null, entries)
      })
    }
  }

  return provider
}
