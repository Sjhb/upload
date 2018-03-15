/*
 * @Author: 王欢
 * @Date: 2018-03-13 13:56:13
 * @Last Modified by: 王欢
 * @Last Modified time: 2018-03-15 20:16:08
 */
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
      remotePath:'',
      onlineCommit: '', // 线上版本
      localCommit: '' // 本地版本
    },
    preDeploy: {
      bucket: '',
      operator: '',
      password: '',
      remotePath:'',
      onlineCommit: '', // 线上版本
      localCommit: '' // 本地版本
    }
  }
  // let cloneRes
  // let checkBranchRes
  // let npmInstallRes
  try {
    // cloneRes = await shellService.cloneRep(newRep.url, repSpacePath)
    // 执行npm包安装命令
    // npmInstallRes = await shellService.installNpmPackage(path.resolve(repSpacePath, newRep.name))
    repositories[repDetail.name] = repDetail
    // 写入仓库配置文件
    await writeFile(path.resolve(__dirname, '..', 'repConfig', 'repository.json'), JSON.stringify(repositories))
    // 创建日志文件并写入
    // await appendFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}.log`), cloneRes.stdout)
    // await appendFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}.log`), cloneRes.stderr)
    // checkBranchRes ? await appendFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}.log`), checkBranchRes.stdout) : ''
    // checkBranchRes ? await appendFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}.log`), checkBranchRes.stderr) : ''
    // await appendFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}.log`), npmInstallRes.stdout)
    // await appendFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}.log`), npmInstallRes.stderr)
    // 发布日志文件
    await appendFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}.log`), '  ')
    await appendFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}.log`), ' ')

    await writeFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}-deploy.log`),'')
    await writeFile(path.resolve(__dirname, '..', 'log', `${repDetail.name}-pre-deploy.log`),'')
  } catch (err) {
    responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 500, `${err.message}`, 'system error')
    return
  }
  responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 200, `项目${repDetail.name}创建成功`, 'system error')
}

/**
 * 安装依赖包
 *
 * @param {http.ClientRequest} req
 * @param {http.ServerResponse} res
 * @param {String} data 原始post内容
 */
async function runNpmInstall (req, res, data) {
  const repositories = getRepConfig()
  let rep = JSON.parse(data)
  if (!repositories[rep.name]) {
    responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 404, `未找到该项目`, 'system error')
    return
  }
  let npmInstallRes
  try {
    npmInstallRes = await shellService.installNpmPackage(path.resolve(repSpacePath, rep.name))
  } catch (err) {
    responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 500, `${err.message}`, 'system error')
    return
  }
  responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 200, `项目${rep.name}依赖安装成功`, 'system error')
}

/**
 * 执行打包命令
 *
 * @param {http.ClientRequest} req
 * @param {http.ServerResponse} res
 * @param {String} data 原始post内容
 */
async function deploy (req, res, data) {
  const tarRep = JSON.parse(data)
  const repositories = getRepConfig()
  const repPath = path.resolve(__dirname, '..', 'repositories', tarRep.name)
  let deploylogFile = ''
  let logCommitFile = ''
  let deployConfig = null
  let commitId = ''
  let branch = ''
  if (!repositories[tarRep.name]) {
    responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 404, `未找到该项目`, 'system error')
    return
  }
  try {
    let branchRes = await shellService.listBranch(repPath)
    let buildRes = null
    branch = branchRes.stdout.split('\n').filter(ele => /^\*/.test(ele)? ele : false)[0].match(/([^*]+)/)[1].trim()
    if ('master' === branch) {
      deploylogFile = path.resolve(__dirname, '..', 'log', `${tarRep.name}.log`)
      deployConfig = repositories[tarRep.name].deploy
      logCommitFile =  path.resolve(__dirname, '..', 'log', `${tarRep.name}-deploy.log`)
      buildRes = await shellService.runCommand('npm run opsbuild', repPath)
    } else {
      deploylogFile = path.resolve(__dirname, '..', 'log', `${tarRep.name}-pre.log`)
      deployConfig = repositories[tarRep.name].preDeploy
      logCommitFile =  path.resolve(__dirname, '..', 'log', `${tarRep.name}-pre-deploy.log`)
      buildRes = await shellService.runCommand('npm run build', repPath)
    }
    await appendFile(deploylogFile, '\n--------------------------\n')
    await appendFile(deploylogFile, buildRes.stdout)
    await appendFile(deploylogFile, buildRes.stderr)
    let uploader = new uploadService.uploader(deployConfig.bucket, deployConfig.operator, deployConfig.password)
    uploader.findAllFile(path.resolve(repPath, 'dist'), '')
    uploader.fileList = uploader.fileList.reverse()
    for (let i = 0; i < uploader.fileList.length; i++) {
      let file = uploader.fileList[i]
      await uploader.uploadFile(file.filePath, file.remotePath)
      await appendFile(deploylogFile, `${file.remotePath}上传完成`)
    }
    // 更新本地配置文件
    if ('master' === branch) {
      commitId = repositories[tarRep.name].deploy.onlineCommit = repositories[tarRep.name].deploy.localCommit
    } else {
      commitId = repositories[tarRep.name].preDeploy.onlineCommit = repositories[tarRep.name].preDeploy.localCommit
    }
    await writeFile(path.resolve(__dirname, '..', 'repConfig', 'repository.json'), JSON.stringify(repositories))
    await writeFile(logCommitFile, `线上版本：【Commit号】${commitId}【时间】:${new Date()}【分支】${branch}`)
  } catch(err) {
    await appendFile(deploylogFile, err.message)
    responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 200, `${err.message}`, 'system error')
    return
  }
  responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 200, `上线成功\nCommit号：${commitId}\n时间:${new Date()}\n分支${branch}`, 'upload success')
}
/**
 * 获取当前分支
 *
 * @param {http.ClientRequest} req
 * @param {http.ServerResponse} res
 * @param {String} data
 */
function getCurrentBranch (req, res, data) {
  const rep = JSON.parse(data)
  const repositories = getRepConfig()
  if (!repositories[rep.name]) {
    responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 404, `未找到该项目`, 'system error')
    return
  }
  shellService.listBranch(path.resolve(__dirname, '..', 'repositories', rep.name)).then(data => {
    let branch = data.stdout.split('\n').filter(ele => /^\*/.test(ele)? ele : false)[0].match(/([^*]+)/)[1].trim()
    responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 200, branch, 'success')
  }).catch(err => {
    responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 404, err, 'system error')
  })
}

/**
 * 切换分支
 *
 * @param {http.ClientRequest} req
 * @param {http.ServerResponse} res
 * @param {String} data 原始post内容
 */
async function switchBranch (req, res, data) {
  // const repositories = getRepConfig()
  // let rep = JSON.parse(data)
  // if (!repositories[rep.name]) {
  //   responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 404, `未找到该项目`, 'system error')
  //   return
  // }
}

module.exports = {
  getAllConfig,
  configRep,
  createRep,
  getCurrentBranch,
  deploy,
  runNpmInstall
}
