// Progressive-enhancement search filter for hub pages (e.g. /examples/).
// External file so the strict CSP (script-src 'self') needs no inline scripts.
// The input ships hidden in the HTML; without JS readers never see a dead control.
;(function () {
  var input = document.getElementById('hub-filter')
  var empty = document.getElementById('hub-filter-empty')
  if (!input) return
  input.hidden = false
  input.addEventListener('input', function () {
    var q = input.value.trim().toLowerCase()
    var any = false
    var lists = document.querySelectorAll('main ul.features')
    for (var i = 0; i < lists.length; i++) {
      var ul = lists[i]
      var items = ul.querySelectorAll('li')
      var shown = 0
      for (var j = 0; j < items.length; j++) {
        var item = items[j]
        var match = !q || (item.textContent || '').toLowerCase().indexOf(q) !== -1
        // Some items carry an inline display (e.g. flex), which would override
        // the [hidden] UA rule, so toggle display directly.
        if (match) {
          if (item.dataset.display !== undefined) item.style.display = item.dataset.display
        } else {
          if (item.dataset.display === undefined) item.dataset.display = item.style.display
          item.style.display = 'none'
        }
        if (match) shown++
      }
      ul.hidden = shown === 0
      var heading = ul.previousElementSibling
      if (heading && heading.tagName === 'H2') heading.hidden = shown === 0
      if (shown > 0) any = true
    }
    if (empty) empty.hidden = any
  })
})()
