/* app-practice.js — practice module.
   Owns: the Practice tab; the pages practice-task / mock / mistakes; the in-app IPA keyboard;
   generated questions (stable ids g-<type>-<key>); answer recording through App.recordAnswer.
   Contract: content/app-api.md. Copy: content/copy-guide.md. */
(function () {
'use strict';
var App = window.App;
if (!App) return;
var D = App.D || {};
var h = App.h;

/* =====================================================================
   1. Styles (only what index.html does not already have; tokens only)
   ===================================================================== */
var CSS = [
  '.pr-qs{display:flex;flex-direction:column;',
  '  min-height:calc(100vh - 72px - env(safe-area-inset-top) - env(safe-area-inset-bottom));',
  '  min-height:calc(100dvh - 72px - env(safe-area-inset-top) - env(safe-area-inset-bottom));',
  '  animation:prIn .28s cubic-bezier(.16,1,.3,1)}',
  '@keyframes prIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
  '.pr-grow{flex:1 1 auto;min-height:6px}',
  '.pr-end{margin-inline-start:auto}',
  '.pr-a2{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:11px;font-size:12px;font-weight:600;color:var(--acc-ink);background:var(--acc-wash);white-space:nowrap}',
  '.pr-ins{font-size:17px;font-weight:600;line-height:1.4}',
  '.pr-ins-en{margin-top:6px}',
  '.pr-help{margin-top:8px;font-size:13px;color:var(--label2)}',
  '.pr-word{margin-top:14px;direction:ltr;text-align:center;font-size:34px;font-weight:600;letter-spacing:-.01em;line-height:1.2}',
  '.pr-symbig{margin-top:12px;direction:ltr;text-align:center;font-size:44px;font-weight:500;line-height:1.2}',
  '.pr-descbox{margin-top:14px;padding:14px 16px;border-radius:14px;background:var(--raised);text-align:center}',
  '.pr-frame.q-big{font-size:28px;color:var(--label2);padding:8px 0 2px}',
  '.pr-frame .gap{min-width:64px;min-height:1.25em;padding:0 6px;border-radius:8px 8px 0 0;vertical-align:bottom;transition:background .2s,color .2s,border-color .2s}',
  '.pr-frame .gap.right{color:var(--ok);border-bottom-color:var(--ok);background:var(--ok-bg)}',
  '.pr-frame .gap.wrong{color:var(--bad);border-bottom-color:var(--bad);background:var(--bad-bg)}',
  '.pr-caret{display:inline-block;width:2px;height:.95em;margin:0 1px;vertical-align:-.1em;background:var(--acc);animation:blink 1s steps(1) infinite}',
  '.answer-box .pr-typed{white-space:pre}',
  '.pr-opts2{grid-template-columns:1fr 1fr}',
  '.opt.pr-ipa{justify-content:center;min-height:60px;font-size:24px;font-weight:600}',
  '.opt:disabled{cursor:default;color:inherit}',
  '.pr-tf .opt{flex-direction:column;gap:0;min-height:60px}',
  '.pr-tf .opt small{font-size:12px;font-weight:500;color:var(--label2);direction:ltr}',
  '.pr-bk-h{display:flex;align-items:baseline;gap:8px}',
  '.pr-bk-h .pr-bk-ar{font-size:14px;font-weight:600}',
  '.pr-bk-h .t-en{margin-right:auto;font-size:13px;color:var(--label2)}',
  '.bucket{cursor:pointer}',
  '.bucket:active{background:var(--fill2)}',
  '.si,.mt{transition:background .18s,border-color .18s}',
  /* bottom bars: keyboard and next/check bar share the same spot */
  '.pr-bar{position:sticky;bottom:0;z-index:4;margin:14px -16px calc(-28px - env(safe-area-inset-bottom));padding:10px 16px calc(10px + env(safe-area-inset-bottom));',
  '  background:var(--bar);border-top:0.5px solid var(--bar-line);-webkit-backdrop-filter:saturate(180%) blur(20px);backdrop-filter:saturate(180%) blur(20px)}',
  '.kb.pr-kb{margin-bottom:calc(-28px - env(safe-area-inset-bottom));padding:8px 6px calc(8px + env(safe-area-inset-bottom))}',
  '.pr-kb .kb-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px 5px;direction:ltr}',
  '.pr-kb .key{max-width:none;width:100%;height:46px;font-size:22px;line-height:1}',
  '.pr-kb .key.wide{max-width:none;font-size:17px}',
  '.pr-kb .key.s2{grid-column:span 2}.pr-kb .key.s4{grid-column:span 4}.pr-kb .key.s5{grid-column:span 5}',
  '.pr-kb .key.go:disabled{background:var(--fill2);color:var(--label3);box-shadow:none}',
  '@supports not ((-webkit-backdrop-filter:blur(1px)) or (backdrop-filter:blur(1px))){.pr-bar{background:var(--bg)}}',
  /* feedback */
  '.fb.right .fb-head svg{animation:prPop .4s cubic-bezier(.25,1,.5,1)}',
  '@keyframes prPop{from{opacity:.4;transform:scale(.6)}to{opacity:1;transform:scale(1)}}',
  '.pr-ansrow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px}',
  '.pr-big{direction:ltr;unicode-bidi:isolate;font-size:26px;font-weight:700;line-height:1.2}',
  '.fb .exam-line{margin-top:8px;background:var(--raised)}',
  '.fb .feat div{background:var(--raised)}',
  '.pr-feat b{white-space:normal;overflow:visible;line-height:1.25}',
  '.pr-fix{margin-top:8px;padding:8px 12px;border-radius:12px;background:var(--raised);direction:ltr;text-align:left;font-size:14px;line-height:1.5}',
  '.pr-fix li + li{margin-top:4px}',
  '.pr-note{margin-top:6px;font-size:14px;color:var(--label2);line-height:1.5}',
  /* practice tab */
  '.pr-chips .chip-t{min-height:44px;border-radius:22px}',
  '.pr-stats{margin-top:14px;padding:16px}',
  '.pr-sthead{display:flex;align-items:baseline;gap:6px}',
  '.pr-sthead b{font-size:34px;font-weight:700;line-height:1;letter-spacing:-.02em}',
  '.pr-sthead span{font-size:15px;color:var(--label2)}',
  '.pr-leg{display:inline-flex;align-items:center;gap:4px;font-size:13px;color:var(--label2)}',
  '.pr-leg b{font-weight:600;color:var(--label)}',
  '.pr-stats .btn{margin-top:16px}',
  '.pr-small{margin-top:10px;font-size:13px;color:var(--label2);line-height:1.5}',
  /* end screens */
  '.pr-endwrap{padding-top:6px;animation:prIn .28s cubic-bezier(.16,1,.3,1)}',
  '.pr-result{position:relative;overflow:hidden}',
  '.pr-actions{display:grid;gap:10px;margin-top:14px}',
  '.pr-intro{padding:18px 16px}',
  '.pr-intro h2{font-size:22px;font-weight:700;line-height:1.25}',
  '.pr-intro p{margin-top:8px;font-size:15px;color:var(--label2);line-height:1.55}',
  '.pr-intro .list{margin-top:14px;background:var(--raised);box-shadow:none}',
  '.pr-sheet-fb{max-height:58vh;overflow-y:auto;margin-top:10px;-webkit-overflow-scrolling:touch}',
  '.pr-sheet-fb .fb{margin-top:10px}',
  '.pr-qline{direction:ltr;text-align:left;font-size:17px;font-weight:600}'
].join('\n');
(function injectCSS() {
  try {
    if (document.getElementById('css-practice')) return;
    var st = document.createElement('style');
    st.id = 'css-practice';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  } catch (e) { /* no styles is better than no module */ }
})();

/* =====================================================================
   2. Vocabulary
   ===================================================================== */
var LECS = ['L1', 'L2', 'L3', 'L4'];
var ROUND = 15;
var SPEC = { short: 1, long: 1, centring: 1, 'closing-i': 1, 'closing-u': 1, tri: 1, rpga: 1 };
var FILTERS = [
  { k: 'desc', ar: 'من الوصف للرمز', types: ['desc'] },
  { k: 'word', ar: 'من الكلمة للحرف', types: ['word'] },
  { k: 'trans', ar: 'نطق الكلمة كاملة', types: ['trans'] },
  { k: 'choice', ar: 'اختيار', types: ['mcq', 'sym', 'dword'] },
  { k: 'tf', ar: 'صح أو خطأ', types: ['tf'] },
  { k: 'match', ar: 'مطابقة وتصنيف', types: ['match', 'sort'] }
];
var FK = {};
FILTERS.forEach(function (f) { f.types.forEach(function (t) { FK[t] = f.k; }); });
var KIND_AR = {
  desc: 'من الوصف للرمز', word: 'من الكلمة للحرف', trans: 'نطق الكلمة كاملة',
  sym: 'وصف الحرف', dword: 'الحرف المزدوج', mcq: 'اختيار', tf: 'صح أو خطأ', match: 'مطابقة', sort: 'تصنيف'
};
var TYPE_ORDER = ['desc', 'word', 'trans', 'sym', 'dword', 'mcq', 'tf', 'match', 'sort'];
var INSTR = {
  desc: ['اكتبي رمز الحرف حسب الوصف', 'Provide the correct sound according to the description'],
  word: ['اكتبي رمز الحرف الصوتي', 'Write the symbol of the vowel'],
  trans: ['اكتبي نطق الكلمة كاملة', 'Transcribe the whole word'],
  sym: ['اختاري الوصف الصحيح للحرف', 'Choose the correct description'],
  dword: ['اختاري الحرف المزدوج في الكلمة', 'Which diphthong is in this word?']
};
var BUCKET_AR = {
  voiceless: 'بلا اهتزاز', voiced: 'مع اهتزاز', short: 'قصير', long: 'طويل',
  centring: 'المتجهة للوسط', 'closing → ɪ': 'الصاعدة إلى ɪ', 'closing → ʊ': 'الصاعدة إلى ʊ'
};
var MOCK_PARTS = [
  { type: 'desc', n: 6, ar: 'من الوصف للرمز', short: 'الوصف' },
  { type: 'word', n: 8, ar: 'من الكلمة للحرف', short: 'الكلمة' },
  { type: 'trans', n: 6, ar: 'نطق الكلمة كاملة', short: 'النطق' }
];
var A2 = D.assignment || {};
var A2W = A2.part2 || [], A2T = A2.part3 || [];
var VOW = {}, DIPH = {}, TRI = {};
(D.vowels || []).forEach(function (v) { VOW[v.s] = v; });
(D.diphthongs || []).forEach(function (d) { DIPH[d.s] = d; });
(D.triphthongs || []).forEach(function (t) { TRI[t.s] = t; });

/* =====================================================================
   3. Small helpers
   ===================================================================== */
function slug(w) { return String(w == null ? '' : w).trim().toLowerCase(); }
function prefs() {
  var p = App.state.prefs;
  if (!p.practice || typeof p.practice !== 'object' || Array.isArray(p.practice)) p.practice = {};
  return p.practice;
}
function arr(x) { return Array.isArray(x) ? x : []; }
function n11(n) { return n <= 1 ? 'سؤال' : (n === 2 ? 'سؤالان' : (n >= 3 && n <= 10 ? 'أسئلة' : 'سؤالًا')); }
function qCount(n) { return App.plural(n, ['سؤال واحد', 'سؤالان', 'أسئلة', 'سؤالًا']); }
function ipaBig(s) { return h('bdi', { class: 'pr-big', dir: 'ltr' }, '/' + s + '/'); }
function why(html, cls) { return h('p', { class: cls || 'fb-why', rich: html }); }
function srcP(node) { return node ? h('p', { class: 'fb-src' }, node) : null; }
function reduced() { return App.reducedMotion(); }
function marked(e) {
  var out = [], re = /\[([^\]]*)\]/g, m;
  while ((m = re.exec(String(e.sp || '')))) out.push(m[1]);
  return out.join('-');
}
/* «الحرف المكتوب a في ban يُنطق /æ/» or the plural form for two or more letters */
function lettersSay(e, sym) {
  var l = marked(e);
  var many = l.replace(/-/g, '').length > 1;
  return (many ? 'الحروف المكتوبة ' : 'الحرف المكتوب ') + App.en(l) + ' في ' + App.en(e.w) + (many ? ' تُنطق ' : ' يُنطق ') + App.ipa(sym);
}
function a2Words() { return A2W.concat(A2T); }
/* an example word for a sound, preferring one with a recorded clip */
function exampleWord(sym) {
  var x = App.vowel(sym), c = [];
  if (x && x.head) c = c.concat(x.head);
  a2Words().forEach(function (w) { var e = App.lexWord(w); if (e && e.v === sym) c.push(w); });
  App.lexFor(sym).forEach(function (e) { if (!e.ex) c.push(e.w); });
  for (var i = 0; i < c.length; i++) if (App.hasAudio(c[i])) return c[i];
  return c[0] || null;
}
function chipFor(w) { return w ? App.wordChip(w) : null; }
function vowelSpeak(sym) {
  return App.canPlayVowel(sym) ? App.speakButton({ vowel: sym, label: 'اسمعي الحرف' }) : null;
}
function shared(a, b) { return (a.h === b.h) + (a.f === b.f) + (a.r === b.r) + (a.t === b.t); }

/* =====================================================================
   4. Question bank (authored + generated, rebuilt identically from ids)
   ===================================================================== */
var BANK = null, BYID = {}, WORDS_BY_V = {}, TRANS_BY_D = {};
function add(q) {
  if (BYID[q.id]) return;
  q.fk = FK[q.type];
  BYID[q.id] = q;
  BANK.push(q);
}
function buildBank() {
  BANK = [];
  (D.vowels || []).forEach(function (v) {
    add({ id: 'g-desc-' + v.c, type: 'desc', lec: 'L3', topics: [v.len], kind: 'kb', kb: 'v', answer: v.s, v: v, hint: v.s, a2: true });
  });
  (App.lex || []).forEach(function (e) {
    if (e.ex) return;
    var k = slug(e.w), v = VOW[e.v], d = DIPH[e.v], t = TRI[e.v];
    if (v) {
      var qw = { id: 'g-word-' + k, type: 'word', lec: e.lec || 'L3', topics: [v.len], kind: 'kb', kb: 'v', answer: v.s, e: e, v: v, hint: v.s, a2: A2W.indexOf(k) > -1 };
      add(qw);
      (WORDS_BY_V[v.s] = WORDS_BY_V[v.s] || []).push(qw);
    } else if (d) {
      var qt = { id: 'g-trans-' + k, type: 'trans', lec: e.lec || 'L4', topics: [d.g], kind: 'kb', kb: 'full', answer: e.t, e: e, d: d, hint: d.s, a2: A2T.indexOf(k) > -1 };
      add(qt);
      (TRANS_BY_D[d.s] = TRANS_BY_D[d.s] || []).push(qt);
    } else if (t) {
      add({ id: 'g-trans-' + k, type: 'trans', lec: e.lec || 'L4', topics: ['tri'], kind: 'kb', kb: 'full', answer: e.t, e: e, tri: t, hint: t.base, a2: false });
    }
  });
  (D.vowels || []).forEach(function (v) {
    add({ id: 'g-sym-' + v.c, type: 'sym', lec: 'L3', topics: [v.len], kind: 'choice', v: v, hint: v.s, a2: false, make: symOptions });
  });
  (App.lex || []).forEach(function (e) {
    if (e.ex || !DIPH[e.v]) return;
    var k = slug(e.w), d = DIPH[e.v];
    add({ id: 'g-dword-' + k, type: 'dword', lec: e.lec || 'L4', topics: [d.g], kind: 'choice', e: e, d: d, hint: d.s, a2: A2T.indexOf(k) > -1, make: dwordOptions });
  });
  (D.questions || []).forEach(function (x) {
    if (!x || !x.id) return;
    add({ id: x.id, type: x.type, lec: x.lec, topics: [x.topic || String(x.lec || '').toLowerCase()], kind: x.type === 'mcq' ? 'choice' : x.type, x: x, a2: false, make: x.type === 'mcq' ? mcqOptions : null });
  });
}
function bank() { if (!BANK) buildBank(); return BANK; }
function getQ(id) { bank(); return BYID[id] || null; }

/* options, shuffled on every showing */
function symOptions(q) {
  var v = q.v;
  var others = (D.vowels || []).filter(function (x) { return x !== v; })
    .map(function (x) { return { x: x, k: shared(x, v) + Math.random() * 0.5 }; })
    .sort(function (a, b) { return b.k - a.k; }).slice(0, 3).map(function (o) { return o.x; });
  var list = App.shuffle([v].concat(others));
  return { opts: list.map(function (x) { return App.descLine(x); }), a: list.indexOf(v), ref: list };
}
function dwordOptions(q) {
  var d = q.d;
  var same = (D.diphthongs || []).filter(function (x) { return x.g === d.g && x !== d; });
  var other = App.shuffle((D.diphthongs || []).filter(function (x) { return x.g !== d.g; }));
  var list = App.shuffle([d].concat(same.concat(other).slice(0, 3)));
  return { opts: list.map(function (x) { return '/' + x.s + '/'; }), a: list.indexOf(d), ref: list, grid: true };
}
function mcqOptions(q) {
  var idx = App.shuffle(q.x.o.map(function (o, i) { return i; }));
  return { opts: idx.map(function (i) { return q.x.o[i]; }), a: idx.indexOf(q.x.a) };
}

/* pools */
function poolFor(lecs, keys) {
  return bank().filter(function (q) {
    return (!lecs.length || lecs.indexOf(q.lec) > -1) && (!keys.length || keys.indexOf(q.fk) > -1);
  });
}
/* a task's pool: match the specific topic (short, centring, tri …) when the question has one,
   so «short vowels» does not pull long-vowel drills in through the shared 'l3' */
function poolForTopics(topics, types) {
  topics = arr(topics);
  return bank().filter(function (q) {
    if (types && types.length && types.indexOf(q.type) < 0) return false;
    var spec = q.topics.filter(function (t) { return SPEC[t]; });
    return (spec.length ? spec : q.topics).some(function (t) { return topics.indexOf(t) > -1; });
  });
}
var RANK = { wrong: 0, new: 1, right: 2, mastered: 3 };
/* wrong first, then new, then right, then mastered; Assignment 2 items first inside each group */
function order(list) {
  return App.shuffle(list).map(function (q, i) {
    return { q: q, k: RANK[App.qStatus(q.id)] * 2 + (q.a2 ? 0 : 1), i: i };
  }).sort(function (a, b) { return a.k - b.k || a.i - b.i; }).map(function (o) { return o.q; });
}
function makeList(pool, n, prev) {
  var out = [];
  if (!pool.length || n <= 0) return out;
  var guard = 0;
  while (out.length < n && guard++ < 50) {
    var o = order(pool);
    var last = out.length ? out[out.length - 1] : prev;
    if (last && o.length > 1 && o[0].id === last.id) o.push(o.shift());
    out = out.concat(o);
  }
  return out.slice(0, n);
}

/* short one-line form of a question (lists, review rows) */
function shortPrompt(q) {
  if (q.type === 'desc') return App.descLine(q.v) + '.';
  if (q.type === 'sym') return '/' + q.v.s + '/';
  if (q.type === 'word') return q.e.w + ' (' + App.lexFrame(q.e) + ')';
  if (q.type === 'trans' || q.type === 'dword') return q.e.w;
  return q.x ? q.x.q : q.id;
}
function promptEl(q) { return h('bdi', { dir: 'ltr', lang: 'en' }, shortPrompt(q)); }
function answerText(q) {
  if (q.type === 'desc' || q.type === 'word') return q.answer;
  if (q.type === 'trans') return App.normIPA(q.answer);
  return '';
}

/* =====================================================================
   5. Hint (small chart with one position dot, from app-vowels)
   ===================================================================== */
var hintState = null;
function hintName() {
  if (hintState !== null) return hintState;
  hintState = false;
  ['hintChart', 'miniChart'].some(function (n) {
    if (!App.hasWidget(n)) return false;
    try {
      var node = App.widget(n, { sym: 'iː' });
      var stub = !node || (!(node.querySelector && node.querySelector('svg')) && /قيد التجهيز/.test(node.textContent || ''));
      if (!stub) { hintState = n; return true; }
    } catch (e) { /* treat as missing */ }
    return false;
  });
  return hintState;
}
function hintTools(q, card) {
  if (!q.hint) return null;
  var name = hintName();
  if (!name) return null;
  var box = null;
  var label = h('span', null, 'تلميح');
  var btn = h('button', { class: 'text-btn', type: 'button', 'aria-expanded': 'false' }, App.icon('compass'), label);
  var tools = h('div', { class: 'q-tools' }, btn);
  btn.addEventListener('click', function () {
    if (box) {
      box.remove(); box = null;
      label.textContent = 'تلميح'; btn.setAttribute('aria-expanded', 'false');
      return;
    }
    var mono = !!VOW[q.hint];
    box = h('div', { class: 'hint' },
      h('p', null, mono ? 'مكان الحرف على المخطط.' : 'حركة الحرف المزدوج على المخطط.'),
      App.widget(name, { sym: q.hint }));
    card.appendChild(box);
    label.textContent = 'أخفي التلميح'; btn.setAttribute('aria-expanded', 'true');
  });
  card.appendChild(tools);
  return tools;
}

/* =====================================================================
   6. IPA keyboard (no input element, so the phone keyboard never opens)
   ===================================================================== */
var KB_V = ['i', 'ɪ', 'e', 'æ', 'a', 'ɑ', 'ɒ', 'ɔ', 'ʊ', 'u', 'ʌ', 'ɜ', 'ə', 'ː'];
var KB_C = ['p', 'b', 't', 'd', 'k', 'g', 'h', 'f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ', 'm', 'n', 'l', 'r', 'w', 'j'];
var KB_EXTRA = ['ŋ'];
function keyboard(full, api) {
  var grid = h('div', { class: 'kb-grid' });
  function key(ch, cls) {
    return h('button', { class: 'key' + (cls ? ' ' + cls : ''), type: 'button', lang: 'en', onclick: function () { api.put(ch); } }, ch);
  }
  KB_V.forEach(function (ch) { grid.appendChild(key(ch, 'v')); });
  if (full) {
    KB_C.forEach(function (ch) { grid.appendChild(key(ch)); });
    KB_EXTRA.forEach(function (ch) { grid.appendChild(key(ch)); });
  }
  var del = h('button', { class: 'key wide s2', type: 'button', 'aria-label': 'امسحي آخر رمز', onclick: function () { api.del(); } }, '⌫');
  var go = h('button', { class: 'key wide go ' + (full ? 's4' : 's5'), type: 'button', dir: 'rtl', disabled: true, onclick: function () { api.check(); } }, 'تحقّقي');
  grid.appendChild(del);
  grid.appendChild(go);
  return {
    el: h('div', { class: 'kb pr-kb', role: 'group', 'aria-label': 'لوحة الرموز الصوتية' }, grid),
    ready: function (on) { go.disabled = !on; }
  };
}

/* =====================================================================
   7. Question views
   ===================================================================== */
function promptNode(q) {
  var box = h('div');
  var ins = INSTR[q.type];
  if (ins) {
    box.appendChild(h('p', { class: 'pr-ins', richText: ins[0] }));
    box.appendChild(h('div', { class: 'pr-ins-en' }, h('bdi', { class: 'en-pill', dir: 'ltr' }, ins[1])));
  }
  if (q.type === 'desc') box.appendChild(h('p', { class: 'q-desc pr-descbox', dir: 'ltr', lang: 'en' }, App.descLine(q.v) + '.'));
  else if (q.type === 'sym') box.appendChild(h('p', { class: 'pr-symbig', dir: 'ltr' }, '/' + q.v.s + '/'));
  else if (q.e) box.appendChild(h('p', { class: 'pr-word', dir: 'ltr', lang: 'en' }, q.e.w));
  else if (q.x) {
    box.appendChild(h('p', { class: 'q-text ltr', dir: 'ltr', lang: 'en' }, q.x.q));
    if (q.type === 'match') box.appendChild(h('p', { class: 'pr-help' }, 'المسي ما يقابل العنصر المحدّد.'));
    if (q.type === 'sort') box.appendChild(h('p', { class: 'pr-help' }, 'المسي المجموعة المناسبة لكل رمز.'));
  }
  return box;
}

function caretEl() { return h('i', { class: 'pr-caret', 'aria-hidden': 'true' }); }
function makeDisplay(q) {
  if (q.type === 'word') {
    var gap = h('span', { class: 'gap' });
    var pre = App.normIPA(q.e.pre), post = App.normIPA(q.e.post);
    var frame = h('p', { class: 'q-big pr-frame', dir: 'ltr', 'aria-live': 'polite' },
      pre ? h('span', null, pre) : null, gap, post ? h('span', null, post) : null);
    return {
      el: frame,
      set: function (t) { gap.textContent = t; gap.appendChild(caretEl()); },
      done: function (ok) { var c = gap.querySelector('.pr-caret'); if (c) c.remove(); gap.classList.add(ok ? 'right' : 'wrong'); }
    };
  }
  var typed = h('span', { class: 'pr-typed' });
  var caret = caretEl();
  var box = h('div', { class: 'answer-box', dir: 'ltr', 'aria-live': 'polite' },
    h('span', { class: 'sl' }, '/'), typed, caret, h('span', { class: 'sl' }, '/'));
  return {
    el: box,
    set: function (t) { typed.textContent = t; },
    done: function (ok) { caret.remove(); box.classList.add(ok ? 'right' : 'wrong'); }
  };
}

function kbView(q, ctx) {
  var buf = [];
  var full = q.kb === 'full';
  var disp = makeDisplay(q);
  var kb = keyboard(full, { put: put, del: del, check: check });
  var allowed = {};
  KB_V.concat(full ? KB_C.concat(KB_EXTRA) : []).forEach(function (c) { allowed[c] = 1; });
  function draw() { disp.set(buf.join('')); kb.ready(buf.length > 0); }
  function put(ch) { if (ctx.answered || buf.length >= 16) return; buf.push(ch); draw(); }
  function del() { if (ctx.answered) return; buf.pop(); draw(); }
  function check() {
    if (ctx.answered || !buf.length) return;
    var given = buf.join('');
    var ok = App.normIPA(given) === App.normIPA(q.answer);
    disp.done(ok);
    ctx.finish(ok, given);
  }
  draw();
  return {
    el: disp.el,
    bar: kb.el,
    key: function (e) {
      if (e.key === 'Backspace') { del(); return true; }
      if (e.key === 'Enter') { check(); return true; }
      var k = e.key === ':' ? 'ː' : (e.key === 'ɡ' ? 'g' : e.key);
      if (k && allowed[k]) { put(k); return true; }
      return false;
    }
  };
}

function choiceView(q, ctx) {
  var m = q.make(q);
  var wrap = h('div', { class: 'opts' + (m.grid ? ' pr-opts2' : '') });
  var btns = m.opts.map(function (o, i) {
    var b = h('button', { class: 'opt ltr' + (m.grid ? ' pr-ipa' : ''), type: 'button', dir: 'ltr', lang: 'en' },
      m.grid ? null : h('span', { class: 'o-k' }, String.fromCharCode(97 + i)), h('span', null, o));
    b.addEventListener('click', function () { pick(i); });
    wrap.appendChild(b);
    return b;
  });
  function pick(i) {
    if (ctx.answered) return;
    btns.forEach(function (b, j) { b.disabled = true; b.classList.add(j === m.a ? 'right' : (j === i ? 'wrong' : 'muted')); });
    ctx.finish(i === m.a, m.opts[i], { pick: m.ref ? m.ref[i] : null });
  }
  return {
    el: wrap,
    key: function (e) {
      var n = '1234'.indexOf(e.key);
      if (n < 0) n = 'abcd'.indexOf(e.key);
      if (n > -1 && n < btns.length) { pick(n); return true; }
      return false;
    }
  };
}

function tfView(q, ctx) {
  var wrap = h('div', { class: 'tf pr-tf' });
  var vals = [[true, 'صح', 'True'], [false, 'خطأ', 'False']];
  var btns = vals.map(function (v) {
    var b = h('button', { class: 'opt', type: 'button' }, h('span', null, v[1]), h('small', null, v[2]));
    b.addEventListener('click', function () { pick(v[0]); });
    wrap.appendChild(b);
    return b;
  });
  function pick(val) {
    if (ctx.answered) return;
    var right = !!q.x.a;
    btns.forEach(function (b, j) { b.disabled = true; b.classList.add(vals[j][0] === right ? 'right' : (vals[j][0] === val ? 'wrong' : 'muted')); });
    ctx.finish(val === right, val ? 'صح' : 'خطأ');
  }
  return {
    el: wrap,
    key: function (e) {
      if (e.key === 't' || e.key === '1') { pick(true); return true; }
      if (e.key === 'f' || e.key === '2') { pick(false); return true; }
      return false;
    }
  };
}

function checkBar(onCheck) {
  var b = h('button', { class: 'btn btn-primary', type: 'button', disabled: true, onclick: onCheck }, 'تحقّقي');
  return { el: h('div', { class: 'pr-bar' }, b), btn: b };
}

function matchView(q, ctx) {
  var pairs = q.x.pairs;
  var L = pairs.map(function (p, i) { return { t: p[0], i: i }; });
  var R = App.shuffle(pairs.map(function (p, i) { return { t: p[1], i: i }; }));
  var link = [];          /* left index -> right index */
  var sel = 0;
  var bar = checkBar(check);
  function owner(ri) { for (var k = 0; k < L.length; k++) if (link[k] === ri) return k; return null; }
  function nextFree(from) {
    for (var k = 1; k <= L.length; k++) { var j = (from + k) % L.length; if (link[j] == null) return j; }
    return null;
  }
  var colL = h('div', { class: 'col' }), colR = h('div', { class: 'col' });
  L.forEach(function (it) {
    it.el = h('button', { class: 'mt', type: 'button', lang: 'en' }, it.t);
    it.el.addEventListener('click', function () { if (ctx.answered) return; sel = it.i; draw(); });
    colL.appendChild(it.el);
  });
  R.forEach(function (it) {
    it.el = h('button', { class: 'mt', type: 'button', lang: 'en' }, it.t);
    it.el.addEventListener('click', function () {
      if (ctx.answered) return;
      var o = owner(it.i);
      if (sel == null) { if (o != null) { sel = o; draw(); } return; }
      if (o != null) link[o] = null;
      link[sel] = it.i;
      sel = nextFree(sel);
      draw();
    });
    colR.appendChild(it.el);
  });
  function draw() {
    L.forEach(function (it) { it.el.className = 'mt' + (sel === it.i ? ' sel' : '') + (link[it.i] != null ? ' p' + (it.i % 4) : ''); });
    R.forEach(function (it) { var o = owner(it.i); it.el.className = 'mt' + (o != null ? ' p' + (o % 4) : ''); });
    bar.btn.disabled = L.some(function (it) { return link[it.i] == null; });
  }
  function check() {
    if (ctx.answered || bar.btn.disabled) return;
    var wrongs = [];
    L.forEach(function (it) {
      var ok = link[it.i] === it.i;
      it.el.classList.remove('sel');
      it.el.classList.add(ok ? 'right' : 'wrong');
      if (!ok) wrongs.push(it.i);
    });
    R.forEach(function (it) { it.el.classList.add(owner(it.i) === it.i ? 'right' : 'wrong'); });
    L.concat(R).forEach(function (it) { it.el.disabled = true; });
    ctx.finish(!wrongs.length, wrongs.length ? (L.length - wrongs.length) + '/' + L.length : 'ok', { wrongs: wrongs });
  }
  draw();
  return { el: h('div', { class: 'match' }, colL, colR), bar: bar.el, key: function (e) { if (e.key === 'Enter') { check(); return true; } return false; } };
}

function sortView(q, ctx) {
  var x = q.x;
  var items = App.shuffle(x.items.map(function (it, i) { return { t: it[0], b: it[1], i: i, at: -1 }; }));
  var sel = items[0] || null;
  var bar = checkBar(check);
  var pool = h('div', { class: 'sort-items' });
  var bks = x.buckets.map(function (name, bi) {
    var inner = h('div', { class: 'bk-in' });
    var ar = BUCKET_AR[name];
    var el = h('div', { class: 'bucket', role: 'button', tabindex: '0', 'aria-label': (ar ? ar + ' · ' : '') + name },
      h('div', { class: 'pr-bk-h' }, ar ? h('span', { class: 'pr-bk-ar', richText: ar }) : null, h('bdi', { class: 't-en', dir: 'ltr' }, name)),
      inner);
    el.addEventListener('click', function () { place(bi); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); place(bi); } });
    return { el: el, inner: inner };
  });
  items.forEach(function (it) {
    it.el = h('button', { class: 'si', type: 'button', dir: 'ltr', lang: 'en' }, '/' + it.t + '/');
    it.el.addEventListener('click', function (e) {
      e.stopPropagation();
      if (ctx.answered) return;
      if (it.at > -1) it.at = -1;
      sel = it;
      draw();
    });
  });
  function place(bi) {
    if (ctx.answered || !sel) return;
    sel.at = bi;
    sel = items.filter(function (it) { return it.at < 0; })[0] || null;
    draw();
  }
  function draw() {
    items.forEach(function (it) {
      (it.at < 0 ? pool : bks[it.at].inner).appendChild(it.el);
      it.el.classList.toggle('sel', sel === it);
    });
    bar.btn.disabled = items.some(function (it) { return it.at < 0; });
  }
  function check() {
    if (ctx.answered || bar.btn.disabled) return;
    var wrongs = [];
    items.forEach(function (it) {
      var ok = it.at === it.b;
      it.el.classList.remove('sel');
      it.el.classList.add(ok ? 'right' : 'wrong');
      it.el.disabled = true;
      if (!ok) wrongs.push(it);
    });
    ctx.finish(!wrongs.length, wrongs.length ? (items.length - wrongs.length) + '/' + items.length : 'ok', { wrongs: wrongs });
  }
  draw();
  return {
    el: h('div', null, pool, h('div', { class: 'buckets' }, bks.map(function (b) { return b.el; }))),
    bar: bar.el,
    key: function (e) {
      var n = '123'.indexOf(e.key);
      if (n > -1 && n < bks.length) { place(n); return true; }
      if (e.key === 'Enter') { check(); return true; }
      return false;
    }
  };
}
var VIEWS = { kb: kbView, choice: choiceView, tf: tfView, match: matchView, sort: sortView };

