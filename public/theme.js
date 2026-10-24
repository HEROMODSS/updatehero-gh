// Runs before first paint (external file so the CSP can stay script-src 'self').
(function () {
  var d = document.documentElement, g = function (k, v) { try { return localStorage.getItem(k) || v; } catch (e) { return v; } };
  var m = g('uh-mode', 'auto');
  if (m === 'auto') m = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  d.dataset.mode = m;
  d.dataset.color = g('uh-color', 'blue');
})();
