const fs = require('fs')
const path = require('path')

const responseService = require(path.resolve(__dirname, '..', 'service', 'responseService'))
let repConfig = require(path.resolve(__dirname, '..', 'repConfig', 'repository.json'))
/**
 * 获取当前仓库的配置
 *
 * @param {http.ClientRequest} req
 * @param {http.ServerResponse} res
 */
function getAllConfig (req, res, data) {
  responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 200, repConfig, 'success')
}
/**
 * 配置仓库
 *
 * @param {String} data 原始信息字符串
 * @param {http.ClientRequest} req
 * @param {http.ServerResponse} res
 */
function configRep (req, res, data) {
  const reqData = JSON.parse(data)
  if (!reqData.repName) {
    responseService.sendJsonResponse({}, res, 200, '请指定项目', 'warning')
    return
  }
  let tarRepConfig = repConfig[reqData.repName]
  if (!tarRepConfig) {
    responseService.sendJsonResponse({}, res, 200, '未找到指定项目', 'warning')
    return
  }
  tarRepConfig.deploy.bucket = reqData.deploy.bucket.trim() ? reqData.deploy.bucket.trim() : ''
  tarRepConfig.deploy.operator = reqData.deploy.operator.trim() ? reqData.deploy.operator.trim() : ''
  tarRepConfig.deploy.password = reqData.deploy.password.trim() ? reqData.deploy.password.trim() : ''
  tarRepConfig.deploy.remotePath = reqData.deploy.remotePath.trim() ? reqData.deploy.remotePath.trim() : ''

  tarRepConfig.preDeploy.bucket = reqData.preDeploy.bucket.trim() ? reqData.preDeploy.bucket.trim() : ''
  tarRepConfig.preDeploy.operator = reqData.preDeploy.operator.trim() ? reqData.preDeploy.operator.trim() : ''
  tarRepConfig.preDeploy.password = reqData.preDeploy.password.trim() ? reqData.preDeploy.password.trim() : ''
  tarRepConfig.preDeploy.remotePath = reqData.preDeploy.remotePath.trim() ? reqData.preDeploy.remotePath.trim() : ''

  repConfig[reqData.repName] = tarRepConfig
  responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 200, '操作成功', 'success')
}

module.exports = {
  getAllConfig,
  configRep
}
