var deap = require('deap')
var serviceProvider = require('./lib/service-provider')
var memoryProvider = require('./lib/memory-provider')

module.exports = function NewKV (options) {
  var config = deap.update({
    serialize: true,
    token: process.env.BEEPBOOP_TOKEN,
    url: 'http://persist'
  }, options || {})

  if (!config.token) {
    console.log('USING PERSIST IN MEMORY PROVIDER')
    return memoryProvider(config)
  }

  return serviceProvider(config)
}
