// Applies the stored color-scheme preference before first paint so a dark
// preference doesn't flash light. External file because the strict CSP
// (script-src 'self') allows no inline scripts. Key mirrors src/lib/theme.ts.
;(function () {
  try {
    var v = localStorage.getItem('honestcv.theme')
    var dark =
      v === 'dark' ||
      (v !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (dark) document.documentElement.classList.add('dark')
  } catch (e) {
    /* ignore */
  }
})()
