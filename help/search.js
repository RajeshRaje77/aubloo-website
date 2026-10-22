// Aubloo help centre search: a small static index, no third-party code, nothing sent anywhere.
(function () {
  var input = document.getElementById('help-q');
  var out = document.getElementById('help-results');
  if (!input || !out) return;
  var index = null;
  function load() {
    if (index) return Promise.resolve(index);
    return fetch('/help/search-index.json').then(function (r) { return r.json(); })
      .then(function (d) { index = d; return d; })
      .catch(function () { index = []; return index; });
  }
  function words(s) { return (s || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean); }
  function score(e, terms) {
    var t = (e.title || '').toLowerCase(), k = ((e.keywords || '') + ' ' + (e.summary || '') + ' ' + (e.section || '')).toLowerCase();
    var s = 0;
    for (var i = 0; i < terms.length; i++) {
      var w = terms[i], hit = 0;
      if (t.indexOf(w) >= 0) hit = 3; else if (k.indexOf(w) >= 0) hit = 1;
      if (!hit) return 0;
      s += hit;
    }
    return s;
  }
  function el(tag, text) { var n = document.createElement(tag); if (text) n.textContent = text; return n; }
  function render(q) {
    var terms = words(q);
    out.textContent = '';
    if (!terms.length) return;
    var hits = index.map(function (e) { return { e: e, s: score(e, terms) }; })
      .filter(function (h) { return h.s > 0; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, 8);
    if (!hits.length) {
      var li = el('li'); li.className = 'none';
      li.appendChild(document.createTextNode('Nothing matched. Try other words, or '));
      var a = el('a', 'contact us'); a.href = '/help/contact/'; li.appendChild(a);
      li.appendChild(document.createTextNode('.'));
      out.appendChild(li); return;
    }
    hits.forEach(function (h) {
      var li = el('li'), a = el('a', h.e.title); a.href = h.e.url; li.appendChild(a);
      li.appendChild(el('p', (h.e.section ? h.e.section + ' · ' : '') + (h.e.summary || '')));
      out.appendChild(li);
    });
  }
  var timer;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { load().then(function () { render(input.value); }); }, 120);
  });
  input.addEventListener('focus', load, { once: true });
  var form = input.form;
  if (form) form.addEventListener('submit', function (ev) {
    ev.preventDefault(); load().then(function () {
      render(input.value);
      var first = out.querySelector('a'); if (first) first.focus();
    });
  });
  var q = new URLSearchParams(location.search).get('q');
  if (q) { input.value = q; load().then(function () { render(q); }); }
})();
