/**
 * 返回json对象
 *
 * @param {json} head header头
 * @param {http.ServerResponse} response ServerResponse对象
 * @param {Number} code http状态码
 * @param {Json} content 具体要传输的信息
 * @param {String} des 描述
 */
function sendJsonResponse (head, response, code, content, des) {
  let resCode
  let msg = {
    description: des,
    content,
    code
  }
  let header = {
    'Content-Type': 'application/json'
  }
  for (let item in head) {
    header[item] = head[item]
  }
  if (!Number(code)) {
    resCode = 200
  } else {
    resCode = Math.floor(code)
  }
  response.writeHead(resCode, header)
  response.write(JSON.stringify(msg))
  response.end()
}

module.exports = {
  sendJsonResponse
}
