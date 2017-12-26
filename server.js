const HTTP = require('http')
const FS = require('fs')
const dispatcher = require('./dispatcher')

let server = HTTP.createServer()
server.on('request', dispatcher)
server.listen('8009', () => {
  console.log('upload server runing on port 8009')
})
