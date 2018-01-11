const FS = require('fs')
const repositories = require(path.resolve(__dirname, '..', 'repConfig', 'repository.json'))
const repSpacePath = path.resolve(__dirname, '..', 'repositories')
const shellService = require(path.resolve(__dirname, '..', 'service', 'shellService'))
/**
 * 根据git仓库传过来的数据构造出仓库的信息
 *
 * @param {String} payloadStr
 * @returns
 * 返回信息包含了：
 * 仓库名称
 * 仓库ssh地址
 * 当前push的分支
 * commit号
 * commit信息
 * commit人
 * 此次push改变的文件
 */
function constructPayload (payloadStr) {
  const payload = JSON.parse(payloadStr)
  let config = {
    repName: payload.repository.name,
    repSshUrl: payload.repository.ssh_url,
    branch: payload.ref.match(/\master[^.]*$/),
    commitId: payload.commits.id,
    commitMsg: payload.commits.message,
    commitPerson: payload.committer.username,
    changedFiles: {
      added: payload.commits.added,
      removed: payload.commits.removed,
      modified: payload.commits.modified
    }
  }
  return config
}

/**
 * 测试
 *
 * @param {String} data http请求所携带的信息
 * @param {http.ClientRequest} req
 * @param {http.ServerResponse} res
 */
  // 执行脚本
  // 容错处理
function deploy (data, req, res) {
  const payload = JSON.parse(data)
  // 只处理master分支和release分支上的操作
  if (/release/.test(payload.ref)) {
    const repConfig = constructPayload(data)
    if (repositories[repConfig.repName]) {
      createRep(repConfig, req, res)
    } else {
      create
    }
  } else if (/master/.test(payload.ref)) {
  }
  res.end()
}
/**
 * 创建仓库，添加仓库的配置文件=》克隆仓库=》检出分支=》等待配置cdn（手动，后期可以在终端操作）
 *
 * @param {Object} data 仓库信息
 * @param {http.ClientRequest} req
 * @param {http.ServerResponse} res
 */
function createRep (data, req, res) {
  let payload = data
  shellService.cloneRep(payload, repSpacePath)
}

function getHistory () {
}

module.exports = {
  deploy
}
