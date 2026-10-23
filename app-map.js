/* «خريطة الحفظ»: spelling families for the hard vowels. Words come from PH.families (data-families.js). */
(function () {
'use strict';
var App = window.App;
if (!App) return;
var h = App.h;
var CSS = `
.mm-page .en{white-space:nowrap}
.mm-wrap{display:grid;gap:16px}
.mm-intro{margin:0;color:var(--label2);line-height:1.6}
.mm-grid{display:grid;grid-auto-flow:row dense;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.mm-tile{display:grid;align-content:center;justify-items:center;gap:6px;min-height:92px;padding:14px 8px;border-radius:18px;background:var(--card);box-shadow:var(--shadow);color:var(--label);text-align:center;min-width:0;transition:transform .15s,background .15s}
.mm-tile:active{transform:scale(.97);background:var(--acc-wash)}
.mm-tile.wide{grid-column:1 / -1}
.mm-page .mm-pat{white-space:normal}
.mm-pat{font-size:30px;font-weight:700;line-height:1.15;direction:ltr;unicode-bidi:isolate;overflow-wrap:anywhere}
.mm-syms{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:2px 6px;font-size:14px;color:var(--label2);direction:ltr}
.mm-syms .t-ipa{font-size:14px;font-weight:500}
.mm-list{display:grid;gap:14px}
.mm-fam{display:grid;gap:12px;padding:14px;border-radius:18px;background:var(--card);box-shadow:var(--shadow)}
.mm-head{display:flex;align-items:center;gap:10px;direction:ltr;min-height:44px}
.mm-chunk{font-size:26px;font-weight:700;direction:ltr;unicode-bidi:isolate}
.mm-arrow{color:var(--label3);font-size:20px;flex:none}
.mm-head .t-ipa{font-size:30px;font-weight:600;color:var(--acc-ink)}
.mm-tag{margin-left:auto;display:inline-block;min-height:26px;padding:2px 10px;border-radius:13px;background:var(--fill);font-size:13px;line-height:22px;color:var(--label2);direction:rtl;text-align:center}
.mm-tag .en{margin:0 .15em;font-weight:700}
.mm-words{display:flex;flex-wrap:wrap;gap:8px;direction:ltr}
.mm-words .wchip{min-height:44px;font-size:17px}
.mm-words .wchip mark{background:var(--acc-wash);color:var(--acc-ink);text-decoration:underline;text-underline-offset:3px;border-radius:3px;font-weight:700}
.mm-watch{display:grid;gap:6px;padding:10px;border-radius:14px;background:var(--bad-bg)}
.mm-watch-lab{font-size:14px;font-weight:700;color:var(--bad)}
.mm-watch .wchip{background:var(--raised)}
.mm-watch .wchip i{font-size:15px;color:var(--bad);font-weight:600}
.mm-empty{color:var(--label2);text-align:center;margin:24px 0}
`;
function ensureCSS() {
  if (document.getElementById('css-map')) return;
  document.head.appendChild(h('style', { id: 'css-map', text: CSS }));
}

function data() {
  var f = (App.D && App.D.families) || (window.PH && window.PH.families);
  return Array.isArray(f) && f.length ? f : null;
}
function uniq(list) { return list.filter(function (x, i) { return list.indexOf(x) === i; }); }

/* Split a chunk at "_" and find each part in order; returns [[start, end], …] for the word. */
function spans(word, chunk) {
  var lw = word.toLowerCase(), parts = String(chunk).toLowerCase().split('_').filter(Boolean), at = 0, out = [];
  for (var i = 0; i < parts.length; i++) {
    var j = lw.indexOf(parts[i], at);
    if (j < 0) return [];
    out.push([j, j + parts[i].length]);
    at = j + parts[i].length;
  }
  return out;
}
function marked(word, chunk) {
  var s = spans(word, chunk), span = h('span'), pos = 0;
  s.forEach(function (r) {
    if (r[0] > pos) span.appendChild(document.createTextNode(word.slice(pos, r[0])));
    span.appendChild(h('mark', null, word.slice(r[0], r[1])));
    pos = r[1];
  });
  if (pos < word.length) span.appendChild(document.createTextNode(word.slice(pos)));
  return span;
}
/* A word chip with audio; the chunk letters are marked and an optional symbol sits before the speaker. */
function chip(word, chunk, sym) {
  var c = App.wordChip(word, { mark: false, trans: false });
  if (chunk && c.firstChild) c.replaceChild(marked(word, chunk), c.firstChild);
  if (sym) {
    var i = h('i', null, '/' + sym + '/');
    var svg = c.querySelector('svg');
    if (svg) c.insertBefore(i, svg); else c.appendChild(i);
  }
  return c;
}
function shown(chunk) { return String(chunk).replace(/_/g, '…'); }

function familyCard(f) {
  var head = h('div', { class: 'mm-head' },
    h('bdi', { class: 'mm-chunk en', dir: 'ltr', text: shown(f.chunk) }),
    h('span', { class: 'mm-arrow', 'aria-hidden': 'true', text: '→' }),
    App.ipaEl(f.sym),
    f.tag ? h('span', { class: 'mm-tag', richText: f.tag }) : null);
  var card = h('section', { class: 'mm-fam' }, head,
    h('div', { class: 'mm-words' }, (f.words || []).map(function (w) { return chip(w, f.chunk); })));
  if (f.watch && f.watch.length) {
    card.appendChild(h('div', { class: 'mm-watch' },
      h('span', { class: 'mm-watch-lab', text: 'انتبهي' }),
      h('div', { class: 'mm-words' }, f.watch.map(function (x) { return chip(x.w, f.chunk, x.sym); }))));
  }
  if (typeof App.familyDrill === 'function') {
    var b = h('button', { class: 'btn btn-tint', type: 'button', text: 'تدرّبي' });
    b.addEventListener('click', function () {
      var r;
      try { r = App.familyDrill({ title: shown(f.chunk) + ' /' + f.sym + '/', words: f.words.slice() }); } catch (e) { console.error(e); r = false; }
      if (r === false) b.remove();
    });
    card.appendChild(b);
  }
  return card;
}

function openPattern(g) {
  return App.openPage(g.spell, function (body) {
    body.appendChild(h('div', { class: 'mm-list' }, (g.families || []).map(familyCard)));
  }, { acc: 'L3', className: 'mm-page' });
}

App.registerPage('memory-map', function () {
  ensureCSS();
  return App.openPage('خريطة الحفظ', function (body) {
    var groups = data();
    if (!groups) { body.appendChild(h('p', { class: 'mm-empty', text: 'المحتوى غير متاح' })); return; }
    var grid = h('div', { class: 'mm-grid' }, groups.map(function (g) {
      var syms = uniq((g.families || []).map(function (f) { return f.sym; }));
      var t = h('button', { class: 'mm-tile' + (String(g.spell).length > 11 ? ' wide' : ''), type: 'button', 'aria-label': g.spell },
        h('bdi', { class: 'mm-pat en', dir: 'ltr', text: g.spell }),
        h('span', { class: 'mm-syms' }, syms.map(function (s, i) {
          return i ? [h('span', { 'aria-hidden': 'true', text: '·' }), App.ipaEl(s)] : [App.ipaEl(s)];
        })));
      t.addEventListener('click', function () { openPattern(g); });
      return t;
    }));
    body.appendChild(h('div', { class: 'mm-wrap' },
      h('p', { class: 'mm-intro', text: 'كلمات تشترك في الكتابة وفي الصوت. احفظيها معًا.' }), grid));
  }, { acc: 'L3', className: 'mm-page' });
});
})();
