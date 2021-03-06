'use strict'
module.exports = function Logger (debug) {
  return {
    debug: function () {
      if (debug) {
        let args = Array.prototype.slice.call(arguments)
        args[0] = 'debug: ' + args[0]
        console.log.apply(console, args)
      }
    },

    error: function () {
      if (debug) {
        let args = Array.prototype.slice.call(arguments)
        args[0] = 'error: ' + args[0]
        console.log.apply(console, args)
      }
    }
  }
}
