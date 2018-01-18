var path = require('path')
var Tesseract = require('tesseract.js')

const image = path.resolve(__dirname, '1.jpeg')
console.log(image)
Tesseract.recognize(image)
  .then(data => {
    console.log('then\n', data.text)
  })
  .catch(err => {
    console.log('catch\n', err)
  })
  .finally(e => {
    console.log('finally\n')
    process.exit()
  })
