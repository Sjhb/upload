const HTTP = require('http')
const FS = require('fs')
const dispatcher = require('./dispatcher')

let server = HTTP.createServer()
server.on('request', dispatcher)
server.listen('80', () => {
  console.log('upload server runing')
})
