import {app, BrowserWindow, ipcMain, net} from 'electron'

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

let reqnum = 0
ipcMain.on('render-send-get', (event, arg) => {
  console.log(arg)
  refreshQues()
})

let questionUrl = 'http://www.mockhttp.cn/mock/ipengyl6'
function refreshQues() {
  console.log('refreshQues')
  const request = net.request(questionUrl)
  request.on('response', response => {
    console.log(`STATUS: ${response.statusCode}`)
    response.on('data', chunk => {
      // console.log(`BODY: ${chunk}`)
      chunk = JSON.parse(chunk.toString())
      console.log(chunk)
      reqnum ++
      mainWindow.webContents.send('win-send-question', {data: chunk, reqnum: reqnum})
    })
  })
  request.end()
}

let interval = null
ipcMain.on('render-send-auto', (event, auto) => {
  console.log(auto)
  if (auto) {
    interval = setInterval(refreshQues, 1000)
  }else {
    clearInterval(interval)
  }
})