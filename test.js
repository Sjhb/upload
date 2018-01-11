const path = require('path')
const shellService = require('./service/shellService')
let res = shellService.cloneRep('test', {
  cwd: path.resolve(__dirname, 'repositories')
})
console.log(res)
