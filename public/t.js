// First-party pageview beacon (the sole pageview source; path + external
// referrer origin on the first hit only, no PII). Browsers with the
// honestcv.qa flag (internal QA) are excluded from stats. Served as a
// static file so the strict CSP (script-src 'self') needs no inline scripts.
;(function () {
  try {
    if (localStorage.getItem('honestcv.qa') === '1') return
  } catch (e) {
    /* ignore */
  }
  var sent = ''
  var hit = function () {
    var p = location.pathname
    if (p === sent) return
    var first = sent === ''
    sent = p
    var r = ''
    if (first && document.referrer) {
      try {
        var o = new URL(document.referrer).origin
        if (o !== location.origin) r = o
      } catch (e) {
        /* ignore */
      }
    }
    try {
      navigator.sendBeacon('/api/hit', JSON.stringify({ p: p, r: r }))
    } catch (e) {
      /* ignore */
    }
  }
  hit()
  var push = history.pushState
  history.pushState = function () {
    push.apply(this, arguments)
    hit()
  }
  addEventListener('popstate', hit)
})()