/* =====================================================================
   8. Feedback (shown at once after every answer, also in the mock exam)
   ===================================================================== */
function featGrid(v, other) {
  var keys = ['h', 'f', 'r', 't'], maps = [D.heightAr || {}, D.posAr || {}, D.roundAr || {}, D.tenseAr || {}];
  return h('div', { class: 'feat pr-feat' }, keys.map(function (k, i) {
    return h('div', { class: other && other[k] !== v[k] ? 'hl' : null }, h('b', null, maps[i][v[k]] || ''), h('span', null, v[k]));
  }));
}
/* missing or extra length mark */
function lenNote(given, ans) {
  var g = App.normIPA(given), a = App.normIPA(ans);
  if (g === a || g.replace(/ː/g, '') !== a.replace(/ː/g, '')) return null;
  if (a.split('ː').length > g.split('ː').length) return 'الحرف هنا طويل (tense)، فيحتاج علامة الطول ' + App.ipa('ː') + '.';
  return 'الحرف هنا قصير (lax)، فلا يحتاج علامة الطول ' + App.ipa('ː') + '.';
}
function exDesc(fb, q, ok, given) {
  var v = q.v, gv = ok ? null : VOW[App.normIPA(given)] || null;
  fb.appendChild(h('div', { class: 'pr-ansrow' }, ipaBig(v.s), chipFor(exampleWord(v.s)), vowelSpeak(v.s)));
  fb.appendChild(featGrid(v, gv && gv !== v ? gv : null));
  if (!ok) {
    var ln = lenNote(given, v.s);
    if (ln) fb.appendChild(why(ln));
    else if (gv && gv !== v) { fb.appendChild(why('كتبتِ ' + App.ipa(gv.s) + '، ووصفه:')); fb.appendChild(h('p', { class: 'exam-line', dir: 'ltr', lang: 'en' }, App.descLine(gv))); fb.appendChild(why('والفرق في الخانات الملوّنة.')); }
  }
  if (v.name) fb.appendChild(why('الرمز ' + App.ipa(v.s) + ' اسمه ' + App.en(v.name) + ' في المحاضرة.', 'pr-note'));
  fb.appendChild(srcP(App.pgEl('L3', v.page)));
}
function exSym(fb, q, ok, given, extra) {
  var v = q.v, pick = !ok && extra && extra.pick ? extra.pick : null;
  fb.appendChild(h('div', { class: 'pr-ansrow' }, ipaBig(v.s), chipFor(exampleWord(v.s)), vowelSpeak(v.s)));
  fb.appendChild(h('p', { class: 'exam-line', dir: 'ltr', lang: 'en' }, App.descLine(v)));
  fb.appendChild(featGrid(v, pick));
  if (pick) fb.appendChild(why('اخترتِ وصف الحرف ' + App.ipa(pick.s) + '. الفرق في الخانات الملوّنة.'));
  fb.appendChild(srcP(App.pgEl('L3', v.page)));
}
function exWord(fb, q, ok, given) {
  var e = q.e, v = q.v, gv = ok ? null : VOW[App.normIPA(given)] || null;
  fb.appendChild(h('div', { class: 'pr-ansrow' }, ipaBig(v.s), App.wordChip(e.w), vowelSpeak(v.s)));
  fb.appendChild(why(lettersSay(e, v.s) + '، ووصفه:')); fb.appendChild(h('p', { class: 'exam-line', dir: 'ltr', lang: 'en' }, App.descLine(v)));
  if (!ok) {
    var ln = lenNote(given, v.s);
    var ex = gv && gv !== v ? exampleWord(gv.s) : null;
    if (ln) fb.appendChild(why(ln));
    else if (gv && gv !== v) fb.appendChild(why('كتبتِ ' + App.ipa(gv.s) + (ex ? '، وهو الحرف في ' + App.en(ex) : '') + '.'));
  }
  if (e.note) fb.appendChild(why(e.note, 'pr-note'));
  fb.appendChild(srcP(App.pgEl('L3', v.page)));
}
function diphLine(q) {
  var e = q.e;
  if (q.tri) return lettersSay(e, q.tri.s) + ': الحرف المزدوج ' + App.ipa(q.tri.base) + ' وبعده ' + App.ipa('ə') + '.';
  var g = (D.groups || {})[q.d.g] || {};
  var kind = q.d.g === 'centring' ? 'متجه للوسط (centring)' : 'صاعد (closing)';
  return lettersSay(e, q.d.s) + '، وهو حرف مزدوج ' + kind + '، آخره ' + App.ipa(g.end || q.d.s.slice(-1)) + '.';
}
function diphPage(q) { return q.tri ? App.pgEl('L4', 20) : App.pgEl('L4', q.d.page); }
function exTrans(fb, q, ok, given) {
  var e = q.e, ans = App.normIPA(q.answer), g = App.normIPA(given || '');
  var target = q.tri ? q.tri.s : q.d.s;
  fb.appendChild(h('div', { class: 'pr-ansrow' }, ipaBig(ans), App.speakButton({ word: e.w, label: 'اسمعي الكلمة' })));
  fb.appendChild(why(diphLine(q)));
  if (!ok) {
    var notes = [];
    if (/ː/.test(g) && !/ː/.test(ans)) notes.push('الحروف المزدوجة لا تُكتب معها علامة الطول ' + App.ipa('ː') + '.');
    if (/r/.test(g) && !/r/.test(ans) && /r/.test(e.w)) notes.push('الحرف المكتوب ' + App.en('r') + ' هنا لا يُنطق في لهجة ' + App.en('RP') + '.');
    if (g.indexOf(target) > -1) notes.push('الحرف المزدوج صحيح، راجعي باقي الأصوات في الكلمة.');
    else {
      var other = Object.keys(DIPH).filter(function (s) { return s !== target && g.indexOf(s) > -1; })[0];
      if (other) notes.push('كتبتِ ' + App.ipa(other) + ' بدل ' + App.ipa(target) + '.');
    }
    notes.slice(0, 2).forEach(function (n) { fb.appendChild(why(n)); });
  }
  if (e.note) fb.appendChild(why(e.note, 'pr-note'));
  fb.appendChild(srcP(diphPage(q)));
}
function exDword(fb, q, ok, given, extra) {
  var e = q.e, pick = !ok && extra && extra.pick ? extra.pick : null;
  fb.appendChild(h('div', { class: 'pr-ansrow' }, ipaBig(q.d.s), App.wordChip(e.w), vowelSpeak(q.d.s)));
  fb.appendChild(why(diphLine(q)));
  if (pick) {
    var ex = exampleWord(pick.s);
    fb.appendChild(why('اخترتِ ' + App.ipa(pick.s) + (ex && ex !== e.w ? '، وهو الحرف في ' + App.en(ex) : '') + '.'));
  }
  if (e.note) fb.appendChild(why(e.note, 'pr-note'));
  fb.appendChild(srcP(diphPage(q)));
}
function exAuthored(fb, q, ok, given, extra) {
  var x = q.x;
  if (q.type === 'tf' && !ok) fb.appendChild(h('p', { class: 'fb-ans' }, x.a ? 'العبارة صحيحة.' : 'العبارة خاطئة.'));
  if (!ok && extra && extra.wrongs && extra.wrongs.length) {
    var lis;
    if (q.type === 'match') lis = extra.wrongs.map(function (i) { return h('li', null, x.pairs[i][0] + ' → ' + x.pairs[i][1]); });
    else lis = extra.wrongs.map(function (it) { return h('li', null, '/' + it.t + '/ → ' + x.buckets[it.b]); });
    fb.appendChild(h('ul', { class: 'pr-fix', dir: 'ltr', lang: 'en' }, lis));
  }
  if (x.why) fb.appendChild(why(x.why));
  if (x.src) fb.appendChild(srcP(App.srcEl(x.src)));
}
var EXPLAIN = { desc: exDesc, sym: exSym, word: exWord, trans: exTrans, dword: exDword, mcq: exAuthored, tf: exAuthored, match: exAuthored, sort: exAuthored };
function fbNode(q, ok, given, extra) {
  var fb = h('div', { class: 'fb ' + (ok ? 'right' : 'wrong'), role: 'status' },
    h('p', { class: 'fb-head' }, App.icon(ok ? 'checkFill' : 'info'), h('span', null, ok ? 'صح، أحسنتِ' : 'الجواب الصحيح')));
  try { (EXPLAIN[q.type] || exAuthored)(fb, q, ok, given, extra); }
  catch (e) { console.error('[practice] explanation failed', e); }
  return fb;
}

