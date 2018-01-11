import { error } from 'util';

const FS = require('fs')
const URL = require('url')
const static = require('./static')
const repController = require('./controller/repController')

/**
 * 事件处理模块
 *
 * 以名称进行匹配，例如upload匹配的地址就是http://[host]/upload/**，**代表具体的处理程序
 */
let handles = {
  hook: repController
}

/**
 * 返回json对象
 *
 * @param {json} head header头
 * @param {http.ServerResponse} response ServerResponse对象
 * @param {Number} code http状态码
 * @param {Json} content 具体要传输的信息
 * @param {String} des 描述
 */
function sendResponse (head, response, code, content, des) {
  let resCode
  let msg = {
    description: des,
    content
  }
  let head = {
    'Content-Type': 'application/json'
  }
  for (let item in head) {
    head[item] = head[item]
  }
  if (!Number(code)) {
    resCode = 200
  } else {
    resCode = Math.floor(code)
  }
  response.writeHead(resCode, head)
  response.write(JSON.stringify(msg))
  response.end()
}

/**
 * get 请求处理
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function handleGet (req, res) {
  // 数据获取
  let url = URL.parse(req.url)
  let pathname = url.pathname
  if ('/favicon.ico' === pathname) {
    // res.writeHead(200, {
    //   'Content-Type' : 'image/x-icon'
    // })
    // FS.createReadStream('./static/favicon.ico').pipe(res)
    res.end()
  } else if (/^\/static\/[^.]*\.[^\.]*$/.test(pathname)) {
    // 静态资源支持:如/static/**.html格式
    // 取得文件后缀名
    let ext = pathname.match(/\/static\/.*\.([^.]*)$/)[1]
    if (['css', 'html', 'js','mp4','jpeg','jpg','mp3'].indexOf(ext) !== -1) {
      let path = './static/' + pathname.match(/static\/(.*$)/)[1]
      let head = {'Content-Type': {
          'css': 'text/css',
          'js': 'application/javascript',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'html': 'text/html',
          'mp4': 'video/mp4',
          'mp3': 'video/mp3'
        }[ext]
      }
      //需要设置HTTP HEAD
      res.writeHead(200, head)
      //使用pipe
      FS.createReadStream(path).pipe(res)
    }
  } else {
    // 非静态资源支持
    // 获得句柄
    let reqHand = pathname.match(/([^\/]+)/g)
    // 获得参数
    let query = url.query
    try {
      let func = handles[reqHand[0]]
      func[reqHand[1]](query, req, res)
    } catch (err) {
      if (err.code) {
        // 预期的错误
        sendResponse({}, res, err.code, err.message, 'error')
      } else {
        // 非预期的错误
        sendResponse({}, res, 500, err, 'system error')
      }
    }
  }
}

/**
 * post 请求处理
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function handelPost (req, res) {
  let url = URL.parse(req.url)
  let pathname = url.pathname
  let data = ''
  req.setEncoding('utf8')
  req.on('data', (chunk) => {
    data += chunk
  })
  req.on('end', () => {
    // 获得句柄
    let reqHand = pathname.match(/([^\/]+)/g)
    try {
      let func = handles[reqHand[0]]
      func[reqHand[1]](data, req, res)
    } catch (err) {
      if (err.code) {
        // 预期的错误
        sendResponse(res, err.code, err.message, 'error')
      } else {
        // 非预期的错误
        sendResponse(res, 500, err, 'system error')
      }
    }
  })
  req.on('error', (err) => {
    sendResponse(res, '500', err.message, 'error')
  })
}

// 分发器
function dispatcher (req, res) {
  if (req.method === 'GET') {
    // get请求处理
    handleGet(req, res)
  } else if (req.method === 'POST') {
    // post请求处理
    handelPost(req, res)
  }
}

module.exports = dispatcher
