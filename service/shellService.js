const cp = require('child_process')
const util = require('util')
const path = require('path')

const shellPath = path.resolve(__dirname, '..', 'shells')
const exec = util.promisify(cp.exec)

/**
 * 从远程克隆仓库
 *
 * @param {String} repSshUrl git仓库地址（ssh）
 * @param {String} cwd 仓库克隆的地址
 * @returns 返回执行promise
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
 * 检出已经存在的分支
 *
 * @param {String} repository 仓库绝对路径
 * @param {String} branch 要检出的分支
 */
async function checkoutBranch (repository, branch) {
  let option = {
    cwd: repository
  }
  return exec(`git checkout ${branch}`, option)
}

/**
 * 设置本地分支跟踪远程分支
 *
 * @param {String} repository 仓库绝对路径
 * @param {String} localBranch 本地分支
 * @param {String} remoteBranch 要跟踪远程分支
 */
function trackBranch (repository, localBranch, remoteBranch) {
}

/**
 * 新建本地分支跟踪远程分支
 *
 * @param {String} repository 仓库绝对地址
 * @param {String} localBranch 本地分支
 * @param {String} remoteBranch 要跟踪远程分支
 */
function trackNewBranch (repository, remoteBranch, localBranch) {
  if (!repository) {
    return {
      result: false,
      out: '需要指定仓库地址'
    }
  }
  const option = {
    cwd: repository
  }
  let checkBranchArgs
  if (localBranch) {
    checkBranchArgs = ['git', 'checkout', '-b', localBranch,  `origin\/${remoteBranch}`]
  } else {
    checkBranchArgs = ['git', 'checkout', '--track', `origin/${remoteBranch}`]
  }
  return exec(checkBranchArgs.join(' '), option)
}

/**
 * 获得仓库的所有git分支
 *
 * @param {String} repository  仓库的绝对路径
 */
function listBranch (repository) {
  let option = {
    cwd: repository
  }
  return exec('git branch', option)
}

/**
 * 获得仓库的所有git分支
 *
 * @param {String} repository  仓库的绝对地址
 */
function gitFetch (repository) {
  let option = {
    cwd: repository
  }
  return exec('git fetch', option)
}

/**
 * 在当前分支pull
 *
 * @param {String} repository 仓库绝对路径
 */
function gitPull (repository) {
  let option = {
    cwd: repository
  }
  return exec('git pull', option)
}

/**
 * 执行shell命令(极简版)
 *
 * @param {String} command 要执行的命令
 * @param {String} cwd 执行命令的路径
 */
function runCommand (command, cwd) {
  let option = {
    cwd
  }
  return exec(command, option)
}
/**
 * 执行npm包安装命令
 *
 * @param {String} repository 仓库的绝对路径
 */
function installNpmPackage (repository) {
  let option = {
    cwd: repository
  }
  return exec('cnpm install', option)
}

module.exports = {
  cloneRep,
  checkoutBranch,
  trackBranch,
  trackNewBranch,
  listBranch,
  gitPull,
  gitFetch,
  runCommand,
  installNpmPackage
}