/* =====================================================================
   9. Session engine: one question per screen
   ===================================================================== */
var active = null;   /* {page, onKey} of the screen that listens to the hardware keyboard */

function record(s, q, ok) {
  var topics = q.topics.slice();
  if (s.mode === 'mock') topics.unshift('mock');
  return App.recordAnswer(q.id, ok, { topics: topics, type: q.type, lec: q.lec });
}
function kindLabel(s, q) {
  if (s.mode === 'mock') {
    var pi = MOCK_PARTS.map(function (p) { return p.type; }).indexOf(q.type);
    if (pi > -1) return 'الجزء ' + (pi + 1) + ' · ' + MOCK_PARTS[pi].ar;
  }
  return KIND_AR[q.type] || '';
}
function progressOf(s) {
  if (s.mode === 'task') return { f: Math.min(1, s.count / s.cfg.goal), t: Math.min(s.count, s.cfg.goal) + ' من ' + s.cfg.goal };
  var n = s.list.length, done = s.i + (s.cur && s.cur.answered ? 1 : 0);
  return { f: n ? done / n : 0, t: Math.min(s.i + 1, n) + ' من ' + n };
}
function isLast(s) {
  if (s.mode === 'task') return s.count >= s.cfg.goal;
  return s.i >= s.list.length - 1;
}
function scrollIntoBar(page, el, bar) {
  try {
    var sc = page.el, r = el.getBoundingClientRect(), pr = sc.getBoundingClientRect();
    var limit = pr.bottom - (bar ? bar.offsetHeight : 0) - 12;
    var over = r.bottom - limit;
    var room = r.top - pr.top - 60;
    var dy = Math.min(over, room);
    if (dy <= 0) return;
    var start = sc.scrollTop, target = start + dy;
    if (reduced() || !('scrollBehavior' in document.documentElement.style)) { sc.scrollTop = target; return; }
    sc.scrollTo({ top: target, behavior: 'smooth' });
    /* some engines drop a smooth scroll (page in the background, busy frame): finish it */
    setTimeout(function () { if (Math.abs(sc.scrollTop - start) < dy / 2) sc.scrollTop = target; }, 700);
  } catch (e) { /* old engines */ }
}

