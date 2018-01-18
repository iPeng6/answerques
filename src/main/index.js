import { app, BrowserWindow, ipcMain, net } from 'electron'
import path from 'path'
import fs from 'fs'
import Api from './api.js'
import { error } from 'util';
import { resolve } from 'url';

import Tesseract from 'tesseract.js'

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
const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`

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

let reqnum = 0, curquestion = null
let interval = null
let api = new Api()
let curqn = 0

let questionUrl = 'http://www.mockhttp.cn/mock/ipengyl6'
// let questionUrl = 'http://htpmsg.jiecaojingxuan.com/msg/current'

// 刷新题库 获取到题目 通知给页面
function refreshQues() {
  console.log('refreshQues')
  api
    .query(questionUrl)
    .then(res => {
      try {
        curquestion = JSON.parse(res)
        console.log(curquestion)
        mainWindow.webContents.send('win-send-question', {
          data: curquestion,
          reqnum: api.reqnum
        })
      } catch (error) {}
    })
    .catch(error => {})
  
}

// 监听页面 获取题目 事件
ipcMain.on('render-send-get', () => {
  refreshQues()
})

// 监听页面 自动获取 事件，生成定时器
ipcMain.on('render-send-auto', (event, auto) => {
  if (auto) {
    interval = setInterval(refreshQues, 1000)
  } else {
    clearInterval(interval)
  }
})

// 监听webview页面dom完成事件，为了不阻塞首屏搜索当dom好了 再去并发搜索题目 答案匹配度
//    https://www.baidu.com/s?ie=UTF-8&wd=title "A" -B -C 

function getQN(str) {
  let matchs = str.match(/百度为您找到相关结果约([0-9|,]*)个/)

  if (matchs && matchs.length >= 2) {
    return parseInt(matchs[1].replace(/,/gi, ''))
  }
  return 0
}

function requestQN(url) {
  let api = new Api()
  return new Promise((resolve, reject)=> {
    api.query(url).then(res=>{
      resolve(getQN(res))
    }).catch(error=>{
      reject(error)
    })
  })
}

ipcMain.on('render-dom-ready', (event, qn) => {
  curqn = qn
  console.log('main-qn',qn)
  if (curquestion && curquestion.data && curquestion.data.event && curquestion.data.event.options) {
    let data = curquestion.data
    let title = data.event.desc.replace(/^\d+\./, '').trim().replace(/\?/ig, '')
    let answers = JSON.parse(data.event.options)

    answers.forEach((ans, i) => {
      let temp = answers.slice()
      temp.splice(i, 1)
      ans = ans.trim()

      // let url = `https://www.baidu.com/s?ie=UTF-8&wd=${title} "${ans.trim()}" ${temp.map(v => ' -' + v).join()}`
      let url = `https://www.baidu.com/s?ie=UTF-8&wd=${title} -${ans}`
      console.log(url)
      requestQN(url).then(num=>{
        console.log({[ans]: num})
        mainWindow.webContents.send('win-send-searchnum', {
          [ans]: curqn - num
        })
      })
    })
  }
})


// const imgpath = `${path.join(__static, './1.jpeg')}`
const image = path.resolve(__dirname, '1.jpeg')

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
