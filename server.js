const HTTP = require('http')
const dispatcher = require('./dispatcher')

let server = HTTP.createServer()
server.listen('8001', () => {})
server.on('request', dispatcher)