function newRun(page, cfg) {
  var s = { page: page, cfg: cfg, mode: cfg.mode, list: cfg.list, i: cfg.start || 0, res: cfg.res || [], count: cfg.count || 0, cur: null, onKey: null };
  active = s;
  if (!s.list.length) { cfg.end(s); return s; }
  showQ(s);
  return s;
}

function showQ(s) {
  var q = s.list[s.i];
  var page = s.page, body = page.body;
  body.textContent = '';
  try { page.el.scrollTop = 0; } catch (e) { /* ignore */ }
  var ctx = { q: q, answered: false };
  s.cur = ctx;
  var fill = h('i'), cnt = h('span', { class: 'q-count num' });
  function paintTop() { var p = progressOf(s); fill.style.transform = 'scaleX(' + p.f + ')'; cnt.textContent = p.t; }
  var wrap = h('div', { class: 'pr-qs ' + App.acc(q.lec) },
    h('div', { class: 'q-top' }, h('div', { class: 'q-prog', 'aria-hidden': 'true' }, fill), cnt));
  paintTop();
  var chip = App.stateChip(App.qStatus(q.id));
  chip.classList.add('pr-end');
  var meta = h('div', { class: 'q-meta' }, App.tag(q.lec), h('span', { class: 'q-kind', richText: kindLabel(s, q) }),
    q.a2 && s.mode !== 'mock' ? h('span', { class: 'pr-a2' }, 'من الواجب') : null, chip);
  var card = h('section', { class: 'card q-card', 'aria-label': 'السؤال' }, meta, promptNode(q));
  var view = (VIEWS[q.kind] || choiceView)(q, ctx);
  card.appendChild(view.el);
  var tools = hintTools(q, card);
  var after = h('div');
  wrap.appendChild(card);
  wrap.appendChild(after);
  wrap.appendChild(h('div', { class: 'pr-grow' }));
  if (view.bar) wrap.appendChild(view.bar);
  body.appendChild(wrap);
  var nextBtn = null;
  s.onKey = function (e) {
    if (ctx.answered) {
      if (nextBtn && (e.key === 'Enter' || e.key === ' ')) { nextBtn.click(); return true; }
      return false;
    }
    return view.key ? view.key(e) : false;
  };
  ctx.finish = function (ok, given, extra) {
    if (ctx.answered) return;
    ctx.answered = true;
    s.res.push({ q: q, ok: !!ok, given: given, extra: extra || null });
    if (s.mode === 'task') s.count++;
    if (s.cfg.onAnswer) { try { s.cfg.onAnswer(s); } catch (e) { console.error(e); } }
    var st = record(s, q, ok);
    var chip2 = App.stateChip(st);
    chip2.classList.add('pr-end');
    chip.replaceWith(chip2);
    chip = chip2;
    paintTop();
    if (tools) tools.remove();
    var hb = card.querySelector('.hint'); if (hb) hb.remove();
    if (view.bar) view.bar.remove();
    after.appendChild(fbNode(q, ok, given, extra));
    nextBtn = h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { next(s); } }, isLast(s) ? 'النتيجة' : 'التالي');
    var nb = h('div', { class: 'pr-bar' }, nextBtn);
    wrap.appendChild(nb);
    var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
    raf(function () { scrollIntoBar(page, after, nb); });
  };
}

