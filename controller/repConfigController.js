const fs = require('fs')
const path = require('path')
const util = require('util')
// Service
const shellService = require(path.resolve(__dirname, '..', 'service', 'shellService'))
const responseService = require(path.resolve(__dirname, '..', 'service', 'responseService'))
const uploadService = require(path.resolve(__dirname, '..', 'service', 'uploadService'))
// 绝对路径
const repSpacePath = path.resolve(__dirname, '..', 'repositories')
// promise 方法
const appendFile = util.promisify(fs.appendFile)
const writeFile = util.promisify(fs.writeFile)

// 获取仓库配置信息
function getRepConfig () {
  const repositories = fs.readFileSync(path.resolve(__dirname, '..', 'repConfig', 'repository.json')).toString()
  return JSON.parse(repositories)
}

// 查看发布历史
function getDeployLog (repName) {
  let preLog = fs.readFileSync(path.resolve(__dirname, '..', 'log', `${repName}-pre-deploy.log`))
  let prodLog = fs.readFileSync(path.resolve(__dirname, '..', 'log', `${repName}-deploy.log`))
  return {
    preLog,
    prodLog
  }
}

/**
 * 获取当前仓库的配置
 *
 * @param {http.ClientRequest} req
 * @param {http.ServerResponse} res
 */
function getAllConfig (req, res, data) {
  let repConfig = fs.readFileSync(path.resolve(__dirname, '..', 'repConfig', 'repository.json'))
  repConfig = JSON.parse(repConfig)
  for (let item in repConfig) {
    let log = getDeployLog(item)
    repConfig[item].preLog = log.preLog.toString()
    repConfig[item].prodLog = log.prodLog.toString()
  }
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
  if (!data) {
    responseService.sendJsonResponse({}, res, 400, '请传递参数', 'error')
    return
  }
  let repConfig = fs.readFileSync(path.resolve(__dirname, '..', 'repConfig', 'repository.json'))
  repConfig = JSON.parse(repConfig.toString())
  let reqData = null
  if (Buffer.isBuffer(data)) {
    reqData = JSON.parse(data.toString())
  } else {
    reqData = JSON.parse(data)
  }
  if (!reqData.name) {
    responseService.sendJsonResponse({}, res, 200, '请指定项目', 'warning')
    return
  }
  let tarRepConfig = repConfig[reqData.name]
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

  repConfig[reqData.name] = tarRepConfig
  fs.writeFileSync(path.resolve(__dirname, '..', 'repConfig', 'repository.json'), JSON.stringify(repConfig))
  responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 200, '操作成功', 'success')
}

/**
 * 创建仓库，克隆仓库=>检出分支=>安装npm包=>添加仓库的配置文件=>等待配置cdn（手动，后期可以在终端操作）
 *
 * @param {http.ClientRequest} req
 * @param {http.ServerResponse} res
 * @param {String} repPath 存放仓库的绝对地址
 * @param {String} newBranch 要跟踪并检出的远程分支
 */
async function createRep (req, res, data) {
  const repositories = getRepConfig()
  let newRep = JSON.parse(data)
  if (repositories[newRep.name]) {
    responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 400, `已经有此项目`, 'system error')
    return
  }
  const repDetail = {
    name: newRep.name,
    sshUrl: newRep.url,
    deploy: {
      bucket: '',
      operator: '',
      password: '',
      remotePath:''
    },
    preDeploy: {
      bucket: '',
      operator: '',
      password: '',
      remotePath:''
    }
  }
  let cloneRes
  let checkBranchRes
  let npmInstallRes
  try {
    cloneRes = await shellService.cloneRep(newRep.url, repSpacePath)
    // 执行npm包安装命令
    npmInstallRes = await shellService.installNpmPackage(path.resolve(repSpacePath, newRep.name))
    repositories[repDetail.name] = repDetail
    // 写入仓库配置文件
    await writeFile(path.resolve(__dirname, '..', 'repConfig', 'repository.json'), JSON.stringify(repositories))
    // 创建日志文件并写入
    await appendFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}.log`), cloneRes.stdout)
    await appendFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}.log`), cloneRes.stderr)
    checkBranchRes ? await appendFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}.log`), checkBranchRes.stdout) : ''
    checkBranchRes ? await appendFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}.log`), checkBranchRes.stderr) : ''
    await appendFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}.log`), npmInstallRes.stdout)
    await appendFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}.log`), npmInstallRes.stderr)
    // 发布日志文件
    await writeFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}-deploy.log`),'')
    await writeFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}-pre-deploy.log`),'')
  } catch (err) {
    responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 500, `${err.message}`, 'system error')
    return
  }
  responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 200, `项目${repDetail.name}拉取成功`, 'system error')
}

module.exports = {
  getAllConfig,
  configRep,
  createRep
}
