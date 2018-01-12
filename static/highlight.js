const colors = ['yellow', 'LightSkyBlue', 'Pink', 'green']
function highlight(keywords) {

  document.getElementById('content_right').remove()

  let inner = window.document.body.innerHTML

  let result = {} // 统计关键字出现次数

  keywords.forEach( (k,i) => {
    k = k.trim()
  
    let regex1 = new RegExp(k, 'gi');
    let regex2 = new RegExp('>([^<>]*)('+k+')([^<>]*)<', 'gi'); //只高亮标签内容 去除标签属性匹配项
  
    inner = inner.replace(regex2, (a, b, c, d) => {
      let innerStr = '>'+b+c+d+'<'

      let matches = innerStr.match(regex1)
      if (matches) {
        result[k] = matches.length + (result[k]||0)
      }

      return innerStr.replace(regex1,`<strong style="background:${colors[i]}; dispaly: inline-block; padding:5px;">${k}</strong>`)
    })

  })
  window.document.body.innerHTML = inner

  return result
}

window.highlight = highlight