function next(s) {
  if (s.mode === 'task' && s.count >= s.cfg.goal) { s.cfg.end(s); return; }
  s.i++;
  if (s.i >= s.list.length) {
    if (s.mode === 'task') s.list = s.list.concat(makeList(s.cfg.pool, ROUND, s.list[s.list.length - 1]));
    else { s.cfg.end(s); return; }
  }
  showQ(s);
}

/* ----- end screens ----- */
function confetti(card) {
  if (reduced()) return;
  var box = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  var cols = ['var(--l1)', 'var(--l2)', 'var(--l3)', 'var(--l4)', 'var(--ok)'];
  for (var i = 0; i < 22; i++) {
    box.appendChild(h('i', { style: 'left:' + Math.round(Math.random() * 96) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 0.5).toFixed(2) + 's' }));
  }
  card.appendChild(box);
}
function scoreMsg(r, n) {
  if (!n) return '';
  var f = r / n;
  return f >= 0.8 ? 'أحسنتِ!' : (f >= 0.5 ? 'تقدّم جميل، كمّلي.' : 'راجعي الشرح، ثم جرّبي مرة ثانية.');
}
function resultCard(right, total, msg, parts) {
  var card = h('section', { class: 'card result pr-result' },
    h('p', { class: 'r-big num', dir: 'ltr' }, String(right), h('small', null, '/' + total)),
    msg ? h('p', { richText: msg }) : null,
    parts ? h('div', { class: 'r-parts' }, parts.map(function (p) { return h('div', null, h('b', { class: 'num', dir: 'ltr' }, String(p[1])), h('span', null, p[0])); })) : null);
  if (total && right / total >= 0.8) confetti(card);
  return card;
}
function endScreen(page, nodes, actions) {
  var body = page.body;
  body.textContent = '';
  try { page.el.scrollTop = 0; } catch (e) { /* ignore */ }
  var wrap = h('div', { class: 'pr-endwrap' }, nodes);
  var btns = (actions || []).filter(Boolean).map(function (a) {
    return h('button', { class: 'btn ' + (a.kind === 'soft' ? 'btn-soft' : (a.kind === 'tint' ? 'btn-tint' : 'btn-primary')), type: 'button', onclick: a.fn }, a.label);
  });
  if (btns.length) wrap.appendChild(h('div', { class: 'pr-actions' }, btns));
  body.appendChild(wrap);
  active = { page: page, onKey: function (e) { if (e.key === 'Enter' && btns[0]) { btns[0].click(); return true; } return false; } };
  return wrap;
}
function tally(res) {
  var right = 0, ids = {}, mastered = 0;
  res.forEach(function (r) { if (r.ok) right++; ids[r.q.id] = 1; });
  Object.keys(ids).forEach(function (id) { if (App.qStatus(id) === 'mastered') mastered++; });
  return { right: right, n: res.length, wrong: res.length - right, mastered: mastered };
}
function wrongQs(res) {
  var seen = {}, out = [];
  res.forEach(function (r) { if (!r.ok && !seen[r.q.id]) { seen[r.q.id] = 1; out.push(r.q); } });
  return out;
}
function statParts(t) { return [['صح', t.right], ['غلط', t.wrong], ['متقَن', t.mastered]]; }

