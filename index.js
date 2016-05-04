var deap = require('deap')
var serviceProvider = require('./lib/service-provider')
var memoryProvider = require('./lib/memory-provider')

module.exports = function NewKV (options) {
  var config = deap.update({
    serialize: true,
    token: process.env.BEEPBOOP_TOKEN,
    url: 'http://persist'
  }, options || {})

  return config.token ? serviceProvider(config) : memoryProvider(config)
}
