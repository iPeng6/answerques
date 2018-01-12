import {app, BrowserWindow, ipcMain, net, webContents} from 'electron'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path')
    .join(__dirname, '/static')
    .replace(/\\/g, '\\\\')
}

let mainWindow
const winURL =
  process.env.NODE_ENV === 'development'
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})



/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
let list = []
let reqnum = 0, curchunk = null
let interval = null

let questionUrl = 'http://www.mockhttp.cn/mock/ipengyl6'
// let questionUrl = 'http://htpmsg.jiecaojingxuan.com/msg/current'
function refreshQues() {
  console.log('refreshQues')
  const request = net.request(questionUrl)
  request.on('response', response => {
    console.log(`STATUS: ${response.statusCode}`)
    response.on('data', chunk => {
      // console.log(`BODY: ${chunk}`)
      try {
        
        curchunk = chunk = JSON.parse(chunk.toString())
        console.log(chunk)
        reqnum ++
        mainWindow.webContents.send('win-send-question', {data: chunk, reqnum: reqnum})

      } catch (error) {
        
      }
    })
  })
  request.end()
}

ipcMain.on('render-send-get', (event, arg) => {
  refreshQues()
})

ipcMain.on('render-send-auto', (event, auto) => {
  if (auto) {
    interval = setInterval(refreshQues, 1000)
  }else {
    clearInterval(interval)
  }
})

ipcMain.on('render-dom-ready', (event, arg) => {
  if (curchunk && curchunk.data && curchunk.data.event && curchunk.data.event.options) {
    let data = curchunk.data
    let title = data.event.desc.replace(/^\d+\./,'').trim()
    let answers = JSON.parse(data.event.options)
    answers.forEach((ans, i)=> {
      let temp = answers.slice()
      temp.splice(i, 1)
      
      let url = `https://www.baidu.com/s?ie=UTF-8&wd=${title} "${ans.trim()}" ${temp.map(v=> ' -'+v).join()}`
      console.log(url)
      const request = net.request(url)
      request.on('response', response => {
        console.log(`STATUS: ${response.statusCode}`)
        response.on('data', chunk => {
          // console.log(`BODY: ${chunk}`)
          // curchunk = chunk = JSON.parse(chunk.toString())
          let matchs = chunk.toString().match(/百度为您找到相关结果约([0-9|,]*)个/)
          if(matchs && matchs.length >= 2) {
            console.log({[ans.trim()]: matchs[1]})
            mainWindow.webContents.send('win-send-searchnum', {[ans.trim()]: matchs[1]})
          }
          
        })
      })
      request.end()
    })
  }
})

