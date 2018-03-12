const fs = require('fs')
const path = require('path')
const util = require('util')
// Service
const shellService = require(path.resolve(__dirname, '..', 'service', 'shellService'))
const responseService = require('../service/responseService')
const uploadService = require('../service/uploadService')
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

/**
 * 根据git仓库传过来的数据构造出仓库的信息
 *
 * @param {String} payloadStr
 * @returns
 * 返回信息包含了：
 * 仓库名称：repName
 * 仓库ssh地址: repSshUrl
 * 当前push的分支: branch
 * 分支行为:
 * created: true|false
 * deleted: true|false
 * forced: true|false
 * commit号: commitId
 * commit信息: commitMsg
 * commit人: commitPerson
 * 此次push改变的文件: changedFiles
 */
function constructPayload (payloadStr) {
  const payload = JSON.parse(payloadStr)
  let config = {
    name: payload.repository.name,
    created: payload.created,
    deleted: payload.deleted,
    forced: payload.forced,
    repSshUrl: payload.repository.ssh_url,
    branch: payload.ref.match(/heads\/(.*)$/)[1],
    commitId: payload.head_commit.id,
    commitMsg: payload.head_commit.message,
    commitPerson: payload.head_commit.committer.username,
    changedFiles: {
      added: payload.head_commit.added,
      removed: payload.head_commit.removed,
      modified: payload.head_commit.modified
    }
  }
  return config
}

/**
 * 部署代码
 *
 * @param {String} data http请求所携带的信息
 * @param {http.ClientRequest} req
 * @param {http.ServerResponse} res
 */
function deploy (req, res, data) {
  const payload = JSON.parse(data)
  // 只处理master分支和release分支上的操作
  if (/release/.test(payload.ref)) {
    const repConfig = constructPayload(data)
    const repositories = getRepConfig()
    if (repositories[repConfig.name]) {
      preDeployRep(req, res, repConfig, path.resolve(repSpacePath, repConfig.name), repConfig.branch)
    } else {
      createRep(req, res, repConfig, repSpacePath, repConfig.branch)
    }
  } else if (/master/.test(payload.ref)) {
    const repConfig = constructPayload(data)
    if (repositories[repConfig.name]) {
      // 更新本地项目
      deployRep(req, res, repConfig, path.resolve(repSpacePath, repConfig.name), repConfig.branch)
    } else {
      // 本地没有项目拉取新项目
      createRep(req, res, repConfig, repSpacePath)
    }
  } else {
    res.writeHead(200)
    res.end('前端服务器已接收请求')
  }
}

/**
 * 部署项目,判断要检出的分支是否在本地存在=》是：切换到目标分支并pull，否：检出新分支=》执行打包命令=》执行上传命令=》记录
 *
 * @param {http.ClientRequest} req
 * @param {http.ServerResponse} res
 * @param {String} repPath 仓库的绝对地址
 * @param {Object} repConfig 仓库信息
 * @param {String} branch 部署的分支
 */
async function deployRep (req, res, repConfig, repPath, branch) {
  const tarBranch = branch.trim()
  const repositories = getRepConfig()
  try {
    if (!tarBranch) {
      throw '请指定分支'
    }
    // 得到所有分支
    await shellService.gitFetch(repPath)
    // 检出到目标分支并pull
    await shellService.checkoutBranch(repPath, tarBranch)
    await shellService.gitPull(repPath)
    await shellService.installNpmPackage(repPath, repDetail.name)
    let buildRes = await shellService.runCommand('npm run build', repPath)
    await appendFile(path.resolve(__dirname, '..', 'log', `${repConfig.name}.log`), '\n-------------\n')
    await appendFile(path.resolve(__dirname, '..', 'log', `${repConfig.name}.log`), buildRes.stdout)
    await appendFile(path.resolve(__dirname, '..', 'log', `${repConfig.name}.log`), buildRes.stderr)
    let repo = repositories[repConfig.name]
    let uploader = new uploadService.uploader(repo.deploy.bucket, repo.deploy.operater, repo.deploy.password)
    uploader.findAllFile(path.resolve(repPath, 'dist'), '')
    uploader.fileList = uploader.fileList.reverse()
    for (let i = 0; i < uploader.fileList.length; i++) {
      let file = uploader.fileList[i]
      await uploader.uploadFile(file.filePath, file.remotePath)
      await appendFile(path.resolve(__dirname, '..', 'log', `${repConfig.name}.log`), `${file.remotePath}上传完成`)
    }
  } catch(err) {
    await appendFile(path.resolve(__dirname, '..', 'log', `${repConfig.name}.log`), err.message)
    responseService.sendJsonResponse({}, res, 500, `${err.message}`, 'system error')
    return
  }
  responseService.sendJsonResponse({}, res, 200, `上线成功\nCommit号：${repConfig.commitId}\n时间:${new Date()}\n分支${repConfig.branch}`, 'upload success')
}


