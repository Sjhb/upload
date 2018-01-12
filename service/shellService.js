const cp = require('child_process')
const util = require('util')
const path = require('path')

const shellPath = path.resolve(__dirname, '..', 'shells')
const exec = util.promisify(cp.exec)

/**
 * 从远程克隆仓库
 *
 * @param {Object} payload git仓库地址（ssh）
 * @param {String} cwd 仓库克隆的地址cwd
 * @returns 返回执行结果，格式：{result: Boolean, out: String}
 */
function cloneRep (repSshUrl, cwd) {
  if (!repSshUrl) {
    return {
      result: false,
      out: '需要指定克隆地址'
    }
  }
  if (!cwd) {
    return {
      result: false,
      out: '需要指定本地仓库地址'
    }
  }
  const cloneArgs = ['git', 'clone', repSshUrl]
  const option = {
    cwd
  }
  return exec(cloneArgs.join(' '), option)
}

/**
 * 检出分支
 *
 * @param {String} repository 仓库绝对地址
 * @param {String} branch 要检出的分支
 */
async function checkoutBranch (repository, branch) {
}

/**
 * 设置本地分支跟踪远程分支
 *
 * @param {String} repository 仓库绝对地址
 * @param {String} localBranch 本地分支
 * @param {String} remoteBranch 要跟踪远程分支
 */
async function trackBranch (repository, localBranch, remoteBranch) {
}

/**
 * 新建本地分支跟踪远程分支
 *
 * @param {String} repository 仓库绝对地址
 * @param {String} localBranch 本地分支
 * @param {String} remoteBranch 要跟踪远程分支
 */
async function trackNewBranch (repository, remoteBranch, localBranch) {
  if (!repository) {
    return {
      result: false,
      out: '需要指定仓库地址'
    }
  }
  if (!cwd) {
    return {
      result: false,
      out: '需要指定本地仓库地址'
    }
  }
  const option = {
    cwd: repository
  }
  let checkBranchArgs
  if (localBranch) {
    checkBranchArgs = ['git', 'checkout', '-b', localBranch,  `origin/${remoteBranch}`]
  } else {
    checkBranchArgs = ['git', 'checkout', '--track', `origin/${remoteBranch}`]
  }
  return await exec(checkBranchArgs.join(' '), option)
}

module.exports = {
  cloneRep,
  trackNewBranch
}
