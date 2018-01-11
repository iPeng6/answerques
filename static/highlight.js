const colors = ['yellow', 'LightSkyBlue', 'Pink', 'green']
function highlight(keywords) {

  let inner = window.document.body.innerHTML
  console.log(keywords)

  let result = {}
  keywords.forEach( (k,i) => {
    k = k.trim()
    let regex = new RegExp(k, 'gi');
    result[k] = inner.match(regex).length
    console.log(k,regex)
    inner = inner.replace(regex,`<strong style="background:${colors[i]}; dispaly: inline-block; padding:5px;">${k}</strong>`)
  })
  window.document.body.innerHTML = inner

  return result
}

window.highlight = highlight