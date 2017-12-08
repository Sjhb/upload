
function upload (args, res) {
  let arr = []
  if (args) {
    args.forEach((value, key, map) => {
      arr.push(key)
      arr.push(value)
    })
  }
  res.write(JSON.stringify(arr))
  res.end()
}
module.exports = {upload}
