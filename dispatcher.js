const FS = require('fs')
const URL = require('url')
const static = require('./static')
// const user = require('./handle/user')
const upload = require('./handle/upload')

let handles = {
  upload
}

// 返回json对象
function sendResponse (response, code, content, des) {
  let head = {
    'Content-Type': 'application/json'
  }
  let msg = {
    description: des,
    content
  }
  response.writeHead(code, head)
  response.write(JSON.stringify(msg))
  response.end()
}

function  dispatcher (req, res) {
  if (req.method === 'GET') {
    // 数据获取
    let url = URL.parse(req.url)
    let pathname = url.pathname
    if ('/favicon.ico' === pathname) {
      res.end()
      return
    }

    // 静态资源支持:如/static/**.html格式
    if (/^\/static\/[^.]*\.[^\.]*$/.test(pathname)) {
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
      let query = null
      if (url.query) {
        query = new Map(url.query.split('&').map(item => {
          return item.split('=')
        }))
      }
      try {
        let func = handles[reqHand[0]]
        func[reqHand[1]](query, res)
      } catch (err) {
        if (err.code) {
          // 预期的错误
          sendResponse(res, err.code, err.message, 'error')
        } else {
          // 非预期的错误
          sendResponse(res, 500, err, 'system error')
        }
      }
    }
  }
}

module.exports = dispatcher
