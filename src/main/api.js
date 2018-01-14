import {net} from 'electron'
import querystring from 'querystring'

class Api {
  constructor() {
    this.reqnum = 0
  }
  query(url, data) {
    return new Promise((resolve, reject) => {
      
      if (data) {
        let sper = url.includes('?') ? '&':'?'
        url = url + sper + querystring.stringify(data)
      }

      const request = net.request(url)
      request.on('response', response => {
        let body = ''
        response.on('data', chunk => {
          body += chunk
        })
        response.on('end', () => {
          this.reqnum ++
          resolve(body.toString())
        })
      })
      request.on('error', error => {
        reject(error)
      })
      request.end()
    })
  }
  post() {

  }
}

export default Api