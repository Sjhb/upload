const FS = require('fs')
const URL = require('url')
const repHook = require('./controller/repHookController')
const repConfig = require('./controller/repConfigController')
const responseService = require('./service/responseService')

/**
 * 事件处理模块
 *
 * 以名称进行匹配，例如upload匹配的地址就是http://[host]/upload/**，**代表具体的处理程序
 */
let handles = {
  hook: repHook,
  repConfig: repConfig
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
  if (/\.[^.]+$/.test(pathname)) {
    let ext = pathname.match(/\.([^.]*)$/)[1]
    if (['css', 'html', 'js','mp4','jpeg','jpg','mp3', 'ico', 'json'].indexOf(ext) !== -1) {
      let path = './deb-dep/build/' + pathname.match(/^\/(.*$)$/)[1]
      let head = {'Content-Type': {
          'css': 'text/css',
          'js': 'application/javascript',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'html': 'text/html',
          'mp4': 'video/mp4',
          'mp3': 'video/mp3',
          'json': 'application/javascript',
          'ico': 'image/x-icon'
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
      func[reqHand[1]](req, res, query)
    } catch (err) {
      if (err.code) {
        // 预期的错误
        responseService.sendJsonResponse({}, res, err.code, err.message, 'error')
      } else {
        // 非预期的错误
        res.writeHead(200, {
          'Content-Type': 'text/html'
        })
        res.write(`<h1>404</h1><br><p>${err.message}</p>`)
        res.end()
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
      func[reqHand[1]](req, res, data)
    } catch (err) {
      if (err.code) {
        // 预期的错误
        responseService.sendJsonResponse({}, res, err.code, err.message, 'error')
      } else {
        // 非预期的错误
        res.writeHead(200, {
          'Content-Type': 'text/html'
        })
        res.write(`<h1>404</h1><br><p>${err.message}</p>`)
        res.end()
      }
    }
  })
  req.on('error', (err) => {
    responseService.sendJsonResponse(res, '500', err.message, 'error')
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
