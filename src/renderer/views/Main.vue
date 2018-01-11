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
        <ul class="anslist">
            <li v-for="(ans, index) in answers" :key="index">{{ ans }} 
              <span v-if="matchNum" :style="{backgroundColor: colors[index]}">{{matchNum[ans.trim()]}}</span>
            </li>
        </ul>
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
      url:'',
      baiduSearch: 'https://www.baidu.com/s?ie=UTF-8&wd=',
      preload: `file://${path.join(__static, './highlight.js')}`,
      matchNum: null,
      colors: ['yellow', 'LightSkyBlue', 'Pink', 'green']
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
      this.url='https://www.baidu.com'
    }
  },
  created() {
    this.$electron.ipcRenderer.on('win-send-question', (event, res) => {

      this.reqnum = res.reqnum

      if (res.data.data && res.data.data.event) {

        let data = res.data.data
  
        this.title = data.event.desc
        this.answers = JSON.parse(data.event.options)
  
        this.url = this.baiduSearch + this.title
      }
    })
  },
  mounted() {
    console.log(`file://${path.join(__static, './highlight.js')}`)
    const webview = document.querySelector('webview')
    webview.addEventListener('dom-ready', () => {
       console.log('dom-ready')
       let js = `highlight(["${this.answers.join('","')}"])`
       console.log(js)
       webview.executeJavaScript(js,false,(res)=>{
         this.matchNum = res
       })
    })

  }
}
</script>

<style lang="less" scoped>
.page {
  height: 100%;
}
.header {
  height: 55px;
  border-bottom: 1px solid #585c64;
  display: flex;

  .oper {
    width: 140px;
  }
  .title {
    flex: 1;
    font-size: 35px;
  }
}
.content {
  display: flex;
  height: 100%;
}
.left {
  width: 35%;
  border-right: 1px solid #585c64;
}
.right {
  width: 100%;
}
.anslist {
  padding: 30px;
  list-style-type: decimal;
  font-size: 30px;
}
</style>
