const cp = require('child_process')
const util = require('util')

const execFile = util.promisify(cp.execFile)

/**
 * 从远程克隆仓库
 *
 * @param {Object} payload git仓库地址（ssh）
 * @param {String} cwd 仓库克隆的地址cwd
 * @returns 返回执行结果，格式：{result: Boolean, out: String}
 */
async function cloneRep (payload, cwd) {
  if (!cwd) {
    return {
      result: false,
      out: '需要指定克隆地址'
    }
  }
  let cloneProcess = null
  let clone = execFile('../shells/createrep.sh', {})
  let res = null
  try {
    res = await clone
    process.kill(cloneProcess.pid)
    return {
      result: true,
      out: res
    }
  } catch (err) {
    return {
      result: false,
      out: err
    }
  }
}

module.exports = {
  cloneRep
}
