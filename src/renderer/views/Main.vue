<template>
  <div class="page"> 
    <div class="header">
      <span class="title">{{title}}</span>
      <div class="oper">
        <button @click="getQues">{{reqnum}}获取题目</button> <br/>
        <input type="checkbox" v-model="auto" id="auto" name="auto" @click="toggleAuto"/>
        <label for="auto">自动获取{{ auto?'中。。':''}}</label>
      </div>
    </div>
    <div class="content">
      <div class="left">

        <table class="anslist">
          <tr v-for="(ans, index) in answers" :key="index">
            <td>{{index+1}}. </td>
            <td>{{ ans }} </td>
            <td><span v-if="matchNum" :style="{backgroundColor: colors[index]}">{{matchNum[ans.trim()]}}</span></td>
            <!-- <td><span v-if="searchNum" class="searchnum">({{searchNum[ans.trim()]}})</span></td> -->
            <td><span v-if="percent" class="searchnum">({{(percent[ans.trim()]*100).toFixed(2)}})%</span></td> 
            <td><span v-if="airesult" class="airesult">({{airesult[index]}})</span></td>
          </tr>
        </table>
      </div>
      <div class="right">
        <webview id="wbview" :src="url" style="width:100%;height:100%;" :preload="preload"></webview>
      </div>
    </div>
  </div>
</template>

<script>
import path from 'path'
export default {
  data() {
    return {
      title: '',
      answers: [],
      auto: false,
      reqnum: 0,
      url: '',
      baiduSearch: 'https://www.baidu.com/s?ie=UTF-8&wd=',
      preload: `file://${path.join(__static, './highlight.js')}`,
      matchNum: null,
      colors: ['yellow', 'LightSkyBlue', 'Pink', 'green'],
      searchNum: null,
      airesult: null,
      percent: null
    }
  },
  methods: {
    getQues() {
      this.$electron.ipcRenderer.send('render-send-get')
    },
    toggleAuto() {
      this.auto = !this.auto

      this.$electron.ipcRenderer.send('render-send-auto', this.auto)
    },
    test() {
      this.url = 'https://www.baidu.com'
    },
    getQN(str) {
      let matchs = str.match(/百度为您找到相关结果约([0-9|,]*)个/)
      if (matchs && matchs.length >= 2) {
        return parseInt(matchs[1].replace(/,/gi, ''))
      }
      return 0
    },
    accv() {
      let summatch = 0, sumsearch = 0
      if(!this.matchNum) return
      summatch = Object.values(this.matchNum).reduce((m,n)=> m+n)
      sumsearch = Object.values(this.searchNum).reduce((m,n)=> m+n)

      let percent = {}
      for (let key in this.matchNum) { 
        percent[key] = (this.matchNum[key] / summatch + this.searchNum[key] / sumsearch ) / 2
      }

      console.log(percent)
      return percent
    }
  },
  created() {
    this.$electron.ipcRenderer.on('win-send-question', (event, res) => {
      this.reqnum = res.reqnum

      if (res.data.data && res.data.data.event) {
        let data = res.data.data

        this.title = data.event.desc
        this.answers = JSON.parse(data.event.options)

        this.url = this.baiduSearch + this.title.replace(/^\d+\./,'').replace(/\?|？/ig,'').trim()
      }
    })

    this.$electron.ipcRenderer.on('win-send-searchnum', (event, res) => {
      this.searchNum = Object.assign({}, this.searchNum||{}, res)

      if (Object.keys(this.searchNum).length === this.answers.length && this.answers.length !=0) {
        this.percent = this.accv()
      }
    })

    this.$electron.ipcRenderer.on('win-send-airesult', (event, res) => {
      this.airesult = JSON.parse(res).data
    })
  },
  mounted() {
    console.log(`file://${path.join(__static, './highlight.js')}`)
    const webview = document.querySelector('webview')
    webview.addEventListener('dom-ready', () => {
      console.log('dom-ready')
      let js = `window.highlight(["${this.answers.join('","')}"])`
      webview.executeJavaScript(js, false, res => {
        this.matchNum = res
      })
      let css=""
      webview.insertCSS(css)

      let curqn = 0 // 获取当前title对应的搜索数量
      webview.executeJavaScript('document.body.innerText', false, res => {
        curqn = this.getQN(res)
        console.log(curqn)
        this.$electron.ipcRenderer.send('render-dom-ready',curqn)
      })
      this.searchNum = null
      // webview.openDevTools() // webview的调试控制台
    })

  }
}
</script>

<style lang="less" scoped>
.page {
  height: 100%;
}
.header {
  // height: 10%;
  position: absolute;
  width: 100%;
  height: 80px;
  border-bottom: 1px solid #585c64;
  box-sizing: border-box;
  display: flex;
  align-items: center;

  .oper {
    width: 140px;
  }
  .title {
    flex: 1;
    font-size: 35px;
    padding-left: 18px;
  }
}
.content {
  display: flex;
  // height: 100%;
  position: absolute;
  top: 80px;
  bottom: 0;
  width: 100%
}
.left {
  width: 40%;
  border-right: 1px solid #585c64;
}
.right {
  width: 100%;
}
.anslist {
  margin: 18px 0 0 18px;
  padding: 0;
  list-style-type: decimal;
  font-size: 30px;
}
.searchnum {
  margin-left: 10px;
  font-size: 21px;
}
</style>