/* ----- runs ----- */
function runPractice(page, pool) {
  newRun(page, { mode: 'practice', pool: pool, list: makeList(pool, Math.min(ROUND, pool.length)), end: function (s) { endPractice(s, pool); } });
}
function endPractice(s, pool) {
  var t = tally(s.res), wq = wrongQs(s.res);
  endScreen(s.page, [resultCard(t.right, t.n, scoreMsg(t.right, t.n), statParts(t))], [
    { label: 'كمّلي', fn: function () { runPractice(s.page, pool); } },
    wq.length ? { label: 'أعيدي الغلط', kind: 'soft', fn: function () { runRedo(s.page, wq, function () { runPractice(s.page, pool); }, 'كمّلي'); } } : null
  ]);
}
function runTask(page, pool, goal, count, task) {
  newRun(page, { mode: 'task', pool: pool, goal: goal, count: count, task: task, list: makeList(pool, Math.max(1, goal - count)), end: function (s) { endTask(s, pool); } });
}
function endTask(s, pool) {
  var t = tally(s.res);
  var task = s.cfg.task, prog = task ? App.plan.progress(task) : null;
  var actions = [];
  if (task && prog && prog.cards < 1) actions.push({ label: 'كمّلي للبطاقات', fn: function () { s.page.close(); setTimeout(function () { var t = s.cfg.task; if (t) App.plan.open(t, 'cards'); }, 50); } });
  actions.push({ label: 'رجوع', kind: 'soft', fn: function () { s.page.close(); } });
  actions.push({ label: 'كمّلي التدريب', kind: 'soft', fn: function () { runPractice(s.page, pool); } });
  endScreen(s.page, [resultCard(t.right, t.n, 'خلصتِ تدريب اليوم.', statParts(t))], actions);
}
/* redo a list of questions; afterwards offer `then` (label thenLabel) */
function runRedo(page, qs, then, thenLabel) {
  newRun(page, { mode: 'redo', list: qs.slice(), end: function (s) {
    var t = tally(s.res);
    endScreen(s.page, [resultCard(t.right, t.n, 'صحّحتِ ' + t.right + ' من ' + t.n + '.', null)], [
      then ? { label: thenLabel || 'رجوع', fn: then } : { label: 'رجوع', fn: function () { s.page.close(); } }
    ]);
  } });
}

