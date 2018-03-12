const fs = require('fs')
const path = require('path')
const upyun = require('upyun')

module.exports.uploader = class {
  // 构造方法，利用又拍云提供的SDK构造上传工具
  constructor(bucket, operator, password) {
    this.operator = operator
    this.bucket = bucket
    this.password = password
    this.service = new upyun.Service(bucket, operator, password)
    this.client = new upyun.Client(this.service)
    this.fileList = []
  }
  /**
   * 上传文件
   *
   * @param {String} localPath 本地文件路径
   * @param {String} remotePath 远程路径
   * @returns
   */
  uploadFile(localPath, remotePath) {
    let file = null
    try {
      file = fs.readFileSync(localPath)
    } catch (err) {
      return false
    }
    return this.client.putFile(remotePath, file)
  }
  /**
   * 获得所有要上传的文件以及相对应的远程相对地址
   *
   * @param {String} uploadDir 要上传的文件夹绝对地址
   * @param {Sreing} relativePath 相对于uploadDir的路径
   * @memberof uploader
   */
  findAllFile(uploadDir, relativePath) {
    let dirExist = fs.existsSync(uploadDir)
    if (dirExist) {
      let res = fs.readdirSync(uploadDir)
      if (res.length === 0) {
        return
      }
      for (let item of res) {
        if (fs.statSync(uploadDir + path.sep +item).isDirectory()) {
          this.findAllFile(uploadDir + path.sep + item, relativePath + path.sep + item)
        } else {
          this.fileList.push({
            filePath: uploadDir + path.sep +item,
            remotePath: relativePath + path.sep + item
          })
        }
      }
    }
  }
}
