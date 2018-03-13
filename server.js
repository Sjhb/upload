const HTTP = require('http')
const dispatcher = require('./dispatcher')

let server = HTTP.createServer()
server.listen('8000', () => {})
server.on('request', dispatcher)