/* ----- page helper ----- */
function sessionPage(title, acc, build) {
  return App.openPage(title, function (body, page) { build(page); }, {
    acc: acc, className: 'pr-page',
    onClose: function (page) { if (active && active.page === page) active = null; }
  });
}
function onDocKey(e) {
  var s = active;
  if (!s || !s.onKey || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
  if (App.topPage() !== s.page) return;
  if (document.querySelector('.sheet.on')) return;
  var t = e.target;
  if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.isContentEditable)) return;
  if (e.key === ' ' && t && t.tagName === 'BUTTON') return;   /* let Space press the focused button */
  if (s.onKey(e)) e.preventDefault();
}
App.onReady(function () { document.addEventListener('keydown', onDocKey); });

/* =====================================================================
   10. Practice tab
   ===================================================================== */
function readFilters() {
  var p = prefs();
  var lec = arr(p.lec).filter(function (l) { return LECS.indexOf(l) > -1; });
  var types = arr(p.types).filter(function (k) { return FILTERS.some(function (f) { return f.k === k; }); });
  return { lec: lec, types: types };
}
function toggle(listKey, val, all) {
  var p = prefs(), cur = arr(p[listKey]).slice();
  if (val == null) cur = [];
  else {
    var i = cur.indexOf(val);
    if (i > -1) cur.splice(i, 1); else cur.push(val);
    if (cur.length >= all) cur = [];
  }
  p[listKey] = cur;
  App.save();
}
function chipBtn(label, on, onClick, cls) {
  return h('button', { class: 'chip-t' + (cls ? ' ' + cls : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: onClick }, label);
}
function startPractice(f) {
  var pool = poolFor(f.lec, f.types);
  if (!pool.length) return;
  sessionPage('تدريب', f.lec.length === 1 ? f.lec[0] : null, function (page) { runPractice(page, pool); });
}
function statsCard(pool, f) {
  var c = App.countStatus(pool.map(function (q) { return q.id; }));
  var n = pool.length;
  var bar = h('div', { class: 'stbar', 'aria-hidden': 'true' });
  [['mastered', 's-m'], ['right', 's-r'], ['wrong', 's-w']].forEach(function (x) {
    if (c[x[0]]) bar.appendChild(h('i', { class: x[1], style: 'width:' + (c[x[0]] / n * 100).toFixed(2) + '%' }));
  });
  var leg = h('div', { class: 'stleg' }, ['new', 'right', 'wrong', 'mastered'].map(function (st) {
    return h('span', { class: 'pr-leg' }, App.stateChip(st), h('b', { class: 'num' }, String(c[st])));
  }));
  var start = h('button', { class: 'btn btn-primary', type: 'button', disabled: !n, onclick: function () { startPractice(f); } }, 'ابدئي');
  return h('section', { class: 'card pr-stats', 'aria-label': 'الأسئلة' },
    h('p', { class: 'pr-sthead' }, h('b', { class: 'num' }, String(n)), h('span', null, n11(n))),
    n ? bar : null, n ? leg : h('p', { class: 'pr-small' }, 'لا توجد أسئلة بهذا الاختيار.'),
    start,
    n ? h('p', { class: 'pr-small' }, 'كل جولة ' + Math.min(ROUND, n) + ' ' + n11(Math.min(ROUND, n)) + '، والشرح يظهر بعد كل إجابة.') : null);
}
function renderTab(body, ctx) {
  bank();
  ctx.setSub('اختاري المحاضرة ونوع السؤال.');
  var f = readFilters();
  var lecChips = h('div', { class: 'chips pr-chips' },
    chipBtn('الكل', !f.lec.length, function () { toggle('lec', null); ctx.refresh(); }),
    LECS.map(function (l) {
      return chipBtn([h('span', null, App.lecShort(l)), ' ', h('bdi', { dir: 'ltr' }, l)], f.lec.indexOf(l) > -1, function () { toggle('lec', l, LECS.length); ctx.refresh(); }, 'lec ' + l);
    }));
  var typeChips = h('div', { class: 'chips pr-chips' },
    chipBtn('الكل', !f.types.length, function () { toggle('types', null); ctx.refresh(); }),
    FILTERS.map(function (x) {
      return chipBtn(x.ar, f.types.indexOf(x.k) > -1, function () { toggle('types', x.k, FILTERS.length); ctx.refresh(); });
    }));
  body.appendChild(h('section', { class: 'card filter' }, h('h3', null, 'المحاضرة'), lecChips, h('h3', null, 'نوع السؤال'), typeChips));
  body.appendChild(statsCard(poolFor(f.lec, f.types), f));
  var P = prefs(), run = validMockRun(), last = P.mockLast;
  var mockSub = run ? 'كمّلي من السؤال ' + (run.i + 1) : (last && last.score != null ? 'آخر نتيجة: ' + last.score + ' من 20' : '20 سؤالًا بنمط الواجب');
  var wrong = App.wrongIds().filter(function (id) { return !!getQ(id); }).length;
  body.appendChild(App.secHead('أكثر'));
  body.appendChild(h('div', { class: 'list' },
    App.row({ title: 'اختبار تجريبي', sub: mockSub, icon: 'mock', iconBg: 'var(--l2-btn)', onClick: function () { App.go('mock'); } }),
    App.row({ title: 'مراجعة الأخطاء', sub: wrong ? null : 'ما عندكِ أخطاء حاليًا', meta: wrong ? String(wrong) : null, icon: 'redo', iconBg: 'var(--l3-btn)', onClick: function () { App.go('mistakes'); } })));
}
App.registerTab('practice', renderTab);

/* =====================================================================
   11. practice-task (opened from Today)
   ===================================================================== */
App.registerPage('practice-task', function (o) {
  o = o || {};
  var task = o.task || null;
  var goal = o.goal || (App.plan && App.plan.PRAC_GOAL) || ROUND;
  var count = Math.max(0, +o.count || 0);
  var topics = arr(o.topics).length ? o.topics : (task ? task.topics : []);
  var types = arr(o.types).length ? o.types : (task && task.types ? task.types : null);
  var pool = topics.length ? poolForTopics(topics, types) : [];
  if (!pool.length && task) pool = poolFor([task.lec], []);
  if (!pool.length) pool = bank().slice();
  return sessionPage('تدريب', task ? task.lec : null, function (page) {
    if (count < goal) runTask(page, pool, goal, count, task); else runPractice(page, pool);
  });
});

/* =====================================================================
   12. Mock exam: 6 description + 8 word + 6 transcription (Assignment 2 sections)
   ===================================================================== */
function pickOne(all, a2Only) {
  var src = a2Only.length && Math.random() < 0.5 ? a2Only : all;
  return App.sample(src, 1)[0];
}
function mockIds() {
  bank();
  var desc = App.sample(D.vowels || [], 6).map(function (v) { return 'g-desc-' + v.c; });
  var withWords = (D.vowels || []).filter(function (v) { return (WORDS_BY_V[v.s] || []).length; });
  var words = App.sample(withWords, 8).map(function (v) {
    var all = WORDS_BY_V[v.s];
    return pickOne(all, all.filter(function (q) { return q.a2; })).id;
  });
  var trans = [];
  ['centring', 'closing-i', 'closing-u'].forEach(function (g) {
    var ds = App.sample((D.diphthongs || []).filter(function (d) { return d.g === g && (TRANS_BY_D[d.s] || []).length; }), 2);
    ds.forEach(function (d) {
      var all = TRANS_BY_D[d.s];
      trans.push(pickOne(all, all.filter(function (q) { return q.a2; })).id);
    });
  });
  return desc.concat(words, App.shuffle(trans));
}
function validMockRun() {
  var r = prefs().mockRun;
  if (!r || !Array.isArray(r.ids) || !r.ids.length || !Array.isArray(r.res)) return null;
  if (!(r.i > 0 && r.i < r.ids.length) || r.res.length !== r.i) return null;
  if (Date.now() - (+r.at || 0) > 3 * 864e5) return null;
  if (!r.ids.every(function (id) { return !!getQ(id); })) return null;
  return r;
}
function saveMockRun(s) {
  prefs().mockRun = {
    at: Date.now(), ids: s.list.map(function (q) { return q.id; }), i: s.res.length,
    res: s.res.map(function (r) { return [r.ok ? 1 : 0, String(r.given == null ? '' : r.given)]; })
  };
}
function mockIntro(page) {
  var run = validMockRun(), last = prefs().mockLast;
  var parts = h('div', { class: 'list' }, MOCK_PARTS.map(function (p, i) {
    return App.row({ title: 'الجزء ' + (i + 1) + ': ' + p.ar, meta: String(p.n) });
  }));
  var card = h('section', { class: 'card pr-intro' },
    h('h2', null, '20 سؤالًا بنمط الواجب'),
    h('p', { richText: 'الأجزاء الثلاثة نفسها في الواجب (Assignment 2)، والشرح يظهر بعد كل إجابة.' }),
    parts,
    last && last.score != null ? h('p', null, 'آخر نتيجة: ' + last.score + ' من 20') : null);
  endScreen(page, [card], run ? [
    { label: 'كمّلي من السؤال ' + (run.i + 1), fn: function () { startMock(page, run); } },
    { label: 'ابدئي من جديد', kind: 'soft', fn: function () { startMock(page, null); } }
  ] : [{ label: 'ابدئي', fn: function () { startMock(page, null); } }]);
}
function startMock(page, run) {
  var list, res = [], start = 0;
  if (run) {
    list = run.ids.map(getQ);
    res = run.res.map(function (r, i) { return { q: list[i], ok: !!r[0], given: r[1], extra: null }; });
    start = run.i;
  } else {
    list = mockIds().map(getQ).filter(Boolean);
    prefs().mockRun = null;
  }
  newRun(page, { mode: 'mock', list: list, start: start, res: res, onAnswer: saveMockRun, end: endMock });
}
function endMock(s) {
  var page = s.page;
  var per = MOCK_PARTS.map(function (p) {
    var rs = s.res.filter(function (r) { return r.q.type === p.type; });
    return { p: p, right: rs.filter(function (r) { return r.ok; }).length, n: rs.length };
  });
  var score = s.res.filter(function (r) { return r.ok; }).length;
  var P = prefs();
  P.mockRun = null;
  P.mockLast = { at: Date.now(), score: score, n: s.res.length, parts: per.map(function (x) { return x.right; }) };
  App.save();
  var res = s.res.slice();
  showMockResult(page, res, score, per);
}
function showMockResult(page, res, score, per) {
  var wrongs = res.filter(function (r) { return !r.ok; });
  var card = resultCard(score, res.length, scoreMsg(score, res.length), per.map(function (x) { return [x.p.short, x.right + '/' + x.n]; }));
  var nodes = [card];
  if (wrongs.length) {
    nodes.push(App.secHead('راجعي الغلط', String(wrongs.length)));
    nodes.push(h('div', { class: 'list' }, wrongs.map(function (r) { return reviewRow(r); })));
  } else nodes.push(h('p', { class: 'pr-small', style: 'text-align:center' }, 'كل إجاباتكِ صحيحة. أحسنتِ!'));
  var back = function () { showMockResult(page, res, score, per); };
  endScreen(page, nodes, [
    wrongs.length ? { label: 'أعيدي الغلط', fn: function () { runRedo(page, wrongs.map(function (r) { return r.q; }), back, 'رجوع للنتيجة'); } } : null,
    { label: 'اختبار جديد', kind: wrongs.length ? 'soft' : 'primary', fn: function () { startMock(page, null); } }
  ]);
}
function reviewRow(r) {
  var q = r.q, ans = answerText(q);
  var sub = r.given != null && r.given !== '' && ans ? 'كتبتِ /' + r.given + '/ · الصحيح /' + ans + '/' : (KIND_AR[q.type] || '');
  return App.row({
    title: promptEl(q), sub: sub,
    onClick: function () { openReview(r); }
  });
}
function openReview(r) {
  var q = r.q;
  App.sheet({
    title: KIND_AR[q.type] || '',
    acc: q.lec,
    body: function (box) {
      box.appendChild(h('div', { class: 'pr-sheet-fb ' + App.acc(q.lec) },
        h('p', { class: 'pr-qline', dir: 'ltr', lang: 'en' }, shortPrompt(q)),
        r.given != null && r.given !== '' && answerText(q) ? h('p', { class: 'pr-note', richText: 'كتبتِ /' + r.given + '/' }) : null,
        fbNode(q, false, r.given, r.extra)));
    },
    actions: [{ label: 'تمام', kind: 'primary' }]
  });
}
App.registerPage('mock', function () {
  return sessionPage('اختبار تجريبي', 'L2', function (page) { mockIntro(page); });
});

/* =====================================================================
   13. Mistakes review: every question whose last answer was wrong
   ===================================================================== */
function mistakeList() {
  return App.wrongIds().map(getQ).filter(Boolean).sort(function (a, b) {
    return LECS.indexOf(a.lec) - LECS.indexOf(b.lec) || TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || (a.id < b.id ? -1 : 1);
  });
}
function mistakesHome(page) {
  var qs = mistakeList();
  if (!qs.length) {
    endScreen(page, [h('section', { class: 'card pr-intro' },
      h('h2', null, 'ما عندكِ أخطاء حاليًا'),
      h('p', null, 'كل سؤال تخطئين فيه يظهر هنا لتعيديه.'))],
      [{ label: 'تدرّبي', fn: function () { App.showTab('practice'); } }]);
    return;
  }
  function startAt(i) {
    var order2 = qs.slice(i).concat(qs.slice(0, i));
    runRedo(page, order2, function () { mistakesHome(page); }, 'رجوع للقائمة');
  }
  var nodes = [h('section', { class: 'card pr-intro' },
    h('h2', null, qCount(qs.length)),
    h('p', null, qs.length === 1 ? 'إجابتكِ الأخيرة عليه خاطئة. أعيديه حتى تصير صحيحة.' : 'إجابتكِ الأخيرة عليها خاطئة. أعيديها حتى تصير صحيحة.'))];
  LECS.forEach(function (l) {
    var part = qs.filter(function (q) { return q.lec === l; });
    if (!part.length) return;
    nodes.push(h('h2', { class: 'sec-h' }, h('span', { style: 'display:inline-flex;align-items:center;gap:6px' }, App.tag(l), App.lecName(l)), h('b', { class: 'num' }, String(part.length))));
    nodes.push(h('div', { class: 'list ' + App.acc(l) }, part.map(function (q) {
      return App.row({ title: promptEl(q), sub: KIND_AR[q.type] || '', onClick: function () { startAt(qs.indexOf(q)); } });
    })));
  });
  var wrap = endScreen(page, nodes, []);
  wrap.insertBefore(h('div', { class: 'pr-actions' },
    h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { startAt(0); } }, 'ابدئي المراجعة')), wrap.children[1] || null);
  active = { page: page, onKey: function (e) { if (e.key === 'Enter') { startAt(0); return true; } return false; } };
}
App.registerPage('mistakes', function () {
  return sessionPage('مراجعة الأخطاء', null, function (page) { mistakesHome(page); });
});

/* small read-only hooks for testing and for other modules */
App.practice = { question: getQ, all: function () { return bank().slice(); } };
})();
