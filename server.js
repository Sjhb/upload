const fs = require('fs')
const path = require('path')
const HTTP = require('http')
const dispatcher = require('./dispatcher')

let files = fs.readdirSync('./config').filter(file => /.js$/.test(file)).map(file => path.join(__dirname, 'config', file))
let config = require('./config/config')
for (let item of files) {
  if (/local/.test(item)) {
    config = require(item)
    break
  }
}

let server = HTTP.createServer()
server.listen(config.port, () => {})
server.on('request', dispatcher)
