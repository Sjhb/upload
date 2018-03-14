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
  const repositories = getRepConfig()
  // 只处理master分支和release分支上的操作
  if (/(release)|(master)/.test(payload.ref)) {
    const repConfig = constructPayload(data)
    const repositories = getRepConfig()
    if (repositories[repConfig.name]) {
      deployRep(req, res, repConfig, path.resolve(repSpacePath, repConfig.name), repConfig.branch)
    } else {
      responseService.sendJsonResponse({'Access-Control-Allow-Origin':'*'}, res, 400, `未配置仓库`, 'system error')
    }
  } else {
    res.writeHead(200)
    res.end('前端服务器已接收请求')
  }
}

/**
 * 拉取项目,判断要检出的分支是否在本地存在=》是：切换到目标分支并pull，否：检出新分支
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
  let logFile = ''
  try {
    if (!tarBranch) {
      throw '请指定分支'
    } else {
      if (/^master$/.test(branch)) {
        logFile = path.resolve(__dirname, '..', 'log', `${repConfig.name}.log`)
        repositories[repConfig.name].deploy.localCommit = repConfig.commitId
      } else {
        logFile = path.resolve(__dirname, '..', 'log', `${repConfig.name}-pre.log`)
        repositories[repConfig.name].preDeploy.localCommit = repConfig.commitId
      }
    }
    // 更新本地配置文件
    await writeFile(path.resolve(__dirname, '..', 'repConfig', 'repository.json'), JSON.stringify(repositories))
    // 得到所有分支
    let branchCheckRes = await shellService.listBranch(repPath)
    let branchArray = branchCheckRes.stdout.split(/\s/).filter(el => {
      return el && el !== '*'
    })
    await appendFile(logFile, '\n----------------------------------\n')
    // 判断分支是否在本地存在
    if (branchArray.indexOf(tarBranch) !== -1) {
      // 存在 =》 获取当前分支
      let pullRes = null
      let branchRes = await shellService.listBranch(repPath)
      let currentBranch = branchRes.stdout.split('\n').filter(ele => /^\*/.test(ele)? ele : false)[0].match(/([^*]+)/)[1].trim()
      // 当前分支不为目标分支时 =》 检出目标分支
      if (currentBranch !== branch.trim()) {
        await shellService.checkoutBranch(repPath, tarBranch)
      }
      pullRes = await shellService.gitPull(repPath)
      await appendFile(logFile, branch)
      await appendFile(logFile, pullRes.stdout)
      await appendFile(logFile, pullRes.stderr)
    } else {
      // 目标分支不存在=》检出跟踪分支
      let trackRes = await shellService.trackNewBranch(repPath, tarBranch)
      await appendFile(logFile, trackRes.stdout)
      await appendFile(logFile, trackRes.stderr)
    }
  } catch(err) {
    await appendFile(logFile, err.message)
    responseService.sendJsonResponse({}, res, 500, `${err.message}`, 'system error')
    return
  }
  responseService.sendJsonResponse({}, res, 200, 'recevid', 'recevid')
}

module.exports = {
  deploy
}