/**
 * 部署项目,判断要检出的分支是否在本地存在=》是：切换到目标分支并pull，否：检出新分支=》执行打包命令=》执行上传命令=》记录
 *
 * @param {http.ClientRequest} req
 * @param {http.ServerResponse} res
 * @param {String} repPath 仓库的绝对地址
 * @param {Object} repConfig 仓库信息
 * @param {String} branch 部署的分支
 */
async function preDeployRep (req, res, repConfig, repPath, branch) {
  const tarBranch = branch.trim()
  const repositories = getRepConfig()
  try {
    if (!tarBranch) {
      throw '请指定分支'
    }
    // 得到所有分支
    let branchCheckRes = await shellService.listBranch(repPath)
    let branchArray = branchCheckRes.stdout.split(/\s/).filter(el => {
      return el && el !== '*'
    })
    await shellService.gitFetch(repPath)
    // 判断分支是否在本地存在
    if (branchArray.indexOf(tarBranch) < 0) {
      // 目标分支不存在=》检出跟踪分支
      await shellService.trackNewBranch(repPath, tarBranch)
    } else {
      // 目标分支存在=》检出到目标分支并pull
      await shellService.checkoutBranch(repPath, tarBranch)
      await shellService.gitPull(repPath)
    }
    // 执行打包命令
    await shellService.installNpmPackage(repPath, repDetail.name)
    let prebuildRes = await shellService.runCommand('npm run prebuild', repPath)
    await appendFile(path.resolve(__dirname, '..', 'log', `${repConfig.name}-pre.log`), prebuildRes.stdout)
    await appendFile(path.resolve(__dirname, '..', 'log', `${repConfig.name}-pre.log`), prebuildRes.stderr)
    let repo = repositories[repConfig.name]
    let uploader = new uploadService.uploader(repo.preDeploy.bucket, repo.repo.preDeploy.operater, repo.repo.preDeploy.password)
    uploader.findAllFile(path.resolve(repPath, 'dist'), repo.preDeploy.remotePath)
    uploader.fileList = uploader.fileList.reverse()
    for (let i = 0; i < uploader.fileList.length; i++) {
      let file = uploader.fileList[i]
      await uploader.uploadFile(file.filePath, file.remotePath)
      await appendFile(path.resolve(__dirname, '..', 'log', `${repConfig.name}-pre.log`), `${file.remotePath}上传完成`)
    }
  } catch(err) {
    await appendFile(path.resolve(__dirname, '..', 'log', `${repConfig.name}-pre.log`, `${err.message}`), `${err.message}`)
    responseService.sendJsonResponse({}, res, 500, `${err.message}`, 'system error')
    return
  }
  responseService.sendJsonResponse({}, res, 200, `上线成功\nCommit号：${repConfig.commitId}\n时间:${new Date()}\n分支${repConfig.branch}`, 'upload success')
}

/**
 * 创建仓库，克隆仓库=>检出分支=>安装npm包=>添加仓库的配置文件=>等待配置cdn（手动，后期可以在终端操作）
 *
 * @param {http.ClientRequest} req
 * @param {http.ServerResponse} res
 * @param {Object} repo 仓库信息
 * @param {String} repPath 存放仓库的绝对地址
 * @param {String} newBranch 要跟踪并检出的远程分支
 */
async function createRep (req, res, repo, repPath, newBranch) {
  const repositories = getRepConfig()
  const repDetail = {
    name: repo.name,
    sshUrl: repo.repSshUrl,
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
    cloneRes = await shellService.cloneRep(repo.repSshUrl, repPath)
    // 检出新分支（如果需要的话）
    if (newBranch) {
      checkBranchRes = await shellService.trackNewBranch(path.resolve(repPath, repo.name), repo.branch)
    }
    // 执行npm包安装命令
    npmInstallRes = await shellService.installNpmPackage(path.resolve(repPath, repDetail.name))
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
  } catch (err) {
    responseService.sendJsonResponse({}, res, 500, `${err.message}`, 'system error')
    return
  }
  responseService.sendJsonResponse({}, res, 200, `项目${repDetail.name}拉取成功`, 'system error')
}

module.exports = {
  deploy
}
