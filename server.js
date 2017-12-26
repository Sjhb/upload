const HTTP = require('http')
const FS = require('fs')
const dispatcher = require('./dispatcher')

let server = HTTP.createServer()
server.on('request', dispatcher)
<<<<<<< HEAD
<<<<<<< HEAD
server.listen('80', () => {
  console.log('upload server runing on port 80')
=======
server.listen('8009', () => {
  console.log('upload server runing on port 8009')
>>>>>>> 完善分发器，增加测试脚本
=======
server.listen('80', () => {
  console.log('upload server runing on port 80')
>>>>>>> 更新监听的端口
})
