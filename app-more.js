/* app-more.js — Cards tab and the pages cards-task / summary / assignment / settings.
   Contract: content/app-api.md (API = window.App, data = App.D). Copy: content/copy-guide.md.
   Card reviews go only through App.recordCard (Leitner boxes 0–3). Module prefs live in
   App.state.prefs.cards (deck picker) and App.state.prefs.more (last export). */
(function () {
'use strict';
var App = window.App;
if (!App) return;

var D = App.D || {};
var h = App.h;
var LECS = ['L1', 'L2', 'L3', 'L4'];
var HOUR = 36e5;

/* =====================================================================
   0. Styles (only what index.html does not have; tokens only, light + dark)
   ===================================================================== */
var CSS = [
  /* touch targets: 36px chips keep their look, the hit area grows to 44px */
  '.mo-chips{row-gap:8px}',
  '.mo-chips .chip-t{position:relative}',
  '.mo-chips .chip-t::after{content:"";position:absolute;left:0;right:0;top:-4px;bottom:-4px}',
  '.mo-pad{padding:12px}',
  /* deck card on the Cards tab */
  '.mo-deck{margin-top:14px;padding:16px}',
  '.mo-due{display:flex;align-items:baseline;gap:8px}',
  '.mo-due b{font-size:44px;font-weight:700;line-height:1;letter-spacing:-.02em}',
  '.mo-due span{font-size:17px;font-weight:600}',
  '.mo-deck-sub{margin-top:6px;font-size:14px;color:var(--label2)}',
  '.mo-deck .note{margin-top:12px}',
  '.mo-deck .btn{margin-top:16px}',
  /* flip card */
  '.mo-in{animation:mo-in .34s cubic-bezier(.16,1,.3,1)}',
  '@keyframes mo-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}',
  '.mo-fc:not(.flip) .fc-back,.mo-fc.flip .fc-front{pointer-events:none}',
  '.mo-fc .fc-meta{z-index:1}',
  '.mo-mt{display:inline-flex;align-items:center;gap:6px}',
  '.mo-kind{font-size:12px;color:var(--label2)}',
  '.mo-q{margin-top:14px;font-size:15px;color:var(--label3)}',
  '.fc-main.mo-sm{font-size:24px}',
  '.fc-main.ipa.mo-sm{font-size:40px}',
  '.mo-desc{direction:ltr;unicode-bidi:isolate;font-size:22px;font-weight:600;line-height:1.35}',
  '.mo-desc small{display:block;margin-top:8px;font-size:15px;font-weight:500;color:var(--label2)}',
  '.mo-tr{direction:ltr;unicode-bidi:isolate;font-size:34px;font-weight:500;white-space:nowrap}',
  '.mo-fc mark{background:none;color:var(--acc-ink);font-weight:700}',
  '.mo-fc .speak.off{display:none}',
  '.mo-sp{margin-top:4px;direction:ltr;font-size:17px;color:var(--label2)}',
  '.mo-fc .exam-line{margin-top:12px;max-width:100%;text-align:center}',
  '.mo-fc .exam-line .sym{margin-right:8px}',
  '.mo-ar2{margin-top:8px;font-size:14px;line-height:1.5;color:var(--label2)}',
  '.mo-wl{justify-content:center;margin-top:12px}',
  '.mo-fc .speak{margin-top:10px}',
  '.mo-fc .fc-pair{margin-top:4px}',
  '.mo-fc .fc-pair div{display:flex;flex-direction:column;align-items:center;min-width:0}',
  '.mo-fc .fc-pair .speak{margin-top:6px}',
  '.mo-fc .fc-pair .mo-pw{font-size:24px}',
  '.mo-fc .note{margin-top:12px;width:100%;text-align:start;font-size:14px;line-height:1.5}',
  '.mo-lines{margin-top:10px;width:100%;text-align:left;font-size:14px}',
  '.mo-lines div + div{margin-top:3px}',
  '.mo-diff{margin-top:12px;direction:ltr;font-size:16px;font-weight:600}',
  '.mo-res{position:relative;overflow:hidden}',
  '.result .mo-res-h{margin:0 0 14px;font-size:17px;font-weight:700;color:var(--ok)}',
  /* exam-night summary */
  '.mo-exl{display:block;margin-top:2px;text-align:right;font-weight:600}',
  '.mo-lead{margin-top:8px;font-size:16px;line-height:1.55;color:var(--label2)}',
  '.mo-sec .blk-h:first-child{margin-top:30px}',
  '.mo-gh{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin:18px 4px 8px}',
  '.mo-gh h3{font-size:16px;font-weight:600}',
  '.mo-gh .t-en{margin-right:auto;font-size:13px;color:var(--label2)}',
  '.mo-tbl tr:first-child td{border-top:0}',
  '.mo-tbl td{vertical-align:middle}',
  '.mo-tbl td:first-child{padding:4px 6px}',
  '.mo-snd{display:inline-flex;align-items:center;justify-content:center;gap:2px;min-width:48px;height:44px;padding:0 6px;border-radius:12px;color:var(--acc-ink);font-size:20px;font-weight:600;direction:ltr;transition:background .2s}',
  '.mo-snd:active{background:var(--fill)}',
  '.mo-snd.playing{background:var(--acc-wash)}',
  '.mo-line{display:block;font-size:15px;font-weight:600;line-height:1.35}',
  '.mo-ex{display:block;margin-top:2px;font-size:13px;color:var(--label2)}',
  '.mo-ex b{font-weight:700;color:var(--label)}',
  '.mo-ptbl td:first-child{white-space:nowrap;width:1%}',
  '.mo-terms .mo-t{padding:10px 14px}',
  '.mo-t + .mo-t{border-top:0.5px solid var(--sep)}',
  '.mo-t-top{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}',
  '.mo-t-ar{font-size:15px;font-weight:600;color:var(--acc-ink)}',
  '.mo-t-en{margin-right:auto;font-size:16px;font-weight:700}',
  '.mo-t-def{margin-top:3px;direction:ltr;text-align:left;font-size:14px;line-height:1.45;color:var(--label2)}',
  '.mo-dsum{display:inline-flex;align-items:center;gap:8px}',
  '.mo-dend{display:inline-flex;align-items:center;gap:10px;font-size:14px;font-weight:400;color:var(--label2)}',
  '.mo-end{margin-top:28px}',
  /* assignment */
  '.mo-instr{padding:12px 14px 6px;font-size:14px;line-height:1.45;color:var(--label2)}',
  '.mo-item + .mo-item{border-top:0.5px solid var(--sep)}',
  '.mo-asg .asg-q b{font-weight:600}',
  '.mo-frame{margin-left:10px;color:var(--label2);white-space:nowrap}',
  '.mo-asg .asg-why p{line-height:1.55}',
  '.mo-why-wl{justify-content:flex-end;margin-top:8px}',
  '.mo-reveal{margin-top:10px}',
  '.mo-ref{padding:2px 4px 4px;direction:ltr;text-align:left;font-size:14px;line-height:1.6}',
  '.mo-ref p + p{margin-top:6px}',
  '.mo-ref .in{padding-left:14px;color:var(--label2)}',
  /* settings */
  '.mo-seg button{min-height:44px;font-size:14px}',
  '.mo-audio{padding:14px 16px}',
  '.mo-a-top b{display:block;font-size:17px;font-weight:600}',
  '.mo-a-st{display:block;margin-top:2px;font-size:13px;color:var(--label2)}',
  '.mo-audio .q-prog{margin-top:12px}',
  '.mo-msg{margin-top:10px;font-size:14px;line-height:1.5;color:var(--label2)}',
  '.mo-msg:empty{display:none}',
  '.mo-msg.ok{color:var(--ok)}',
  '.mo-msg.bad{color:var(--bad)}',
  '.mo-audio .btn{margin-top:12px}',
  '.mo-prot{margin-top:8px;font-size:13px;color:var(--label3)}',
  '.mo-danger .txt b{color:var(--bad)}',
  '.mo-foot{margin:8px 16px 0;font-size:13px;line-height:1.5;color:var(--label2)}',
  '.mo-banner{margin:12px 0 0}',
  '.mo-err{margin-top:8px;font-size:14px;color:var(--bad)}',
  '.mo-err:empty{display:none}',
  '.mo-paste{margin-top:8px}',
  '.mo-leg{display:inline-flex;align-items:center;gap:4px;font-size:13px;color:var(--label2)}',
  '.mo-leg b{font-weight:600;color:var(--label)}'
].join('\n');

function ensureCSS() {
  if (document.getElementById('ph-css-more')) return;
  var s = document.createElement('style');
  s.id = 'ph-css-more';
  s.textContent = CSS;
  (document.head || document.documentElement).appendChild(s);
}
App.onReady(ensureCSS);

/* =====================================================================
   1. Small helpers
   ===================================================================== */
function keys(o) { return o && typeof o === 'object' ? Object.keys(o) : []; }
function uniq(arr) { var out = []; arr.forEach(function (x) { if (x != null && out.indexOf(x) < 0) out.push(x); }); return out; }
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function ymdOf(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function ipaHTML(s) { return App.ipa(s); }
function bdiEn(t, cls) { return h('bdi', { class: cls || 't-en', dir: 'ltr' }, t); }
function fmtWhen(ms) {
  if (!ms) return '';
  var d = new Date(ms);
  var day = ymdOf(d) === ymdOf(new Date()) ? 'اليوم' : App.fmtDate(ymdOf(d), { day: 'numeric', month: 'long' });
  var t;
  try { t = new Intl.DateTimeFormat('ar-u-ca-gregory-nu-latn', { hour: 'numeric', minute: '2-digit' }).format(d); }
  catch (e) { t = d.getHours() + ':' + pad2(d.getMinutes()); }
  return day + '، ' + t;
}
function fmtBytes(b) {
  if (!b) return '0 MB';
  if (b < 1048576 * 0.1) return Math.max(1, Math.round(b / 1024)) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}
function prefs(ns) {
  var p = App.state.prefs;
  if (!p[ns] || typeof p[ns] !== 'object') p[ns] = {};
  return p[ns];
}
function asgWords() {
  var a = D.assignment || {};
  return [].concat(a.part2 || ASG.part2.map(function (x) { return x[0]; }), a.part3 || ASG.part3.map(function (x) { return x[0]; }));
}
function asgWordsFor(sym) {
  return asgWords().filter(function (w) { var e = App.lexWord(w); return e && e.v === sym; });
}
/* Assignment words first (shown bold), then the lecture's head words. */
function exampleWords(sym, n) {
  var v = App.vowel(sym) || {};
  var asg = asgWordsFor(sym);
  var head = (v.head || []).filter(function (w) { return asg.indexOf(w) < 0; });
  return { asg: asg.slice(0, n), all: asg.concat(head).slice(0, n) };
}
function exampleNode(sym, n) {
  var ex = exampleWords(sym, n);
  var out = h('bdi', { class: 'mo-ex', dir: 'ltr' });
  ex.all.forEach(function (w, i) {
    if (i) out.appendChild(document.createTextNode(' · '));
    out.appendChild(ex.asg.indexOf(w) > -1 ? h('b', null, w) : document.createTextNode(w));
  });
  return out;
}
/* Tap a symbol: its own clip when there is one, else an example word that has audio. */
function soundButton(sym, words, label) {
  var b = h('button', { class: 'mo-snd', type: 'button', dir: 'ltr', 'aria-label': 'اسمعي /' + sym + '/' }, label || '/' + sym + '/');
  b.addEventListener('click', function () {
    if (App.canPlayVowel(sym)) { App.playVowel(sym, b); return; }
    var w = (words || []).filter(function (x) { return App.hasAudio(x); })[0];
    if (w) { App.playWord(w, b); return; }
    App.toast('لا يوجد صوت لهذا الحرف بعد.');
  });
  return b;
}
function scrollPageTo(page, el) {
  if (!page || !page.el || !el) return;
  var top = Math.max(0, el.offsetTop - (page.bar ? page.bar.offsetHeight : 44) - 8);
  try { page.el.scrollTo({ top: top, behavior: App.reducedMotion() ? 'auto' : 'smooth' }); }
  catch (e) { page.el.scrollTop = top; }
}
function blkHead(ar, en) {
  return h('div', { class: 'blk-h' }, h('h2', { richText: ar }), en ? bdiEn(en) : null);
}
/* 'المتجهة للوسط، آخرها /ə/' · 'الصاعدة إلى ɪ' (the closing names already say the ending) */
function groupLabel(gk) {
  var g = (D.groups || {})[gk] || {};
  return gk === 'centring' && g.endAr ? (g.ar || '') + '، ' + g.endAr : (g.ar || gk);
}
/* /eɪ/ → '/e/ → /ɪ/' : where the glide starts and ends */
function glide(s) { return '/' + s.slice(0, -1) + '/ → /' + s.slice(-1) + '/'; }
function noteEl(html, iconName) {
  return h('div', { class: 'note blk' }, App.icon(iconName || 'info'), h('div', { rich: html }));
}

/* =====================================================================
   2. Card deck (authored D.cards + generated cards), Leitner scheduling
   ===================================================================== */
var KINDS = [
  { k: 'all', ar: 'الكل' },
  { k: 'term', ar: 'مصطلحات' },
  { k: 'sym', ar: 'رمز ووصف' },
  { k: 'word', ar: 'كلمة ونطقها' },
  { k: 'pair', ar: 'أزواج متشابهة' }
];
var KIND_AR = { term: 'مصطلح', sym: 'رمز ووصف', word: 'كلمة ونطقها', pair: 'زوج متشابه' };
var KIND_ORDER = ['sym', 'word', 'pair', 'term'];
var LEC_RANK = { L3: 0, L4: 1, L2: 2, L1: 3 };     /* the plan's order: L3, L4, then the L2 · L1 review */
/* Leitner: box 0 is always due; boxes 1–3 come back after about 1, 2 and 4 days. */
var INTERVAL = [0, 18 * HOUR, 42 * HOUR, 90 * HOUR];

function vowelTopics(sym) {
  var k = App.vowelKind(sym), v = App.vowel(sym);
  if (k === 'mono') return { lec: 'L3', topics: [v.len, 'l3'] };
  if (k === 'diph') return { lec: 'L4', topics: [v.g, 'l4'] };
  if (k === 'tri') return { lec: 'L4', topics: ['tri', 'l4'] };
  return { lec: 'L3', topics: ['l3'] };
}

var deckCache = null;
function allCards() {
  if (deckCache) return deckCache;
  var out = [];
  function add(c) { c.ord = out.length; out.push(c); }
  (D.cards || []).forEach(function (c) {
    add({ id: c.id, kind: 'term', lec: c.lec, topics: uniq([c.topic, String(c.lec).toLowerCase()]), c: c });
  });
  (D.vowels || []).forEach(function (v) { add({ id: 'g-sym-' + v.c, kind: 'sym', sub: 'mono', lec: 'L3', topics: [v.len, 'l3'], v: v }); });
  (D.diphthongs || []).forEach(function (v) { add({ id: 'g-sym-' + v.c, kind: 'sym', sub: 'diph', lec: 'L4', topics: [v.g, 'l4'], v: v }); });
  (D.triphthongs || []).forEach(function (v) {
    var b = App.vowel(v.base);
    add({ id: 'g-sym-tri-' + (b && b.c ? b.c : v.base), kind: 'sym', sub: 'tri', lec: 'L4', topics: ['tri', 'l4'], v: v });
  });
  /* words: the assignment first, then the lecture head words, the pairs and the corrected slide words */
  var words = asgWords().slice();
  (D.vowels || []).concat(D.diphthongs || [], D.triphthongs || []).forEach(function (v) { words = words.concat(v.head || []); });
  (D.pairs || []).forEach(function (p) { words.push(p[2], p[3]); });
  words = words.concat(keys(D.slideNotes));
  var seenW = {};
  words.forEach(function (w) {
    var key = String(w).toLowerCase();
    if (seenW[key]) return;
    seenW[key] = 1;
    var e = App.lexWord(w);
    if (!e) return;
    var t = vowelTopics(e.v);
    add({ id: 'g-word-' + key, kind: 'word', lec: e.lec || t.lec, topics: t.topics, e: e });
  });
  (D.pairs || []).forEach(function (p) {
    var a = vowelTopics(p[0]), b = vowelTopics(p[1]);
    add({
      id: 'g-pair-' + String(p[2]).toLowerCase() + '-' + String(p[3]).toLowerCase(), kind: 'pair',
      lec: a.lec === 'L4' || b.lec === 'L4' ? 'L4' : 'L3', topics: uniq(a.topics.concat(b.topics)), p: p
    });
  });
  deckCache = out;
  return out;
}

function rec(id) { var r = App.state.cards[id]; return r && r.n ? r : null; }
function isDue(r, now) { return !!r && now - (r.last || 0) >= INTERVAL[Math.min(3, r.box || 0)]; }
function cardStatus(id) {
  var r = rec(id);
  if (!r) return 'new';
  if (r.box >= 3) return 'mastered';
  return r.box > 0 ? 'right' : 'wrong';
}
function countDeck(cards) {
  var now = Date.now(), out = { due: 0, fresh: 0, total: cards.length, st: { new: 0, right: 0, wrong: 0, mastered: 0 } };
  cards.forEach(function (c) {
    var r = rec(c.id);
    if (!r) out.fresh++; else if (isDue(r, now)) out.due++;
    out.st[cardStatus(c.id)]++;
  });
  return out;
}
/* New cards: one of each kind in turn, lecture order L3 → L4 → L2 → L1 inside each kind. */
function interleave(list) {
  var groups = KIND_ORDER.map(function (k) {
    return list.filter(function (c) { return c.kind === k; })
      .sort(function (a, b) { return (LEC_RANK[a.lec] - LEC_RANK[b.lec]) || (a.ord - b.ord); });
  });
  var out = [], i = 0, more = true;
  while (more) {
    more = false;
    groups.forEach(function (g) { if (i < g.length) { out.push(g[i]); more = true; } });
    i++;
  }
  return out;
}
function buildQueue(cards, n, fill) {
  var now = Date.now(), due = [], fresh = [], ahead = [];
  cards.forEach(function (c) {
    var r = rec(c.id);
    if (!r) fresh.push(c); else if (isDue(r, now)) due.push(c); else ahead.push(c);
  });
  due.sort(function (a, b) { var ra = rec(a.id), rb = rec(b.id); return (ra.box - rb.box) || (ra.last - rb.last); });
  ahead.sort(function (a, b) {
    var ra = rec(a.id), rb = rec(b.id);
    return (ra.last + INTERVAL[ra.box]) - (rb.last + INTERVAL[rb.box]);
  });
  var q = due.concat(interleave(fresh));
  if (fill || !q.length) q = q.concat(ahead);
  return q.slice(0, n);
}

function getSel() {
  var p = prefs('cards');
  var kind = KINDS.some(function (k) { return k.k === p.kind; }) ? p.kind : 'all';
  var lecs = Array.isArray(p.lecs) ? p.lecs.filter(function (l) { return LECS.indexOf(l) > -1; }) : [];
  if (!lecs.length) lecs = LECS.slice();
  return { kind: kind, lecs: lecs };
}
function setSel(sel) { var p = prefs('cards'); p.kind = sel.kind; p.lecs = sel.lecs.slice(); App.save(); }
function deckFor(sel) {
  return allCards().filter(function (c) { return (sel.kind === 'all' || c.kind === sel.kind) && sel.lecs.indexOf(c.lec) > -1; });
}
/* From Today: the task's own topics (short, centring …), plus the term cards of its lecture.
   The mock day ('mock') reviews everything. */
function deckForTask(topics) {
  topics = topics || [];
  if (!topics.length || topics.indexOf('mock') > -1) return allCards();
  var lecT = topics.filter(function (t) { return /^l\d$/.test(t); });
  var spec = topics.filter(function (t) { return !/^l\d$/.test(t) && t !== 'mock'; });
  function any(list, set) { return list.some(function (t) { return set.indexOf(t) > -1; }); }
  return allCards().filter(function (c) {
    if (spec.length) return any(c.topics, spec) || (c.kind === 'term' && any(c.topics, lecT));
    return any(c.topics, lecT);
  });
}

/* =====================================================================
   3. Card faces
   ===================================================================== */
function ipaBig(s, sm) { return h('bdi', { class: 'fc-main ipa' + (sm ? ' mo-sm' : ''), dir: 'ltr' }, '/' + s + '/'); }
function enBig(t, sm) { return h('bdi', { class: 'fc-main' + (sm ? ' mo-sm' : ''), dir: 'ltr' }, t); }
function examLine(v) { return h('div', { class: 'exam-line', dir: 'ltr' }, App.descLine(v)); }
function arLine(v) { return h('p', { class: 'mo-ar2' }, App.descAr(v).filter(Boolean).join('، ')); }
function chipsFor(words, n) {
  return h('div', { class: 'wlist mo-wl' }, (words || []).slice(0, n || 2).map(function (w) { return App.wordChip(w); }));
}
function speakVowel(s) { return App.speakButton({ vowel: s, label: 'اسمعي الحرف' }); }
function speakWord(w) { return App.speakButton({ word: w, label: 'اسمعي الكلمة' }); }
function transNode(e, mark) {
  return h('bdi', { class: 'mo-tr', dir: 'ltr' }, '/', e.pre, mark === false ? e.v : h('mark', null, e.v), e.post, '/');
}
function vowelInfo(sym) {
  var k = App.vowelKind(sym), v = App.vowel(sym);
  if (k === 'mono') return h('div', { class: 'exam-line', dir: 'ltr' }, h('span', { class: 'sym' }, '/' + sym + '/'), App.descLine(v));
  if (k === 'diph') {
    var g = (D.groups || {})[v.g] || {};
    return h('div', { class: 'exam-line', dir: 'ltr' }, h('span', { class: 'sym' }, '/' + sym + '/'), g.en || v.g);
  }
  if (k === 'tri') return h('div', { class: 'exam-line', dir: 'ltr' }, h('span', { class: 'sym' }, '/' + sym + '/'), '/' + v.base + '/ + /ə/');
  return null;
}

var FACES = {
  term: function (c, rev) {
    var t = c.c;
    function def() { return h('p', { class: 'fc-sub ltr', dir: 'ltr' }, t.b); }
    function ar() { return h('p', { class: 'fc-ar', richText: t.ar }); }
    if (!rev) return { front: [enBig(t.f)], q: 'ما معناه؟', back: [enBig(t.f, true), def(), ar()] };
    return { front: [ar(), def()], q: 'ما المصطلح؟', back: [enBig(t.f), ar()] };
  },
  sym: function (c, rev) {
    var v = c.v;
    if (c.sub === 'mono') {
      if (!rev) return { front: [ipaBig(v.s), speakVowel(v.s)], q: 'ما وصفه؟', back: [ipaBig(v.s, true), examLine(v), arLine(v), chipsFor(exampleWords(v.s, 2).all)] };
      return { front: [h('p', { class: 'mo-desc', dir: 'ltr' }, App.descLine(v))], q: 'ما الرمز؟', back: [ipaBig(v.s), speakVowel(v.s), chipsFor(exampleWords(v.s, 2).all)] };
    }
    if (c.sub === 'diph') {
      var g = (D.groups || {})[v.g] || {};
      var groupAr = function () { return h('p', { class: 'fc-ar', rich: groupLabel(v.g) }); };
      if (!rev) return { front: [ipaBig(v.s), speakVowel(v.s)], q: 'ما مجموعته؟', back: [ipaBig(v.s, true), groupAr(), h('p', { class: 'fc-sub ltr', dir: 'ltr' }, g.en || ''), chipsFor(exampleWords(v.s, 2).all)] };
      return {
        front: [h('p', { class: 'mo-desc', dir: 'ltr' }, g.en || '', h('small', null, 'as in \'' + (v.head || []).join('\', \'') + '\''))],
        q: 'ما الرمز؟', back: [ipaBig(v.s), speakVowel(v.s), groupAr(), chipsFor(exampleWords(v.s, 2).all)]
      };
    }
    /* triphthong */
    function parts() { return h('p', { class: 'mo-desc', dir: 'ltr' }, '/' + v.base + '/ + /ə/'); }
    function partsAr() { return h('p', { class: 'mo-ar2', rich: 'الحرف المزدوج ' + ipaHTML(v.base) + '، وبعده ' + ipaHTML('ə') + '.' }); }
    if (!rev) return { front: [ipaBig(v.s)], q: 'ما الحرف المزدوج فيه؟', back: [ipaBig(v.s, true), parts(), partsAr(), chipsFor(v.head, 2)] };
    return { front: [enBig((v.head || []).slice(0, 2).join(' · '), true)], q: 'ما الحرف الثلاثي فيها؟', back: [ipaBig(v.s), parts(), chipsFor(v.head, 2)] };
  },
  word: function (c, rev) {
    var e = c.e;
    function spell() { return h('p', { class: 'mo-sp', dir: 'ltr' }, App.spellNode(e)); }
    function note() { return e.note ? h('div', { class: 'note' }, App.icon('info'), h('div', { richText: e.note })) : null; }
    if (!rev) return { front: [enBig(e.w), speakWord(e.w)], q: 'ما نطقها؟', back: [transNode(e), spell(), vowelInfo(e.v), speakWord(e.w), note()] };
    return { front: [transNode(e, false)], q: 'ما الكلمة؟', back: [enBig(e.w), speakWord(e.w), transNode(e), note()] };
  },
  pair: function (c, rev) {
    var p = c.p;
    function cell(sym, w, full) {
      var e = App.lexWord(w);
      if (!full) return h('div', null, h('b', null, '/' + sym + '/'));
      return h('div', null, h('b', null, '/' + sym + '/'), h('span', null, e ? App.spellNode(e) : w), speakWord(w));
    }
    function wordsCell(w) { return h('div', null, h('b', { class: 'mo-pw' }, w)); }
    function lines() {
      if (App.vowelKind(p[0]) !== 'mono') return null;
      return h('div', { class: 'exam-line mo-lines', dir: 'ltr' },
        [p[0], p[1]].map(function (s) { return h('div', null, h('span', { class: 'sym' }, '/' + s + '/'), App.descLine(s)); }));
    }
    var back = [h('div', { class: 'fc-pair' }, cell(p[0], p[2], true), cell(p[1], p[3], true)), h('p', { class: 'mo-diff', dir: 'ltr' }, p[4]), lines()];
    if (!rev) return { front: [h('div', { class: 'fc-pair' }, cell(p[0]), cell(p[1]))], q: 'ما الفرق بينهما؟', back: back };
    return { front: [h('div', { class: 'fc-pair' }, wordsCell(p[2]), wordsCell(p[3]))], q: 'ما الحرف الصوتي في كل كلمة؟', back: back };
  }
};

/* One flip card + its rating row. Direction alternates on each review (term ↔ meaning …). */
function cardView(c, onRate) {
  var r = rec(c.id);
  var rev = !!(r && r.n % 2 === 1);
  var f = FACES[c.kind](c, rev);
  function meta() {
    return h('div', { class: 'fc-meta' }, h('span', { class: 'mo-mt' }, App.tag(c.lec), h('span', { class: 'mo-kind' }, KIND_AR[c.kind])), App.stateChip(cardStatus(c.id)));
  }
  var front = h('div', { class: 'fc-face fc-front' }, meta(), f.front, f.q ? h('p', { class: 'mo-q' }, f.q) : null,
    h('p', { class: 'fc-hint' }, 'المسي البطاقة لتقلبيها'));
  var back = h('div', { class: 'fc-face fc-back', 'aria-hidden': 'true' }, meta(), f.back);
  var fc = h('div', { class: 'fc mo-fc', tabindex: '0', 'aria-label': 'البطاقة' }, front, back);
  var no = h('button', { class: 'btn no', type: 'button', disabled: true }, 'لسه');
  var yes = h('button', { class: 'btn yes', type: 'button', disabled: true }, 'عرفتها');
  var rate = h('div', { class: 'fc-rate hide' }, no, yes);
  var rated = false;
  function flip() {
    var on = !fc.classList.contains('flip');
    fc.classList.toggle('flip', on);
    front.setAttribute('aria-hidden', on ? 'true' : 'false');
    back.setAttribute('aria-hidden', on ? 'false' : 'true');
    if (on) { rate.classList.remove('hide'); no.disabled = false; yes.disabled = false; }
  }
  fc.addEventListener('click', flip);
  fc.addEventListener('keydown', function (e) {
    if (e.target !== fc) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
  });
  function done(known, btn) {
    if (rated) return;
    rated = true;
    var kb = false;
    try { kb = btn.matches(':focus-visible'); } catch (e) { kb = false; }
    App.audio.stop();
    onRate(c, known, kb);
  }
  no.addEventListener('click', function () { done(false, no); });
  yes.addEventListener('click', function () { done(true, yes); });
  var root = h('div', { class: 'mo-card mo-in ' + App.acc(c.lec) }, h('div', { class: 'fc-wrap' }, fc), rate);
  root.focusCard = function () { try { fc.focus({ preventScroll: true }); } catch (e) { /* ignore */ } };
  return root;
}

function confetti() {
  var box = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  var cols = ['var(--l1)', 'var(--l2)', 'var(--l3)', 'var(--l4)'];
  for (var i = 0; i < 16; i++) {
    box.appendChild(h('i', { style: 'left:' + (4 + i * 6) + '%;background:' + cols[i % 4] + ';animation-delay:' + ((i % 5) * 0.07).toFixed(2) + 's' }));
  }
  return box;
}

/* A review session inside a page: o = {cards, goal?, count?, fill?, size} */
function session(body, page, o) {
  var cards = o.cards || [];
  var goal = o.goal || 0, base = o.count || 0;
  var queue = [], seen = 0, known = 0, again = {}, toldAgain = false, fill = !!o.fill;
  var barI = h('i', { style: 'transform:scaleX(0)' });
  var cnt = h('span', { class: 'q-count num' });
  var top = h('div', { class: 'q-top' }, h('div', { class: 'q-prog', 'aria-hidden': 'true' }, barI), cnt);
  var stage = h('div', { class: 'mo-stage' });
  body.appendChild(top);
  body.appendChild(stage);
  if (!cards.length) { top.hidden = true; stage.appendChild(App.placeholder('لا توجد بطاقات هنا.')); return; }

  function paint() {
    var f, label;
    if (goal) { var n = Math.min(base + seen, goal); f = n / goal; label = n + ' من ' + goal; }
    else { var tot = seen + queue.length; f = tot ? seen / tot : 1; label = seen + ' من ' + tot; }
    barI.style.transform = 'scaleX(' + f.toFixed(4) + ')';
    cnt.textContent = label;
  }
  function next(kb) {
    stage.textContent = '';
    if (!queue.length || (goal && base < goal && base + seen >= goal)) { finish(); return; }
    var v = cardView(queue[0], rate);
    stage.appendChild(v);
    paint();
    if (kb) v.focusCard();   /* keyboard users keep their place; no focus ring after a tap */
  }
  function rate(c, ok, kb) {
    queue.shift();
    App.recordCard(c.id, ok, { topics: c.topics, lec: c.lec });
    seen++;
    if (ok) known++;
    else {
      again[c.id] = (again[c.id] || 0) + 1;
      if (again[c.id] <= 3) queue.splice(Math.min(3, queue.length), 0, c);
      if (!toldAgain) { toldAgain = true; App.toast('ترجع لكِ بعد بطاقات قليلة.'); }
    }
    next(kb);
  }
  function start(n) { queue = buildQueue(cards, n, fill); seen = 0; known = 0; again = {}; next(); }
  function finish() {
    paint();
    var wasBelow = goal && base < goal;
    var reached = wasBelow && base + seen >= goal;
    var more = h('button', { class: 'btn ' + (reached ? 'btn-soft' : 'btn-primary'), type: 'button' }, 'كمّلي');
    var back = h('button', { class: 'btn ' + (reached ? 'btn-primary' : 'btn-soft'), type: 'button' }, 'رجوع');
    more.addEventListener('click', function () {
      if (goal) { base += seen; if (base >= goal) goal = 0; }
      fill = true;
      start(App.plan.CARD_GOAL || 20);
    });
    back.addEventListener('click', function () { App.back(); });
    var res = h('div', { class: 'card result mo-res mo-in' },
      reached ? h('p', { class: 'mo-res-h' }, 'أحسنتِ! خلصتِ بطاقات اليوم.') : null,
      h('div', { class: 'r-big num' }, String(known), h('small', null, '/' + seen)),
      h('p', null, 'عرفتِ ' + known + ' من ' + seen + '.'),
      h('div', { style: 'display:grid;gap:10px;margin-top:18px' }, reached ? [back, more] : [more, back]));
    if (reached && !App.reducedMotion()) res.appendChild(confetti());
    stage.appendChild(res);
  }
  App.audio.ready();
  start(o.size || App.plan.CARD_GOAL || 20);
}

/* =====================================================================
   4. Cards tab (deck picker + due count → session page)
   ===================================================================== */
function chip(label, pressed, onClick, cls) {
  return h('button', { class: 'chip-t' + (cls ? ' ' + cls : ''), type: 'button', 'aria-pressed': pressed ? 'true' : 'false', onclick: onClick }, label);
}
function stLegend(st) {
  return h('div', { class: 'stleg' }, ['new', 'right', 'wrong', 'mastered'].map(function (k) {
    return h('span', { class: 'mo-leg' }, App.stateChip(k), h('b', { class: 'num' }, String(st[k])));
  }));
}
function stBar(st, total) {
  var bar = h('div', { class: 'stbar', 'aria-hidden': 'true' });
  [['s-m', 'mastered'], ['s-r', 'right'], ['s-w', 'wrong']].forEach(function (p) {
    if (st[p[1]] && total) bar.appendChild(h('i', { class: p[0], style: 'width:' + (100 * st[p[1]] / total).toFixed(2) + '%' }));
  });
  return bar;
}
function openDeck(sel, cards, fill) {
  var kind = KINDS.filter(function (k) { return k.k === sel.kind; })[0];
  var title = sel.kind === 'all' ? 'بطاقات' : kind.ar;
  return App.openPage(title, function (body, page) {
    ensureCSS();
    session(body, page, { cards: cards, fill: fill, size: App.plan.CARD_GOAL || 20 });
  }, { acc: sel.lecs.length === 1 ? sel.lecs[0] : null });
}

App.registerTab('cards', function (body, ctx) {
  ensureCSS();
  var sel = getSel();
  var cards = deckFor(sel);
  var st = countDeck(cards);
  ctx.setSub(st.due ? 'مستحقة الآن: ' + st.due : (st.fresh ? 'جديدة: ' + st.fresh : 'راجعتِ كل البطاقات المستحقة'));

  var kindChips = h('div', { class: 'chips mo-chips' }, KINDS.map(function (k) {
    return chip(k.ar, sel.kind === k.k, function () { sel.kind = k.k; setSel(sel); ctx.refresh(); });
  }));
  var lecChips = h('div', { class: 'chips mo-chips' }, LECS.map(function (L) {
    var on = sel.lecs.indexOf(L) > -1;
    var b = chip([h('span', null, App.lecShort(L)), ' ', h('bdi', { dir: 'ltr' }, L)], on, function () {
      if (on && sel.lecs.length === 1) { App.toast('اختاري محاضرة واحدة على الأقل.'); return; }
      sel.lecs = on ? sel.lecs.filter(function (x) { return x !== L; }) : LECS.filter(function (x) { return x === L || sel.lecs.indexOf(x) > -1; });
      setSel(sel);
      ctx.refresh();
    }, 'lec ' + L);
    b.setAttribute('aria-label', L + ' ' + App.lecName(L));
    return b;
  }));
  body.appendChild(h('div', { class: 'card filter' }, h('h3', null, 'النوع'), kindChips, h('h3', null, 'المحاضرات'), lecChips));

  var deck = h('div', { class: 'card mo-deck' });
  if (!cards.length) {
    deck.appendChild(h('p', { class: 'dim', style: 'font-size:15px;line-height:1.55' }, 'لا توجد بطاقات من هذا النوع في المحاضرات التي اخترتِها.'));
    body.appendChild(deck);
    return;
  }
  var allDone = !st.due && !st.fresh;
  var bigFresh = !st.due && st.fresh > 0;
  deck.appendChild(h('div', { class: 'mo-due' }, h('b', { class: 'num' }, String(bigFresh ? st.fresh : st.due)), h('span', null, bigFresh ? 'جديدة' : 'مستحقة الآن')));
  deck.appendChild(h('p', { class: 'mo-deck-sub num' }, (bigFresh ? 'مستحقة الآن: 0' : 'جديدة: ' + st.fresh) + ' · كلها: ' + st.total));
  deck.appendChild(stBar(st.st, st.total));
  deck.appendChild(stLegend(st.st));
  if (allDone) deck.appendChild(h('div', { class: 'note' }, App.icon('check'), h('div', null, 'راجعتِ كل بطاقات هذه المجموعة. تقدرين أن تراجعيها مرة ثانية الآن.')));
  deck.appendChild(h('button', {
    class: 'btn btn-primary', type: 'button',
    onclick: function () { openDeck(sel, deckFor(sel), allDone); }
  }, allDone ? 'راجعيها مرة ثانية' : 'ابدئي'));
  body.appendChild(deck);
});

/* From Today: {task, topics, goal: 20, count} */
App.registerPage('cards-task', function (opts) {
  opts = opts || {};
  var task = opts.task || null;
  var cards = deckForTask(opts.topics || (task && task.topics) || []);
  var goal = opts.goal || App.plan.CARD_GOAL || 20;
  var count = opts.count || 0;
  return App.openPage('بطاقات', function (body, page) {
    ensureCSS();
    session(body, page, { cards: cards, goal: goal, count: count, fill: true, size: Math.max(goal - count, 0) || goal });
  }, { acc: task ? task.lec : null });
});

/* =====================================================================
   5. Exam-night summary
   ===================================================================== */
var EXTRA_SLIDE_NOTES = [
  'في المحاضرة الثانية (L2) وصفت الشريحة 57 الحرفين /θ/ و /ð/ بأنهما labiodental، والصحيح dental.'
];

function symTable(rows) {
  return h('div', { class: 'card tbl mo-tbl' }, h('table', { class: 'sum-table', dir: 'ltr' }, h('tbody', null, rows)));
}
function monoRows(list) {
  return list.map(function (s) {
    var v = App.vowel(s);
    if (!v) return null;
    return h('tr', null,
      h('td', null, soundButton(v.s, exampleWords(v.s, 4).all)),
      h('td', null, h('span', { class: 'mo-line' }, App.descLine(v)), exampleNode(v.s, 4)));
  });
}
function buildSummary(body, page) {
  var asg = D.assignment || {};
  body.appendChild(h('div', { class: 'intro' },
    h('h1', null, 'ملخص ليلة الاختبار'),
     h('p', { class: 'mo-lead', richText: 'الاختبار يوم ' + App.fmtDate(D.examDate) + '. مرّي على كل قسم بهدوء، والمسي الرمز لتسمعي مثالًا عليه.' })));

  var secs = [
    ['mono', 'الأحادية'], ['diph', 'المزدوجة'], ['tri', 'الثلاثية'], ['terms', 'المصطلحات'], ['pairs', 'الأزواج'], ['slides', 'أخطاء الشرائح']
  ];
  var secEls = {};
  body.appendChild(h('div', { class: 'chips mo-chips' }, secs.map(function (s) {
    return h('button', { class: 'chip-t', type: 'button', onclick: function () { scrollPageTo(page, secEls[s[0]]); } }, s[1]);
  })));
  function section(key, ar, en) {
    var el = h('section', { class: 'mo-sec', 'aria-label': ar }, blkHead(ar, en));
    if (key) secEls[key] = el;
    body.appendChild(el);
    return el;
  }

  /* exam pattern (Assignment 2) */
  var s0 = section(null, 'شكل الأسئلة', 'Assignment 2');
  s0.appendChild(h('p', { class: 'blk-p blk', richText: 'قالت الدكتورة إن الاختبار يشبه الواجب (Assignment 2). فيه ثلاثة أنواع من الأسئلة:' }));
  s0.appendChild(h('div', { class: 'card blk-list blk' }, h('ul', null,
    [['من الوصف إلى الرمز.', 'mid, front, unrounded, lax → /e/'],
     ['من الكلمة إلى الحرف الصوتي.', 'bird (b … d) → /ɜː/'],
     ['نسخ الكلمة كاملة بالحروف المزدوجة.', 'tone → /təʊn/']].map(function (x) {
      return h('li', null, h('span', null, x[0]), h('bdi', { class: 'mo-exl', dir: 'ltr' }, x[1]));
    }))));

  /* 12 monophthongs */
  var s1 = section('mono', 'الحروف الأحادية', '12 monophthongs');
  s1.classList.add('acc-L3');
  s1.appendChild(noteEl('ترتيب الوصف: ارتفاع اللسان، ثم مكانه، ثم شكل الشفتين، ثم مشدود أو مرتخٍ. والكلمات الغامقة من الواجب.'));
  s1.appendChild(h('div', { class: 'mo-gh' }, h('h3', { richText: 'القصيرة: 7 حروف مرتخية' }), bdiEn('short · lax')));
  s1.appendChild(symTable(monoRows(D.shortOrder || [])));
  s1.appendChild(h('div', { class: 'mo-gh' }, h('h3', { richText: 'الطويلة: 5 حروف مشدودة، وفي رمزها /ː/' }), bdiEn('long · tense')));
  s1.appendChild(symTable(monoRows(D.longOrder || [])));

  /* 8 diphthongs by group */
  var s2 = section('diph', 'الحروف المزدوجة', '8 diphthongs');
  s2.classList.add('acc-L4');
  s2.appendChild(noteEl('آخر رمز يحدد المجموعة. والجزء الأول أطول وأقوى من الثاني.'));
  ['centring', 'closing-i', 'closing-u'].forEach(function (gk) {
    var g = (D.groups || {})[gk] || {};
    var list = (D.diphthongs || []).filter(function (d) { return d.g === gk; });
    s2.appendChild(h('div', { class: 'mo-gh' }, h('h3', { rich: groupLabel(gk) }), bdiEn(g.en || gk)));
    s2.appendChild(symTable(list.map(function (d) {
      var ex = exampleWords(d.s, 4);
      return h('tr', null, h('td', null, soundButton(d.s, ex.all)), h('td', null, h('span', { class: 'mo-line' }, glide(d.s)), exampleNode(d.s, 4)));
    })));
  });
  s2.appendChild(noteEl('في اللهجة البريطانية ' + App.en('(RP)') + ' 8 حروف مزدوجة، وفي اللهجة الأمريكية ' + App.en('(GA)') + ' 5 فقط، كلها من الصاعدة.'));

  /* triphthongs */
  var s3 = section('tri', 'الحروف الثلاثية', '5 triphthongs');
  s3.classList.add('acc-L4');
  s3.appendChild(h('p', { class: 'blk-p blk', rich: 'القاعدة: الحروف المزدوجة الصاعدة الخمسة، وبعد كل واحد منها ' + ipaHTML('ə') + '.' }));
  s3.appendChild(h('div', { class: 'blk' }, symTable((D.triphthongs || []).map(function (t) {
    return h('tr', null,
      h('td', null, soundButton(t.s, t.head)),
      h('td', null, h('span', { class: 'mo-line' }, '/' + t.base + '/ + /ə/'), h('bdi', { class: 'mo-ex', dir: 'ltr' }, (t.head || []).join(' · '))));
  }))));

  /* key terms by lecture (L3 and L4 open) */
  var s4 = section('terms', 'المصطلحات', 'Key terms');
  LECS.forEach(function (L) {
    var list = (D.cards || []).filter(function (c) { return c.lec === L; });
    if (!list.length) return;
    var inner = h('div', { class: 'more-in' }, h('div', { class: 'list mo-terms ' + App.acc(L) }, list.map(function (c) {
      return h('div', { class: 'mo-t' },
        h('div', { class: 'mo-t-top' }, h('span', { class: 'mo-t-ar', richText: c.ar }), bdiEn(c.f, 'mo-t-en')),
        h('p', { class: 'mo-t-def', dir: 'ltr' }, c.b));
    })));
    var det = h('details', { class: 'more blk ' + App.acc(L), open: L === 'L3' || L === 'L4' },
      h('summary', null, h('span', { class: 'mo-dsum' }, App.tag(L), App.lecName(L)), h('span', { class: 'mo-dend num' }, String(list.length), App.icon('down'))),
      inner);
    s4.appendChild(det);
  });

  /* confusable pairs (one row per symbol pair) */
  var s5 = section('pairs', 'أزواج متقاربة', 'Pairs that look alike');
  s5.appendChild(h('p', { class: 'blk-p blk' }, 'لا يفرّق بينها إلا صفة أو صفتان. ركّزي على الفرق في كل زوج.'));
  var groups = [], gIdx = {};
  (D.pairs || []).forEach(function (p) {
    var k = p[0] + '|' + p[1];
    if (!gIdx[k]) { gIdx[k] = { a: p[0], b: p[1], diff: p[4], words: [] }; groups.push(gIdx[k]); }
    gIdx[k].words.push(p[2] + ' · ' + p[3]);
  });
  s5.appendChild(h('div', { class: 'card tbl mo-tbl blk' }, h('table', { class: 'mo-ptbl', dir: 'ltr' }, h('tbody', null, groups.map(function (g) {
    var wa = g.words.map(function (x) { return x.split(' · ')[0]; }), wb = g.words.map(function (x) { return x.split(' · ')[1]; });
    return h('tr', null,
      h('td', null, soundButton(g.a, wa), soundButton(g.b, wb)),
      h('td', null, h('span', { class: 'mo-line' }, g.diff), h('span', { class: 'mo-ex' }, g.words.join(', '))));
  })))));

  /* slide errors */
  var s6 = section('slides', 'أخطاء في الشرائح', 'Slide errors');
  s6.appendChild(h('p', { class: 'blk-p blk' }, 'في الشرائح أخطاء كتابة واضحة، وصحّحناها في التطبيق:'));
  var notes = keys(D.slideNotes).map(function (w) { return 'كلمة ' + App.en(App.esc(w)) + ': ' + App.esc(D.slideNotes[w]); });
  EXTRA_SLIDE_NOTES.forEach(function (t) { notes.push(App.esc(t)); });
  s6.appendChild(h('div', { class: 'card blk-list blk acc-L3' }, h('ul', null, notes.map(function (x) { return h('li', { rich: x }); }))));

  /* next steps */
  body.appendChild(h('div', { class: 'list mo-end' },
    App.row({ title: ['حل ', h('bdi', { dir: 'ltr' }, 'Assignment 2')], icon: 'doc', iconBg: 'var(--l1-btn)', onClick: function () { App.go('assignment'); } }),
    App.row({ title: 'اختبار تجريبي', icon: 'mock', iconBg: 'var(--l2-btn)', onClick: function () { App.go('mock'); } })));
}
App.registerPage('summary', function (opts) {
  opts = opts || {};
  return App.openPage('ملخص ليلة الاختبار', function (body, page) { ensureCSS(); buildSummary(body, page); },
    { large: true, acc: opts.task && opts.task.lec ? opts.task.lec : 'L4' });
});

/* =====================================================================
   6. Assignment 2 (items from App.D.assignment + the lexicon; notes from content/assignment2.md)
   ===================================================================== */
var ASG = {
  part1: [
    ['mid, front, unrounded, lax', 'e'], ['mid, central, unrounded, tense', 'ɜː'], ['low, back, unrounded, tense', 'ɑː'],
    ['low, back, rounded, lax', 'ɒ'], ['mid-high, back, rounded, tense', 'ɔː'], ['high, back, rounded, lax', 'ʊ'],
    ['high, back, rounded, tense', 'uː'], ['mid-low, central, unrounded, lax', 'ʌ'], ['high, front, unrounded, tense', 'iː'],
    ['high, front, unrounded, lax', 'ɪ'], ['mid, central, unrounded, lax', 'ə'], ['low, front, unrounded, lax', 'æ']
  ],
  /* word, frame, answer, note, lecture, pages */
  part2: [
    ['ban', 'b … n', 'æ', 'الحرف المكتوب a يُنطق هنا /æ/. مثال: man', 'L3', '16-17'],
    ['hub', 'h … b', 'ʌ', 'الحرف المكتوب u يُنطق هنا /ʌ/. أمثلة: cut, bun', 'L3', '34، 41'],
    ['fill', 'f … l', 'ɪ', 'في المحاضرة: fill /fɪl/', 'L3', '11'],
    ['moss', 'm … s', 'ɒ', 'الحرف المكتوب o يُنطق هنا /ɒ/. مثال: loss /lɒs/', 'L3', '41'],
    ['led', 'l … d', 'e', 'الحرف المكتوب e يُنطق هنا /e/. أمثلة: red, leg', 'L3', '15'],
    ['seat', 's … t', 'iː', 'في المحاضرة: seat /siːt/', 'L3', '9'],
    ['dark', 'd … k', 'ɑː', 'الحرفان المكتوبان ar يُنطقان هنا /ɑː/. مثال: card /kɑːd/', 'L3', '21'],
    ['bird', 'b … d', 'ɜː', 'في المحاضرة: bird /bɜːd/', 'L3', '36'],
    ['fought', 'f … t', 'ɔː', 'الحروف المكتوبة ough تُنطق هنا /ɔː/. أمثلة: thought, bought', 'L3', '26'],
    ['part', 'p … t', 'ɑː', 'من أمثلة /ɑː/ في المحاضرة.', 'L3', '42'],
    ['put', 'p … t', 'ʊ', 'في المحاضرة: put /pʊt/', 'L3', '28'],
    ['come', 'k … m', 'ʌ', 'في المحاضرة: come /kʌm/', 'L3', '34'],
    ['mid', 'm … d', 'ɪ', 'الحرف المكتوب i يُنطق هنا /ɪ/. مثال: kid /kɪd/', 'L3', '11'],
    ['bomb', 'b … m', 'ɒ', 'الحرف المكتوب o يُنطق هنا /ɒ/. مثال: rob /rɒb/', 'L3', '23'],
    ['sell', 's … l', 'e', 'الحرف المكتوب e يُنطق هنا /e/. مثال: shelf /ʃelf/', 'L3', '15'],
    ['food', 'f … d', 'uː', 'من أمثلة /uː/ في المحاضرة.', 'L3', '29'],
    ['curt', 'k … t', 'ɜː', 'الحرفان المكتوبان ur يُنطقان هنا /ɜː/. مثال: hurt /hɜːt/', 'L3', '36'],
    ['park', 'p … k', 'ɑː', 'الحرفان المكتوبان ar يُنطقان هنا /ɑː/. أمثلة: part, card', 'L3', '21، 42'],
    ['need', 'n … d', 'iː', 'الحرفان المكتوبان ee يُنطقان هنا /iː/. مثال: feet /fiːt/', 'L3', '9'],
    ['horse', 'h … s', 'ɔː', 'من أمثلة /ɔː/ في المحاضرة.', 'L3', '25']
  ],
  /* word, transcription, group, note, lecture, page */
  part3: [
    ['tone', 'təʊn', 'closing-u', 'مثال: stone /stəʊn/', 'L4', '16'],
    ['style', 'staɪl', 'closing-i', 'مثال: smile /smaɪl/', 'L4', '12'],
    ['out', 'aʊt', 'closing-u', 'الحرفان المكتوبان ou يُنطقان هنا /aʊ/. مثال: loud /laʊd/', 'L4', '17'],
    ['way', 'weɪ', 'closing-i', 'الحرفان المكتوبان ay يُنطقان هنا /eɪ/. مثال: say /seɪ/', 'L4', '11'],
    ['beer', 'bɪə', 'centring', 'من التمرين المحلول في المحاضرة.', 'L4', '8'],
    ['coil', 'kɔɪl', 'closing-i', 'مثال: boil /bɔɪl/', 'L4', '13'],
    ['hair', 'heə', 'centring', 'من التمرين المحلول في المحاضرة.', 'L4', '8'],
    ['why', 'waɪ', 'closing-i', 'في المحاضرة: why /waɪ/', 'L4', '12'],
    ['they', 'ðeɪ', 'closing-i', 'الحرفان المكتوبان ey يُنطقان هنا /eɪ/. مثال: grey /greɪ/', 'L4', '11'],
    ['here', 'hɪə', 'centring', 'من التمرين المحلول في المحاضرة.', 'L4', '8'],
    ['cure', 'kjʊə', 'centring', 'من التمرين المحلول في المحاضرة.', 'L4', '8'],
    ['wait', 'weɪt', 'closing-i', 'في المحاضرة: wait /weɪt/', 'L4', '11'],
    ['white', 'waɪt', 'closing-i', 'من التمرين المحلول في المحاضرة.', 'L4', '14'],
    ['point', 'pɔɪnt', 'closing-i', 'من أمثلة /ɔɪ/ في المحاضرة.', 'L4', '13'],
    ['found', 'faʊnd', 'closing-u', 'من أمثلة /aʊ/ في المحاضرة.', 'L4', '17'],
    ['phoned', 'fəʊnd', 'closing-u', 'كتبت الدكتورة على الشريحة: /fəʊnd/', 'L4', '17']
  ],
  ref: [
    ['Centering Diphthongs ending with /ə/: /ɪə/, /eə/, /ʊə/', 0],
    ['/ɪə/ as in \'beard\', \'Ian\', \'fierce\'', 1], ['/eə/ as in \'aired\', \'cairn\', \'scare\'', 1], ['/ʊə/ as in \'moored\' and \'tour\'', 1],
    ['Closing Diphthongs:', 0],
    ['a- ending with /ɪ/: /eɪ/, /aɪ/, /ɔɪ/', 1],
    ['/eɪ/ as in \'paid\', \'pain\', \'face\'', 2], ['/aɪ/ as in \'tide\', \'time\', \'nice\'', 2], ['/ɔɪ/ as in \'void\', \'loin\', \'voice\'', 2],
    ['b- ending with /ʊ/: /əʊ/, /aʊ/', 1],
    ['/əʊ/ as in \'load\', \'home\', \'most\'', 2], ['/aʊ/ as in \'loud\', \'gown\', \'house\'', 2]
  ]
};
function byWord(list) { var o = {}; list.forEach(function (x) { o[x[0]] = x; }); return o; }
var ASG2 = byWord(ASG.part2), ASG3 = byWord(ASG.part3);

function asgItem(n, qNode, ans, whyNodes) {
  var a = h('span', { class: 'asg-a hidden', 'aria-hidden': 'true' }, ans);
  var why = h('div', { class: 'asg-why', dir: 'rtl', hidden: true }, whyNodes);
  var rowB = h('button', { class: 'asg-row', type: 'button', 'aria-expanded': 'false' }, h('span', { class: 'asg-n num' }, String(n)), h('span', { class: 'asg-q' }, qNode), a);
  function set(on) {
    a.classList.toggle('hidden', !on);
    a.setAttribute('aria-hidden', on ? 'false' : 'true');
    why.hidden = !on;
    rowB.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  rowB.addEventListener('click', function () { set(a.classList.contains('hidden')); });
  return { el: h('div', { class: 'mo-item' }, rowB, why), set: set };
}
function whyText(text, lec, pages) {
  return h('p', null, h('span', { richText: text }), ' ', App.pgEl(lec, pages));
}
function asgPart(body, o) {
  var sec = h('section', { class: 'mo-sec ' + App.acc(o.lec) }, blkHead(o.ar, 'Part ' + o.n));
  if (o.note) sec.appendChild(noteEl(o.note));
  if (o.extra) sec.appendChild(o.extra);
  var card = h('div', { class: 'card mo-asg blk', dir: 'ltr' }, h('p', { class: 'mo-instr' }, o.en));
  o.items.forEach(function (it) { card.appendChild(it.el); });
  sec.appendChild(card);
  var shown = false;
  var btn = h('button', { class: 'btn btn-tint mo-reveal', type: 'button' }, 'اعرضي الحل');
  btn.addEventListener('click', function () {
    shown = !shown;
    o.items.forEach(function (it) { it.set(shown); });
    btn.textContent = shown ? 'أخفي الحل' : 'اعرضي الحل';
  });
  sec.appendChild(btn);
  body.appendChild(sec);
}
function buildAssignment(body) {
  var A = D.assignment || {};
  body.appendChild(h('div', { class: 'intro' },
    h('h1', { richText: 'حل Assignment 2' }),
    h('p', { class: 'mo-lead' }, 'قالت الدكتورة إن الاختبار يشبه هذا الواجب. حلّي كل جزء بنفسكِ أولًا، ثم اعرضي الحل. والمسي أي سؤال لتري جوابه وحده.')));

  /* Part 1: description → symbol */
  var p1 = (A.part1 && A.part1.length ? A.part1 : ASG.part1).map(function (x, i) {
    var v = App.vowel(x[1]);
    var why = [];
    if (v) {
      why.push(whyText('الوصف بالعربي: ' + App.descAr(v).join('، ') + '.', 'L3', v.page));
      var twin = (D.vowels || []).filter(function (o) { return o !== v && o.h === v.h && o.f === v.f && o.r === v.r; })[0];
      if (twin) why.push(h('p', { richText: 'انتبهي: الحرف /' + twin.s + '/ له الوصف نفسه، لكنه ' + twin.t + '.' }));
      why.push(h('div', { class: 'wlist mo-why-wl' }, exampleWords(v.s, 1).all.map(function (w) { return App.wordChip(w); })));
    }
    return asgItem(i + 1, x[0] + '.', '/' + x[1] + '/', why);
  });
  asgPart(body, { n: 1, lec: 'L3', ar: 'من الوصف إلى الرمز', en: '1) Provide the correct sound according to the description:', items: p1 });

  /* Part 2: word → vowel symbol (frame in phonetic symbols) */
  var p2 = (A.part2 && A.part2.length ? A.part2 : ASG.part2.map(function (x) { return x[0]; })).map(function (w, i) {
    var e = App.lexWord(w), fb = ASG2[w] || [];
    var frame = e ? App.lexFrame(e).replace('…', ' … ') : (fb[1] || '');
    var ans = e ? e.v : fb[2];
    var why = [];
    if (fb[3]) why.push(whyText(fb[3], fb[4] || 'L3', fb[5]));
    why.push(h('div', { class: 'wlist mo-why-wl' }, App.wordChip(w)));
    return asgItem(i + 1, [h('b', null, w), h('span', { class: 'mo-frame' }, frame)], '/' + ans + '/', why);
  });
  asgPart(body, {
    n: 2, lec: 'L3', ar: 'من الكلمة إلى الحرف الصوتي', en: '2) Exercise 2, p. 170: Write the symbol of the vowel', items: p2,
    note: 'الإطار مكتوب برموز الحروف الساكنة. أمثلة:<bdi class="mo-exl" dir="ltr">come → k … m, curt → k … t</bdi>'
  });

  /* Part 3: whole-word transcription with diphthongs */
  var p3 = (A.part3 && A.part3.length ? A.part3 : ASG.part3.map(function (x) { return x[0]; })).map(function (w, i) {
    var e = App.lexWord(w), fb = ASG3[w] || [];
    var trans = e ? e.t : fb[1];
    var d = e ? App.vowel(e.v) : null;
    var gk = d && d.g ? d.g : fb[2];
    var g = (D.groups || {})[gk] || {};
    var why = [h('p', { rich: 'المجموعة: ' + groupLabel(gk) + '.' + (g.en ? '<bdi class="mo-exl" dir="ltr">' + App.esc(g.en) + '</bdi>' : '') })];
    if (fb[3]) why.push(whyText(fb[3], fb[4] || 'L4', fb[5]));
    why.push(h('div', { class: 'wlist mo-why-wl' }, App.wordChip(w)));
    return asgItem(i + 1, h('b', null, w), '/' + trans + '/', why);
  });
  var ref = h('details', { class: 'more blk' },
    h('summary', null, h('span', null, 'الصندوق المرجعي تحت السؤال'), App.icon('down')),
    h('div', { class: 'more-in' }, h('div', { class: 'mo-ref', dir: 'ltr' }, ASG.ref.map(function (r) {
      return h('p', { class: r[1] ? 'in' : null, style: r[1] === 2 ? 'padding-left:28px' : null,
        html: App.esc(r[0]).replace(/\/[^\/\s]+\//g, function (m) { return '<span style="white-space:nowrap">' + m + '</span>'; }) });
    }))));
  asgPart(body, {
    n: 3, lec: 'L4', ar: 'نسخ الكلمة كاملة', items: p3, extra: ref,
    en: '3) Transcribe the following words using the diphthongs listed below (make sure to transcribe the whole word not only the vowels)'
  });
}
App.registerPage('assignment', function () {
  return App.openPage('حل Assignment 2', function (body) { ensureCSS(); buildAssignment(body); }, { large: true, acc: 'L3' });
});

/* =====================================================================
   7. Settings
   ===================================================================== */
var THEMES = [{ v: 'system', ar: 'تلقائي' }, { v: 'light', ar: 'فاتح' }, { v: 'dark', ar: 'داكن' }];

function themeCard() {
  var cur = App.getTheme();
  var seg = h('div', { class: 'seg mo-seg', role: 'group', 'aria-label': 'المظهر' });
  THEMES.forEach(function (t) {
    seg.appendChild(h('button', {
      type: 'button', 'aria-pressed': cur === t.v ? 'true' : 'false',
      onclick: function () {
        App.setTheme(t.v);
        var bs = seg.querySelectorAll('button');
        for (var i = 0; i < bs.length; i++) bs[i].setAttribute('aria-pressed', THEMES[i].v === t.v ? 'true' : 'false');
      }
    }, t.ar));
  });
  return h('div', { class: 'card mo-pad' }, seg);
}

function audioCard() {
  var st = h('span', { class: 'mo-a-st num' }, ' ');
  var barI = h('i', { style: 'transform:scaleX(0)' });
  var bar = h('div', { class: 'q-prog', hidden: true, 'aria-hidden': 'true' }, barI);
  var msg = h('p', { class: 'mo-msg num', role: 'status', 'aria-live': 'polite' });
  var prot = h('p', { class: 'mo-prot', hidden: true });
  var btn = h('button', { class: 'btn btn-tint', type: 'button' }, 'نزّلي كل الأصوات');
  var running = false;
  function setMsg(text, kind) { msg.className = 'mo-msg num' + (kind ? ' ' + kind : ''); msg.innerHTML = App.richText(text || ''); }
  function setBar(f) { barI.style.transform = 'scaleX(' + Math.max(0, Math.min(1, f)).toFixed(4) + ')'; }
  function paintProt(p, asked) {
    if (p == null) { prot.hidden = true; return; }
    prot.hidden = false;
    prot.textContent = p ? 'المحفوظ محميّ من الحذف التلقائي.' :
      (asked ? 'قد يحذف الجوال الأصوات المحفوظة إذا امتلأت المساحة.' : 'قد يحذف الجوال الأصوات المحفوظة إذا امتلأت مساحته.');
  }
  function paintStats() {
    return App.audio.stats().then(function (s) {
      if (!s.supported) { st.textContent = 'هذا المتصفح لا يحفظ الأصوات.'; btn.disabled = true; return; }
      if (!s.total) { st.textContent = 'لم تصل قائمة الأصوات. تأكدي من الاتصال.'; return; }
      st.textContent = 'محفوظ في جوالكِ: ' + Math.min(s.cached, s.total) + ' من ' + s.total + ' · ';
      st.appendChild(h('bdi', { dir: 'ltr' }, fmtBytes(s.bytes)));
    }).catch(function () { st.textContent = ''; });
  }
  btn.addEventListener('click', function () {
    if (running) return;
    running = true;
    btn.disabled = true;
    bar.hidden = false;
    setBar(0);
    setMsg('نجهّز التنزيل.');
    App.audio.downloadAll(function (done, total) {
      setBar(total ? done / total : 0);
      setMsg('ننزّل الأصوات: ' + done + ' من ' + total);
    }).then(function (r) {
      r = r || {};
      var failed = (r.failed || []).length;
      if (r.reason === 'nolist') setMsg('لم تصل قائمة الأصوات. تأكدي من الاتصال، ثم جرّبي مرة ثانية.', 'bad');
      else if (r.reason === 'unsupported') setMsg('هذا المتصفح لا يحفظ الأصوات.', 'bad');
      else if (r.quota) setMsg('المساحة في جوالكِ لا تكفي لكل الأصوات. نزل ' + (r.done || 0) + ' من ' + (r.total || 0) + '.', 'bad');
      else if (r.reason === 'error') setMsg('لم تنزل الأصوات. جرّبي مرة ثانية.', 'bad');
      else if (failed) setMsg('نزل ' + (r.done || 0) + ' من ' + r.total + '. جرّبي مرة ثانية عندما يكون عندكِ إنترنت.', 'bad');
      else { setBar(1); setMsg('كل الأصوات محفوظة في جوالكِ (' + r.total + ' من ' + r.total + ')، وتعمل بدون إنترنت.', 'ok'); }
      return App.audio.persist();
    }).then(function (p) { paintProt(p, true); return paintStats(); })
      .catch(function () { setMsg('لم تنزل الأصوات. جرّبي مرة ثانية.', 'bad'); })
      .then(function () { running = false; btn.disabled = false; });
  });
  paintStats();
  App.audio.persisted().then(function (p) { paintProt(p, false); });
  return h('div', { class: 'card mo-audio' },
    h('div', { class: 'mo-a-top' }, h('b', null, 'الأصوات بدون إنترنت'), st), bar, msg, btn, prot);
}

function parseBackup(text) {
  var obj;
  try { obj = JSON.parse(String(text || '').trim()); } catch (e) { return null; }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  if (obj.app && obj.app !== 'phonetics') return null;
  var raw = obj.state && typeof obj.state === 'object' ? obj.state : obj;
  function isMap(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
  if (!isMap(raw) || !['q', 'cards', 'lessons', 'tasks'].some(function (k) { return isMap(raw[k]); })) return null;
  return { at: obj.at || null, q: keys(raw.q).length, cards: keys(raw.cards).length, lessons: keys(raw.lessons).length };
}

var importDraft = '';
function exportSheet(rebuild) {
  var text = App.exportState();
  var ta = h('textarea', { readonly: true, 'aria-label': 'نص التقدّم', dir: 'ltr' });
  ta.value = text;
  var p = prefs('more');
  p.exportedAt = Date.now();
  App.save();
  var actions = [{
    label: 'انسخي النص', kind: 'primary', onClick: function () {
      App.copyText(text).then(function (ok) {
        if (ok) App.toast('نسختُ النص.');
        else { try { ta.focus(); ta.select(); } catch (e) { /* ignore */ } App.toast('اضغطي على النص مطوّلًا، ثم انسخيه.'); }
      });
      return false;
    }
  }];
  if (navigator.share) {
    actions.push({
      label: 'شاركي', kind: 'soft', onClick: function () {
        navigator.share({ title: 'تقدّمي في صوتيات', text: text }).catch(function () { /* cancelled */ });
        return false;
      }
    });
  }
  App.sheet({
    title: 'صدّري تقدّمكِ',
    text: 'انسخي النص واحفظيه في الملاحظات، أو أرسليه لنفسكِ. ثم الصقيه في «استوردي التقدّم» على الجهاز الآخر.',
    body: function (box) { box.appendChild(ta); },
    actions: actions, cancel: 'إغلاق', onClose: rebuild
  });
}
function importSheet(rebuild) {
  var ta = h('textarea', { 'aria-label': 'نص التقدّم', dir: 'ltr', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false' });
  ta.value = importDraft;
  ta.addEventListener('input', function () { importDraft = ta.value; err.textContent = ''; });
  var err = h('p', { class: 'mo-err', role: 'alert' });
  var paste = null;
  if (navigator.clipboard && navigator.clipboard.readText) {
    paste = h('button', { class: 'btn btn-tint mo-paste', type: 'button' }, 'الصقي من الحافظة');
    paste.addEventListener('click', function () {
      navigator.clipboard.readText().then(function (t) { ta.value = importDraft = t || ''; err.textContent = ''; })
        .catch(function () { App.toast('اضغطي على المربع مطوّلًا، ثم اختاري «لصق».'); });
    });
  }
  App.sheet({
    title: 'استوردي تقدّمكِ',
    text: 'الصقي النص الذي صدّرتِه من الجهاز الآخر.',
    body: function (box) { box.appendChild(ta); box.appendChild(err); if (paste) box.appendChild(paste); },
    actions: [{
      label: 'استوردي', kind: 'primary', onClick: function () {
        var text = ta.value;
        if (!String(text).trim()) { err.textContent = 'الصقي النص أولًا.'; return false; }
        var info = parseBackup(text);
        if (!info) { err.textContent = 'هذا النص ليس نسخة تقدّم صحيحة.'; return false; }
        var when = info.at && !isNaN(Date.parse(info.at)) ? ' صُدّرت ' + fmtWhen(Date.parse(info.at)) + '.' : '';
        App.ask({
          title: 'نستبدل تقدّمكِ الحالي؟',
          text: 'سيُستبدل التقدّم الذي على هذا الجهاز بالنسخة التي لصقتِها.' + when + ' فيها: الأسئلة ' + info.q + ' · البطاقات ' + info.cards + ' · الدروس ' + info.lessons + '.',
          ok: 'استبدلي', danger: true
        }).then(function (yes) {
          if (!yes) return;
          var r = App.importState(text);
          if (r && r.ok) { importDraft = ''; App.toast('استوردتُ تقدّمكِ.'); rebuild(); }
          else App.sheet({ title: 'لم يُستورد التقدّم', text: (r && r.error) || 'هذا النص ليس نسخة تقدّم صحيحة.', cancel: 'إغلاق' });
        });
      }
    }],
    cancel: true
  });
}
function resetAsk(rebuild) {
  App.ask({
    title: 'نصفّر التقدّم؟',
    text: 'ستُحذف كل إجاباتكِ وبطاقاتكِ ودروسكِ ومهام الخطة. صدّري نسخة أولًا إذا أردتِ الرجوع إليها. الأصوات المحفوظة والمظهر لا يتأثران.',
    ok: 'صفّري', danger: true
  }).then(function (yes) {
    if (!yes) return;
    App.resetState();
    App.toast('صفّرتُ التقدّم.');
    rebuild();
  });
}

function buildSettings(body, page) {
  function rebuild() { if (page && page.replace) page.replace('الإعدادات', buildSettings); }
  var env = App.env || {};
  body.appendChild(h('div', { class: 'intro' }, h('h1', null, 'الإعدادات')));

  body.appendChild(App.secHead('المظهر'));
  body.appendChild(themeCard());

  body.appendChild(App.secHead('الأصوات'));
  body.appendChild(audioCard());

  body.appendChild(App.secHead('التقدّم'));
  body.appendChild(h('div', { class: 'list' },
    App.row({ title: 'صدّري التقدّم', sub: 'انسخي نسخة منه أو شاركيها', icon: 'share', iconBg: 'var(--tint)', onClick: function () { exportSheet(null); } }),
    App.row({ title: 'استوردي التقدّم', sub: 'الصقي نسخة صدّرتِها من قبل', icon: 'doc', iconBg: 'var(--l1-btn)', onClick: function () { importSheet(rebuild); } })));
  var saved = App.state.prefs.savedAt, exported = prefs('more').exportedAt;
  var foot = [];
  if (!App.storageOK()) foot.push('هذا المتصفح لا يحفظ التقدّم، فسيضيع عند إغلاق الصفحة.');
  else if (saved) foot.push('آخر حفظ: ' + fmtWhen(saved) + '.');
  if (exported) foot.push('آخر تصدير: ' + fmtWhen(exported) + '.');
  if (foot.length) body.appendChild(h('p', { class: 'mo-foot num' }, foot.join(' ')));

  var where = env.standalone ? 'أنتِ الآن في تطبيق الشاشة الرئيسية.' : (env.safari ? 'أنتِ الآن في Safari.' : '');
  body.appendChild(h('div', { class: 'banner mo-banner', role: 'note' }, App.icon('info'),
    h('div', { class: 'b-txt' }, h('div', { richText: 'تطبيق الشاشة الرئيسية يحفظ تقدّمه وحده، منفصلًا عن Safari. إذا انتقلتِ من أحدهما إلى الآخر، صدّري تقدّمكِ من الأول واستورديه في الثاني.' + (where ? ' ' + where : '') }))));

  body.appendChild(h('div', { class: 'list', style: 'margin-top:26px' },
    App.row({ title: 'صفّري التقدّم', className: 'mo-danger', chev: false, onClick: function () { resetAsk(rebuild); } })));
}
App.registerPage('settings', function () {
  return App.openPage('الإعدادات', function (body, page) { ensureCSS(); buildSettings(body, page); }, { large: true });
});
})();
