const colors = ['yellow', 'LightSkyBlue', 'Pink', 'green']
function highlight(keywords) {

  document.getElementById('content_right').remove()
  
  let inner = window.document.body.innerHTML

  let result = {}

  keywords.forEach( (k,i) => {
    k = k.trim()
    let regex = new RegExp(k, 'gi');
    let matches = inner.match(regex)
    if (matches) {
      result[k] = matches.length
    }else {
      result[k] = 0
    }
    console.log(k,regex)
    inner = inner.replace(regex,`<strong style="background:${colors[i]}; dispaly: inline-block; padding:5px;">${k}</strong>`)
  })
  window.document.body.innerHTML = inner

  return result
}

window.highlight = highlight