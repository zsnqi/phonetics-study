/* app-core.js — core of the phonetics study app.
   Load order: data.js, app-core.js, app-vowels.js, app-practice.js, app-more.js.
   Owns: state, theme, navigation (tabs, pushed pages, history), the Today and Lessons tabs,
   the lesson page and its text blocks, banners, the shared audio player, sheets and toasts,
   and the registry the other modules plug into.
   Data: window.PH (data.js, read-only).  API: window.App.  Contract: content/app-api.md. */
(function () {
'use strict';

var D = window.PH || {};
var App = {};
window.App = App;
var doc = document;
var hasOwn = Object.prototype.hasOwnProperty;

/* =====================================================================
   1. Small utilities
   ===================================================================== */
var SVGNS = 'http://www.w3.org/2000/svg';

function isObj(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
function clamp01(x) { x = +x || 0; return x < 0 ? 0 : (x > 1 ? 1 : x); }
function pad2(n) { return (n < 10 ? '0' : '') + n; }

function esc(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function setAttrs(node, attrs) {
  Object.keys(attrs).forEach(function (k) {
    var v = attrs[k];
    if (v == null || v === false) return;
    if (k === 'class' || k === 'className') node.setAttribute('class', v);
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'rich') node.innerHTML = rich(v);
    else if (k === 'richText') node.innerHTML = richText(v);
    else if (k === 'text') node.textContent = v;
    else if (k === 'style' && isObj(v)) {
      Object.keys(v).forEach(function (p) {
        if (p.indexOf('-') > -1) node.style.setProperty(p, v[p]); else node.style[p] = v[p];
      });
    }
    else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value' && 'value' in node) node.value = v;
    else node.setAttribute(k, v === true ? '' : v);
  });
}
function addKid(node, c) {
  if (c == null || c === false || c === true) return;
  if (Array.isArray(c)) { for (var i = 0; i < c.length; i++) addKid(node, c[i]); return; }
  if (typeof c === 'object' && c.nodeType) node.appendChild(c);
  else node.appendChild(doc.createTextNode(String(c)));
}
function fill(node, args) {
  var i = 1, a = args[1];
  if (a === null || a === undefined) i = 2;
  else if (isObj(a) && !a.nodeType) { setAttrs(node, a); i = 2; }
  for (; i < args.length; i++) addKid(node, args[i]);
  return node;
}
/* h('div', {class:'card', onclick: fn}, child, 'text', [more]) */
function h(tag) { return fill(doc.createElement(tag), arguments); }
/* svg('circle', {cx: 4, cy: 4, r: 2}) — same as h() but in the SVG namespace */
function svg(tag) { return fill(doc.createElementNS(SVGNS, tag), arguments); }

/* ----- mixed-direction text -----
   rich(html): every run of Latin/IPA characters inside Arabic text (with its internal spaces,
   punctuation, slashes, ː and stress marks) is wrapped in <bdi dir="ltr" class="en">, and
   source labels (.t-pg "L3 · ص6") are rebuilt as «L3 · ص 6» with each part isolated. */
var RICH_RE = /[\/\[(]*[A-Za-zÀ-ɏɐ-˿̀-ͯͰ-Ͽᴀ-ᶿḀ-ỿ](?:[A-Za-zÀ-ɏɐ-˿̀-ͯͰ-Ͽᴀ-ᶿḀ-ỿ0-9  .,'’\-–\/()\[\]+&=≠→·…:;!?]*[A-Za-zÀ-ɏɐ-˿̀-ͯͰ-Ͽᴀ-ᶿḀ-ỿ0-9\/)\]])?/g;
var RICH_HINT = /[A-Za-zÀ-Ͽᴀ-ỿ]/;
var RICH_SKIP_TAG = /^(BDI|CODE|PRE|SCRIPT|STYLE|TEXTAREA|SVG)$/i;
var RICH_SKIP_CLASS = /(^|\s)(t-en|t-ipa|en|en-pill|ltr|ltrx|word)(\s|$)/;
var PG_RE = /^\s*(L\d)\s*(?:·\s*ص\s*(.+?))?\s*$/;
function pgParts(lec, pages) {
  var out = [h('bdi', { dir: 'ltr' }, lec)];
  if (pages != null && String(pages) !== '') {
    out.push(' · ');
    out.push(h('bdi', { dir: 'rtl' }, 'ص ', h('bdi', { dir: 'ltr' }, String(pages))));
  }
  return out;
}
function pgEl(lec, page) { return h('span', { class: 't-pg' }, pgParts(lec, page)); }
function srcEl(str) {
  var m = PG_RE.exec(String(str == null ? '' : str));
  return m ? pgEl(m[1], m[2]) : h('span', { class: 't-pg' }, h('bdi', null, String(str == null ? '' : str)));
}
function richSkip(el, root) {
  for (var n = el; n && n !== root && n.nodeType === 1; n = n.parentNode) {
    if (RICH_SKIP_TAG.test(n.nodeName) || n.hasAttribute('dir')) return true;
    if (RICH_SKIP_CLASS.test(n.getAttribute('class') || '')) return true;
  }
  return false;
}
function richify(root) {
  if (!root || !root.querySelectorAll) return root;
  var pgs = root.querySelectorAll('.t-pg');
  for (var i = 0; i < pgs.length; i++) {
    var p = pgs[i], m = PG_RE.exec(p.textContent);
    if (m && !p.querySelector('bdi')) { p.textContent = ''; addKid(p, pgParts(m[1], m[2])); }
  }
  var walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  texts.forEach(function (t) {
    var str = t.nodeValue;
    if (!str || !RICH_HINT.test(str) || richSkip(t.parentNode, root)) return;
    var frag = null, last = 0, m2;
    RICH_RE.lastIndex = 0;
    while ((m2 = RICH_RE.exec(str))) {
      if (!frag) frag = doc.createDocumentFragment();
      if (m2.index > last) frag.appendChild(doc.createTextNode(str.slice(last, m2.index)));
      frag.appendChild(h('bdi', { dir: 'ltr', class: 'en' }, m2[0]));
      last = m2.index + m2[0].length;
    }
    if (!frag) return;
    if (last < str.length) frag.appendChild(doc.createTextNode(str.slice(last)));
    t.parentNode.replaceChild(frag, t);
  });
  return root;
}
function rich(html) {
  var t = doc.createElement('template');
  t.innerHTML = html == null ? '' : String(html);
  richify(t.content);
  return t.innerHTML;
}
function richText(text) { return rich(esc(text)); }

var ICONS = {
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.1M4 12h.1M4 18h.1"/></svg>',
  back: '<svg viewBox="0 0 13 21" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 2.5l8 8-8 8"/></svg>',
  chev: '<svg viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 1.5L6.5 7l-5 5.5"/></svg>',
  down: '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 5l4.5 4.5L11.5 5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" opacity=".16"/><path d="M7.4 12.4l3.1 3.1 6.1-6.6"/></svg>',
  checkFill: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.4 12.4l3.1 3.1 6.1-6.6" fill="none" style="stroke:var(--acc-card,var(--bg))" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor"/><path class="w1" d="M15.5 9.2a4 4 0 0 1 0 5.6"/><path class="w2" d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5" fill="currentColor" fill-opacity=".25"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.6" r="1.2" fill="currentColor" stroke="none"/></svg>',
  close: '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M7.5 10H6a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 18 10h-1.5"/></svg>',
  compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15.6 8.4l-2.2 5-5 2.2 2.2-5z"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l9 16H3z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.3" r="1" fill="currentColor" stroke="none"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4.5h-4.5"/></svg>',
  redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v4.5h4.5"/></svg>',
  mock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M10 2.5h4M12 2.5V6"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/><path d="M9 14l2 2 4-4.5"/></svg>',
  sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>',
  dot: '<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="3" fill="currentColor"/></svg>',
  tick: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.3l2.3 2.3 4.7-5"/></svg>',
  cross: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3.2 3.2l5.6 5.6M8.8 3.2l-5.6 5.6"/></svg>',
  star: '<svg viewBox="0 0 12 12"><path d="M6 1.2l1.45 3 3.3.45-2.4 2.3.6 3.25L6 8.65 3.05 10.2l.6-3.25-2.4-2.3 3.3-.45z" fill="currentColor"/></svg>'
};
function icon(name, cls) {
  var str = ICONS[name];
  if (!str) return null;
  var t = doc.createElement('template');
  t.innerHTML = str;
  var n = t.content.firstElementChild;
  if (cls) n.setAttribute('class', cls);
  n.setAttribute('aria-hidden', 'true');
  n.setAttribute('focusable', 'false');
  return n;
}

function shuffle(arr) {
  var a = (arr || []).slice();
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function sample(arr, n) { return shuffle(arr).slice(0, n); }

var motionMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
function reducedMotion() { return !!(motionMQ && motionMQ.matches); }

/* plural(n, ['سؤال', 'سؤالين', 'أسئلة', 'سؤال']) -> 'سؤال' | 'سؤالين' | '5 أسئلة' | '12 سؤال' */
function plural(n, f) {
  n = +n || 0;
  if (n === 1) return f[0];
  if (n === 2) return f[1];
  if (n >= 3 && n <= 10) return n + ' ' + f[2];
  return n + ' ' + (f[3] || f[0]);
}

/* ----- dates (local calendar days as 'YYYY-MM-DD'; never compare formatted strings) ----- */
var DAY_MS = 864e5;
function ymd(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function isYmd(x) { return typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x); }
function utcOf(x) { var p = x.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
function daysBetween(a, b) { return Math.round((utcOf(b) - utcOf(a)) / DAY_MS); }
function dateOf(x) { var p = x.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
var todayOverride = (function () {
  try { var q = new URLSearchParams(location.search).get('today'); return isYmd(q) ? q : null; } catch (e) { return null; }
})();
function today() { return todayOverride || ymd(new Date()); }
var AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
var AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
function fmtDate(x, opts) {
  var d = dateOf(isYmd(x) ? x : today());
  opts = opts || { weekday: 'long', day: 'numeric', month: 'long' };
  try { return new Intl.DateTimeFormat('ar-u-ca-gregory-nu-latn', opts).format(d); }
  catch (e) {
    if (opts.weekday && !opts.day) return AR_DAYS[d.getDay()];
    return (opts.weekday ? AR_DAYS[d.getDay()] + '، ' : '') + d.getDate() + ' ' + AR_MONTHS[d.getMonth()];
  }
}

/* =====================================================================
   2. Data helpers (read-only views over window.PH)
   ===================================================================== */
var LECS = ['L1', 'L2', 'L3', 'L4'];
var LEC_SHORT = { L1: 'مقدمة', L2: 'الإنتاج', L3: 'الأحادية', L4: 'المزدوجة' };

function normIPA(str) {
  str = String(str == null ? '' : str);
  try { str = str.normalize('NFC'); } catch (e) { /* old engines */ }
  return str.replace(/[\/\sˈˌ.\[\]]/g, '').replace(/:/g, 'ː').replace(/ɡ/g, 'g');
}

var VIDX = {};
(D.vowels || []).forEach(function (v) { VIDX[v.c] = VIDX[v.s] = { k: 'mono', v: v }; });
(D.diphthongs || []).forEach(function (v) { VIDX[v.c] = VIDX[v.s] = { k: 'diph', v: v }; });
(D.triphthongs || []).forEach(function (v) { VIDX[v.s] = { k: 'tri', v: v }; });
function vIdx(x) { return VIDX[x] || VIDX[normIPA(x)] || null; }
function vowel(x) { var r = vIdx(x); return r ? r.v : null; }
function vowelKind(x) { var r = vIdx(x); return r ? r.k : null; }
function descLine(x) {
  var v = typeof x === 'object' ? x : vowel(x);
  if (!v || !v.h) return '';
  return [v.h, v.f, v.r, v.t].join(', ');
}
function descAr(x) {
  var v = typeof x === 'object' ? x : vowel(x);
  if (!v || !v.h) return [];
  return [(D.heightAr || {})[v.h], (D.posAr || {})[v.f], (D.roundAr || {})[v.r], (D.tenseAr || {})[v.t]];
}

/* lexicon: 'word trans(target in [ ]) spelling(letters in [ ]) [!]', '@L3' switches lecture */
var LEX = [], LEXW = {};
(function parseLex() {
  var lec = 'L3';
  (D.lexText || []).forEach(function (line) {
    line = String(line).trim();
    if (!line) return;
    if (line.charAt(0) === '@') { lec = line.slice(1); return; }
    var parts = line.split(/\s+/);
    if (parts.length < 3) return;
    var m = /^(.*)\[(.+?)\](.*)$/.exec(parts[1]);
    if (!m) return;
    var w = parts[0];
    var e = {
      w: w, lec: lec, t: m[1] + m[2] + m[3], v: m[2], pre: m[1], post: m[3], sp: parts[2],
      ex: parts.indexOf('!', 3) > -1, note: (D.slideNotes || {})[w.toLowerCase()] || null
    };
    LEX.push(e);
    var k = w.toLowerCase();
    if (!LEXW[k]) LEXW[k] = e;
  });
})();
function lexWord(w) { return LEXW[String(w || '').toLowerCase()] || null; }
function lexFor(sym) { var n = normIPA(sym); return LEX.filter(function (e) { return e.v === sym || e.v === n; }); }
function lexFrame(e) { return e ? normIPA(e.pre) + '…' + normIPA(e.post) : ''; }
function spellParts(sp) {
  var out = [], re = /\[([^\]]*)\]|([^\[]+)/g, m;
  while ((m = re.exec(String(sp || '')))) out.push(m[1] != null ? { t: m[1], m: true } : { t: m[2], m: false });
  return out;
}
function spellHTML(e) {
  if (!e) return '';
  return spellParts(e.sp).map(function (p) { return p.m ? '<mark>' + esc(p.t) + '</mark>' : esc(p.t); }).join('');
}
function spellNode(e) {
  var span = h('span');
  spellParts(e.sp).forEach(function (p) { span.appendChild(p.m ? h('mark', null, p.t) : doc.createTextNode(p.t)); });
  return span;
}

var LIDX = {};
(D.lessons || []).forEach(function (L) { LIDX[L.id] = L; });
var PIDX = {};
(D.plan || []).forEach(function (p) { PIDX[p.id] = p; });

var HELP = D.helpers || {};
function enHTML(t) { return HELP.en ? HELP.en(t) : '<bdi class="t-en" dir="ltr">' + t + '</bdi>'; }
function ipaHTML(x) { return HELP.ipa ? HELP.ipa(x) : '<bdi class="t-ipa" dir="ltr">/' + x + '/</bdi>'; }
function pgHTML(l, p) { return HELP.pg ? HELP.pg(l, p) : '<span class="t-pg">' + l + ' · ص' + p + '</span>'; }
function ipaEl(x, slashes) { return h('bdi', { class: 't-ipa', dir: 'ltr' }, slashes === false ? x : '/' + x + '/'); }
function enEl(t) { return h('bdi', { class: 't-en', dir: 'ltr' }, t); }

/* =====================================================================
   3. Events and registry
   ===================================================================== */
var handlers = {};
function on(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); return function () { off(ev, fn); }; }
function off(ev, fn) { var l = handlers[ev]; if (l) { var i = l.indexOf(fn); if (i > -1) l.splice(i, 1); } }
function emit(ev, data) {
  (handlers[ev] || []).slice().forEach(function (fn) {
    try { fn(data); } catch (e) { console.error('[App] "' + ev + '" handler failed', e); }
  });
}

var reg = { blocks: {}, widgets: {}, tabs: {}, pages: {} };
var CORE_BLOCKS = {};        /* filled in section 9 */
var CORE_TABS = { today: 1, lessons: 1 };
var CORE_PAGES = { lesson: 1 };

function registerBlock(type, fn) {
  if (CORE_BLOCKS[type]) { console.warn('[App] block "' + type + '" belongs to app-core; ignored'); return false; }
  if (reg.blocks[type]) console.warn('[App] block "' + type + '" registered twice; the last one wins');
  reg.blocks[type] = fn;
  markDirty();
  return true;
}
function registerWidget(name, fn) {
  if (reg.widgets[name]) console.warn('[App] widget "' + name + '" registered twice; the last one wins');
  reg.widgets[name] = fn;
  return true;
}
function registerTab(name, fn) {
  if (CORE_TABS[name] || TABS.indexOf(name) < 0) { console.warn('[App] tab "' + name + '" cannot be registered'); return false; }
  reg.tabs[name] = fn;
  dirty[name] = true;
  if (booted && curTab === name && !stack.length) renderTab(name);
  return true;
}
function registerPage(name, fn) {
  if (CORE_PAGES[name]) { console.warn('[App] page "' + name + '" belongs to app-core; ignored'); return false; }
  if (reg.pages[name]) console.warn('[App] page "' + name + '" registered twice; the last one wins');
  reg.pages[name] = fn;
  return true;
}
function placeholder(text) {
  return h('div', { class: 'card', style: 'padding:16px' },
    h('p', { class: 'dim', style: 'font-size:15px;line-height:1.55', richText: text || 'هذا الجزء قيد التجهيز.' }));
}
function widget(name, opts) {
  var fn = reg.widgets[name];
  if (fn) {
    try { var n = fn(opts || {}); if (n) return n; }
    catch (e) { console.error('[App] widget "' + name + '" failed', e); }
  }
  return placeholder('هذا الرسم قيد التجهيز.');
}
function hasWidget(name) { return !!reg.widgets[name]; }

/* =====================================================================
   4. State (localStorage 'ph-v1' with an in-memory fallback)
   ===================================================================== */
var KEY = 'ph-v1', THEME_KEY = 'ph-theme';
var PRAC_GOAL = 15, CARD_GOAL = 20;
var storageOK = (function () {
  try { var k = '__ph_probe'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; } catch (e) { return false; }
})();
var mem = {};
var lastSaveOK = storageOK;
function lsGet(k) {
  if (storageOK) { try { return localStorage.getItem(k); } catch (e) { /* fall through */ } }
  return hasOwn.call(mem, k) ? mem[k] : null;
}
function lsSet(k, v) {
  mem[k] = v;
  if (!storageOK) return false;
  try { localStorage.setItem(k, v); return true; } catch (e) { return false; }
}

function blank() { return { v: 1, q: {}, cards: {}, lessons: {}, tasks: {}, prefs: {} }; }
function int(x) { x = Math.floor(+x || 0); return x > 0 ? x : 0; }
function clean(raw) {
  var st = blank();
  if (!isObj(raw)) return st;
  ['q', 'cards', 'lessons', 'tasks', 'prefs'].forEach(function (k) { if (isObj(raw[k])) st[k] = raw[k]; });
  Object.keys(st.q).forEach(function (id) {
    var r = st.q[id];
    if (!isObj(r)) { delete st.q[id]; return; }
    st.q[id] = { s: r.s ? 1 : 0, n: int(r.n), c: int(r.c), last: +r.last || 0 };
  });
  Object.keys(st.cards).forEach(function (id) {
    var r = st.cards[id];
    if (!isObj(r)) { delete st.cards[id]; return; }
    var box = int(r.box); if (box > 3) box = 3;
    st.cards[id] = { box: box, n: int(r.n), last: +r.last || 0 };
  });
  Object.keys(st.lessons).forEach(function (id) { if (st.lessons[id]) st.lessons[id] = 1; else delete st.lessons[id]; });
  Object.keys(st.tasks).forEach(function (id) {
    var r = st.tasks[id];
    if (!isObj(r)) { delete st.tasks[id]; return; }
    st.tasks[id] = { lessons: isObj(r.lessons) ? r.lessons : {}, prac: int(r.prac), cards: int(r.cards), doneDate: isYmd(r.doneDate) ? r.doneDate : null };
  });
  return st;
}
function load() {
  var raw = lsGet(KEY);
  if (!raw) return blank();
  try { return clean(JSON.parse(raw)); } catch (e) { return blank(); }
}
var state = load();

function save() {
  state.prefs.savedAt = Date.now();
  var str;
  try { str = JSON.stringify(state); } catch (e) { console.error('[App] state is not serialisable', e); return false; }
  lastSaveOK = lsSet(KEY, str);
  markDirty();
  emit('state', state);
  return lastSaveOK;
}
function hasProgress() {
  return Object.keys(state.q).length + Object.keys(state.cards).length + Object.keys(state.lessons).length > 0;
}
function exportState() {
  return JSON.stringify({ app: 'phonetics', v: 1, at: new Date().toISOString(), state: state });
}
function importState(text) {
  var obj;
  try { obj = JSON.parse(String(text || '').trim()); }
  catch (e) { return { ok: false, error: 'هذا النص ليس نسخة تقدّم صحيحة.' }; }
  var raw = isObj(obj) && isObj(obj.state) ? obj.state : obj;
  if (!isObj(raw) || !(isObj(raw.q) || isObj(raw.cards) || isObj(raw.lessons) || isObj(raw.tasks))) {
    return { ok: false, error: 'هذا النص ليس نسخة تقدّم صحيحة.' };
  }
  var keepBanners = state.prefs.banners;
  state = clean(raw);
  if (keepBanners && !state.prefs.banners) state.prefs.banners = keepBanners;
  save();
  emit('import', state);
  refresh();
  return { ok: true };
}
function resetState() {
  var keep = { banners: state.prefs.banners };
  state = blank();
  if (keep.banners) state.prefs.banners = keep.banners;
  animMem = {};
  save();
  emit('reset', state);
  refresh();
  return true;
}

/* question status: new / right / wrong / mastered (= right twice in a row) */
function qStatus(id) {
  var r = state.q[id];
  if (!r || !r.n) return 'new';
  if (r.c >= 2) return 'mastered';
  return r.s ? 'right' : 'wrong';
}
function countStatus(ids) {
  var out = { new: 0, right: 0, wrong: 0, mastered: 0 };
  (ids || []).forEach(function (id) { out[qStatus(id)]++; });
  return out;
}
function wrongIds() { return Object.keys(state.q).filter(function (id) { return qStatus(id) === 'wrong'; }); }

function recordAnswer(id, ok, info) {
  if (!id) return 'new';
  var r = state.q[id] || (state.q[id] = { s: 0, n: 0, c: 0, last: 0 });
  r.n++;
  r.s = ok ? 1 : 0;
  r.c = ok ? r.c + 1 : 0;
  r.last = Date.now();
  creditTask('prac', info || {});
  save();
  var st = qStatus(id);
  emit('answer', { id: id, ok: !!ok, info: info || {}, status: st });
  return st;
}
function cardBox(id) { var r = state.cards[id]; return r ? r.box : 0; }
function recordCard(id, known, info) {
  if (!id) return { box: 0, n: 0 };
  var r = state.cards[id] || (state.cards[id] = { box: 0, n: 0, last: 0 });
  r.n++;
  r.box = known ? Math.min(3, r.box + 1) : 0;
  r.last = Date.now();
  creditTask('cards', info || {});
  save();
  emit('card', { id: id, known: !!known, info: info || {}, box: r.box });
  return { box: r.box, n: r.n };
}

/* =====================================================================
   5. Theme ('ph-theme': system | light | dark)
   ===================================================================== */
var themeMem = null;
var META_THEME = { light: '#FFF9F4', dark: '#000000' };
function getTheme() {
  var v = null;
  try { v = localStorage.getItem(THEME_KEY); } catch (e) { v = themeMem; }
  return v === 'light' || v === 'dark' ? v : 'system';
}
function applyTheme(v) {
  var root = doc.documentElement;
  if (v === 'light' || v === 'dark') root.setAttribute('data-theme', v); else root.removeAttribute('data-theme');
  var metas = doc.querySelectorAll('meta[name="theme-color"]');
  for (var i = 0; i < metas.length; i++) {
    var m = metas[i], media = m.getAttribute('media') || '';
    if (v === 'light' || v === 'dark') m.setAttribute('content', META_THEME[v]);
    else m.setAttribute('content', /dark/.test(media) ? META_THEME.dark : META_THEME.light);
  }
}
function setTheme(v) {
  if (v !== 'light' && v !== 'dark') v = 'system';
  themeMem = v;
  try { if (v === 'system') localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, v); } catch (e) { /* memory only */ }
  applyTheme(v);
  emit('theme', v);
  return v;
}

/* =====================================================================
   6. Audio (audio/list.json, one reused <audio>, Blob URLs from the cache)
   ===================================================================== */
var AUDIO_CACHE = 'phonetics-audio-v1';
var audioList = null;
var audioReady = null;
var player = null, playingBtn = null, playingTimer = 0;
var blobMemo = {}, memoOrder = [], memoPending = {};
var MEMO_CAP = 160;

function absUrl(u) { try { return new URL(u, location.href).href; } catch (e) { return u; } }
function slug(w) { return String(w == null ? '' : w).trim().toLowerCase(); }
function wordUrl(w) { return absUrl('./audio/w/' + encodeURIComponent(slug(w)) + '.mp3'); }
function vowelUrl(code) { return absUrl('./audio/v/' + encodeURIComponent(code) + '.mp3'); }

function loadAudioList() {
  if (audioReady) return audioReady;
  audioReady = new Promise(function (resolve) {
    if (typeof fetch !== 'function') { resolve(false); return; }
    fetch('./audio/list.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (j) {
          audioList = { w: new Set((j.w || []).map(slug)), v: new Set(j.v || []) };
          markDirty();
          emit('audio', audioList);
        }
        resolve(!!j);
      })
      .catch(function () { resolve(false); });
  });
  return audioReady;
}
function hasAudio(word) { return !!(audioList && audioList.w.has(slug(word))); }
function vowelCode(x) {
  if (audioList && audioList.v.has(x)) return x;
  var v = vowel(x);
  return v && v.c ? v.c : null;
}
function hasVowelAudio(x) { var c = vowelCode(x); return !!(c && audioList && audioList.v.has(c)); }
/* the keyword example word for a vowel (same ranking as the lesson readout: assignment word, slide head word, has audio) */
function vowelWord(x) { var v = vowel(x); if (!v) return null; return pickWords(v.s, 1)[0] || null; }
function canPlayVowel(x) { if (hasVowelAudio(x)) return true; var w = vowelWord(x); return !!(w && hasAudio(w)); }

function getPlayer() {
  if (player) return player;
  player = doc.createElement('audio');
  player.preload = 'none';
  player.setAttribute('playsinline', '');
  player.addEventListener('ended', function () { setPlaying(null); });
  player.addEventListener('pause', function () { if (player.paused) setPlaying(null); });
  return player;
}
function setPlaying(btn) {
  if (playingBtn && playingBtn !== btn) playingBtn.classList.remove('on', 'playing');
  playingBtn = btn || null;
  clearTimeout(playingTimer);
  if (playingBtn) {
    playingBtn.classList.add(playingBtn.classList.contains('speak') ? 'on' : 'playing');
    playingTimer = setTimeout(function () { setPlaying(null); }, 6000);
  }
}
function putMemo(url, obj) {
  if (blobMemo[url]) { try { URL.revokeObjectURL(obj); } catch (e) { /* ignore */ } return blobMemo[url]; }
  blobMemo[url] = obj;
  memoOrder.push(url);
  while (memoOrder.length > MEMO_CAP) {
    var old = memoOrder.shift(), o = blobMemo[old];
    delete blobMemo[old];
    if (o && (!player || player.src !== o)) { try { URL.revokeObjectURL(o); } catch (e) { /* ignore */ } }
  }
  return obj;
}
function canBlob() { return typeof fetch === 'function' && window.URL && URL.createObjectURL && location.protocol !== 'file:'; }
function memoize(url) {
  if (blobMemo[url] || memoPending[url] || !canBlob()) return;
  memoPending[url] = 1;
  fetch(url)
    .then(function (r) { return r.ok ? r.blob() : null; })
    .then(function (b) { if (b && b.size) putMemo(url, URL.createObjectURL(b)); })
    .catch(function () { /* offline: the plain URL path still works through the service worker */ })
    .then(function () { delete memoPending[url]; });
}
function fromCache(url) {
  if (!('caches' in window) || !canBlob()) return Promise.resolve(null);
  return caches.open(AUDIO_CACHE)
    .then(function (c) { return c.match(url); })
    .then(function (res) { return res ? res.blob() : null; })
    .then(function (b) { return b && b.size ? putMemo(url, URL.createObjectURL(b)) : null; })
    .catch(function () { return null; });
}
/* Called from inside a tap handler: assigns the source and calls play() synchronously. */
function playUrl(url, btn) {
  var a = getPlayer();
  if (btn && btn === playingBtn && !a.paused) { a.pause(); setPlaying(null); return Promise.resolve(false); }
  try { a.pause(); } catch (e) { /* ignore */ }
  var memo = blobMemo[url];
  a.src = memo || url;
  setPlaying(btn || null);
  var p;
  try { p = a.play(); } catch (e) { p = Promise.reject(e); }
  if (!memo) memoize(url);
  return Promise.resolve(p).then(function () { return true; }, function (err) {
    var name = err && err.name;
    if (name === 'AbortError') return false;
    if (name === 'NotAllowedError') { setPlaying(null); return false; }
    if (memo) { setPlaying(null); return false; }
    return fromCache(url).then(function (obj) {
      if (!obj) throw err;
      a.src = obj;
      return a.play().then(function () { return true; });
    }).catch(function () {
      setPlaying(null);
      toast('تعذّر تشغيل الصوت. تأكدي من الاتصال بالإنترنت.');
      return false;
    });
  });
}
function playWord(word, btn) {
  if (!hasAudio(word)) return Promise.resolve(false);
  return playUrl(wordUrl(word), btn);
}
function playVowel(x, btn) {
  var c = vowelCode(x);
  if (c && hasVowelAudio(c)) return playUrl(vowelUrl(c), btn);
  var w = vowelWord(x);
  if (w && hasAudio(w)) return playUrl(wordUrl(w), btn);
  return Promise.resolve(false);
}
function stopAudio() {
  if (player) { try { player.pause(); } catch (e) { /* ignore */ } }
  setPlaying(null);
}
/* Resolve already-cached clips into Blob URLs ahead of a tap (no network). */
function prime(words, vowels) {
  if (!('caches' in window) || !audioList || !canBlob()) return;
  var urls = [];
  (words || []).forEach(function (w) { if (hasAudio(w)) urls.push(wordUrl(w)); });
  (vowels || []).forEach(function (v) { var c = vowelCode(v); if (c && hasVowelAudio(c)) urls.push(vowelUrl(c)); });
  urls = urls.filter(function (u, i) { return !blobMemo[u] && urls.indexOf(u) === i; }).slice(0, 60);
  if (!urls.length) return;
  caches.open(AUDIO_CACHE).then(function (c) {
    return urls.reduce(function (pr, u) {
      return pr.then(function () {
        return c.match(u).then(function (res) {
          return res ? res.blob().then(function (b) { if (b.size) putMemo(u, URL.createObjectURL(b)); }) : null;
        });
      });
    }, Promise.resolve());
  }).catch(function () { /* ignore */ });
}
var primeQ = [], primeT = 0;
function queuePrime(w) {
  primeQ.push(w);
  if (!primeT) primeT = setTimeout(function () { primeT = 0; var q = primeQ; primeQ = []; prime(q); }, 40);
}
function audioUrls() {
  if (!audioList) return [];
  var out = [];
  audioList.w.forEach(function (w) { out.push(wordUrl(w)); });
  audioList.v.forEach(function (v) { out.push(vowelUrl(v)); });
  return out;
}
function cacheInPage(urls, onProgress) {
  if (!('caches' in window)) return Promise.resolve({ ok: false, reason: 'unsupported', done: 0, total: urls.length, failed: [], quota: false });
  return caches.open(AUDIO_CACHE).then(function (cache) {
    var i = 0, processed = 0, ok = 0, failed = [], quota = false, total = urls.length;
    if (onProgress) onProgress(0, total);
    function worker() {
      if (i >= total) return Promise.resolve();
      var url = urls[i++];
      return cache.match(url).then(function (hit) {
        if (hit) return null;
        return fetch(url).then(function (r) { if (r.status !== 200) throw new Error('HTTP ' + r.status); return cache.put(url, r); });
      }).then(function () { ok++; }, function (err) {
        failed.push(url);
        if (err && err.name === 'QuotaExceededError') quota = true;
      }).then(function () {
        processed++;
        if (onProgress) onProgress(processed, total);
        return worker();
      });
    }
    return Promise.all([worker(), worker(), worker(), worker()]).then(function () {
      return { ok: !failed.length && !quota, done: ok, total: total, failed: failed, quota: quota };
    });
  }).catch(function (err) {
    return { ok: false, reason: 'error', done: 0, total: urls.length, failed: [], quota: !!(err && err.name === 'QuotaExceededError') };
  });
}
/* "Download all audio": through the service worker when one controls the page, else in the page. */
function downloadAll(onProgress) {
  return loadAudioList().then(function () {
    var urls = audioUrls();
    if (!urls.length) return { ok: false, reason: 'nolist', done: 0, total: 0, failed: [], quota: false };
    var sw = navigator.serviceWorker && navigator.serviceWorker.controller;
    if (!sw) return cacheInPage(urls, onProgress);
    return new Promise(function (resolve) {
      var heard = false;
      function onMsg(e) {
        var d = e.data || {};
        if (d.type === 'audio-progress') { heard = true; if (onProgress) onProgress(d.done, d.total); }
        else if (d.type === 'audio-done') {
          heard = true;
          navigator.serviceWorker.removeEventListener('message', onMsg);
          var failed = Array.isArray(d.failed) ? d.failed : [];
          resolve({ ok: !failed.length && !d.quota, done: d.done, total: d.total, failed: failed, quota: !!d.quota });
        }
      }
      navigator.serviceWorker.addEventListener('message', onMsg);
      try { sw.postMessage({ type: 'cache-audio', urls: urls }); } catch (e) { heard = false; }
      setTimeout(function () {
        if (heard) return;
        navigator.serviceWorker.removeEventListener('message', onMsg);
        cacheInPage(urls, onProgress).then(resolve);
      }, 5000);
    });
  });
}
function audioStats() {
  return loadAudioList().then(function () {
    var total = audioUrls().length;
    if (!('caches' in window)) return { cached: 0, total: total, bytes: 0, supported: false };
    return caches.open(AUDIO_CACHE).then(function (c) {
      return c.keys().then(function (keys) {
        var mine = keys.filter(function (r) { return r.url.indexOf('/audio/') > -1; });
        return Promise.all(mine.map(function (r) {
          return c.match(r).then(function (res) { return res ? res.blob().then(function (b) { return b.size; }) : 0; }).catch(function () { return 0; });
        })).then(function (sizes) {
          return { cached: mine.length, total: total, bytes: sizes.reduce(function (a, b) { return a + b; }, 0), supported: true };
        });
      });
    }).catch(function () { return { cached: 0, total: total, bytes: 0, supported: false }; });
  });
}
function persisted() {
  var st = navigator.storage;
  if (!st || !st.persisted) return Promise.resolve(null);
  return st.persisted().catch(function () { return null; });
}
function persist() {
  var st = navigator.storage;
  if (!st || !st.persist) return Promise.resolve(null);
  return persisted().then(function (p) { return p ? true : st.persist(); }).catch(function () { return null; });
}

/* =====================================================================
   7. Shared UI pieces
   ===================================================================== */
function accClass(lec) { return LECS.indexOf(lec) > -1 ? 'acc-' + lec : ''; }
function tag(lec) { return h('span', { class: 'tag ' + lec }, lec); }
var STATUS = {
  new: ['st-new', 'جديد', 'dot'], right: ['st-right', 'صح', 'tick'],
  wrong: ['st-wrong', 'غلط', 'cross'], mastered: ['st-mastered', 'متقَن', 'star']
};
function statusLabel(st) { return (STATUS[st] || STATUS.new)[1]; }
function stateChip(st) { var m = STATUS[st] || STATUS.new; return h('span', { class: 'state ' + m[0] }, icon(m[2]), m[1]); }
function secHead(text, end) {
  return h('h2', { class: 'sec-h' }, typeof text === 'string' ? h('span', { richText: text }) : h('span', null, text), end != null ? h('b', { class: 'num' }, end) : null);
}
function row(o) {
  o = o || {};
  var clickable = typeof o.onClick === 'function';
  var r = h(clickable ? 'button' : 'div', {
    class: 'row' + (o.icon ? ' has-ico' : '') + (o.className ? ' ' + o.className : ''),
    type: clickable ? 'button' : null
  });
  if (o.icon) r.appendChild(h('span', { class: 'ico', style: 'background:' + (o.iconBg || 'var(--tint)') }, typeof o.icon === 'string' ? icon(o.icon) : o.icon));
  var str = function (x) { return typeof x === 'string' || typeof x === 'number'; };
  r.appendChild(h('span', { class: 'txt' },
    str(o.title) ? h('b', { richText: String(o.title) }) : h('b', null, o.title),
    o.sub ? (str(o.sub) ? h('small', { richText: String(o.sub) }) : h('small', null, o.sub)) : null));
  if (o.meta != null && o.meta !== '') r.appendChild(h('span', { class: 'meta num' }, o.meta));
  if (o.end) r.appendChild(o.end);
  if (o.check) r.appendChild(icon('check', 'check'));
  else if (clickable && o.chev !== false) r.appendChild(icon('chev', 'chev'));
  if (clickable) r.addEventListener('click', o.onClick);
  return r;
}
function speakButton(o) {
  o = o || {};
  function target() { var w = typeof o.word === 'function' ? o.word() : o.word; return w ? { word: w } : { vowel: typeof o.vowel === 'function' ? o.vowel() : o.vowel }; }
  function avail() { var t = target(); return t.word ? hasAudio(t.word) : (t.vowel ? canPlayVowel(t.vowel) : false); }
  var b = h('button', { class: 'speak' + (o.className ? ' ' + o.className : ''), type: 'button', 'aria-label': o.label || 'استمعي' }, icon('speaker'));
  function sync() {
    var ok = avail();
    b.classList.toggle('off', !ok);
    if (ok) { b.removeAttribute('aria-hidden'); b.removeAttribute('tabindex'); }
    else { b.setAttribute('aria-hidden', 'true'); b.setAttribute('tabindex', '-1'); }
    return ok;
  }
  b.addEventListener('click', function (e) {
    e.stopPropagation();
    var t = target();
    if (t.word) playWord(t.word, b); else if (t.vowel) playVowel(t.vowel, b);
  });
  b.sync = sync;
  sync();
  var t0 = target();
  if (t0.word) queuePrime(t0.word);
  else if (t0.vowel && vowelWord(t0.vowel)) queuePrime(vowelWord(t0.vowel));
  return b;
}
function wordChip(word, o) {
  o = o || {};
  var e = lexWord(word);
  var audio = hasAudio(word);
  var chip = h(audio ? 'button' : 'span', {
    class: 'wchip' + (o.className ? ' ' + o.className : ''), type: audio ? 'button' : null, lang: 'en',
    'aria-label': audio ? 'استمعي: ' + word : null
  },
    e && o.mark !== false ? spellNode(e) : h('span', null, word),
    e && o.trans !== false ? h('i', null, '/' + e.t + '/') : null,
    audio ? icon('speaker') : null);
  if (audio) {
    chip.addEventListener('click', function (ev) { ev.stopPropagation(); playWord(word, chip); });
    queuePrime(word);
  }
  return chip;
}
/* clueRow({clue, after, sym, word, tag, warn}) — one spelling row:
   written letters → arrow → IPA → word chip, with an optional Arabic note
   on its own line underneath (aligned to the right edge). */
function clueRow(o) {
  o = o || {};
  var r = h('div', { class: 'clue' + (o.warn ? ' clue-warn' : ''), dir: 'ltr' });
  var line = h('div', { class: 'clue-line' });
  var sp = h('span', { class: 'clue-sp' },
    h('bdi', { class: 't-en', dir: 'ltr' }, o.clue == null ? '' : String(o.clue)));
  if (o.after != null && o.after !== '') {
    sp.appendChild(h('span', { class: 'clue-after' }, String(o.after)));
  }
  line.appendChild(sp);
  line.appendChild(h('span', { class: 'clue-arrow', 'aria-hidden': 'true' }, '→'));
  if (o.sym != null && o.sym !== '') {
    var sym = ipaEl(String(o.sym));
    sym.style.fontSize = '22px';
    line.appendChild(sym);
  }
  if (o.word) {
    var chip = null;
    try {
      /* Mark the clue letters themselves (sh in fish), not the vowel; fall back to the vowel mark when the clue is not literally in the word. */
      var at = -1, len = 0, lw = String(o.word).toLowerCase();
      if (o.mark !== false) String(o.clue == null ? '' : o.clue).toLowerCase().split(/\s*[·,]\s*/).some(function (alt) {
        if (!/^[a-z]+$/.test(alt)) return false;
        var i = lw.indexOf(alt);
        if (i < 0) return false;
        at = i; len = alt.length; return true;
      });
      chip = wordChip(o.word, { mark: false });
      if (at >= 0 && lexWord(o.word) && chip.firstChild) {
        var w0 = String(o.word), s = h('span', null, w0.slice(0, at), h('mark', null, w0.slice(at, at + len)), w0.slice(at + len));
        chip.replaceChild(s, chip.firstChild);
      } else if (o.mark !== false) chip = wordChip(o.word);
    } catch (e) { chip = null; }
    if (!chip) {
      chip = h('button', { class: 'wchip', type: 'button', lang: 'en', 'aria-label': 'استمعي: ' + o.word },
        h('span', null, String(o.word)), icon('speaker'));
      chip.addEventListener('click', function (ev) { ev.stopPropagation(); App.playWord(o.word, chip); });
    }
    line.appendChild(chip);
  }
  r.appendChild(line);
  if (o.tag) r.appendChild(h('span', { class: 'clue-tag', dir: 'rtl', richText: o.tag }));
  return r;
}
/* refChip(text, onClick) — a tappable reference that opens a dialog. */
function refChip(text, onClick) {
  var b = h('button', { class: 'ref-chip', type: 'button', 'aria-haspopup': 'dialog' },
    icon('info'), h('span', { richText: text }));
  if (typeof onClick === 'function') b.addEventListener('click', onClick);
  return b;
}

var toastEl = null, toastTimer = 0;
function toast(msg, ms) {
  if (!toastEl) toastEl = doc.getElementById('toast');
  if (!toastEl) return;
  toastEl.innerHTML = richText(msg);
  toastEl.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, ms || 2400);
}

var sheetCur = null;
var BTN_KIND = { primary: 'btn-primary', soft: 'btn-soft', tint: 'btn-tint', danger: 'btn-danger' };
/* sheet({title, text, html, body, actions:[{label, kind, onClick(api)}], cancel, dismissible, acc, onClose}) */
function sheet(o) {
  o = o || {};
  closeSheet();
  var host = appEl || doc.getElementById('app') || doc.body;
  var bg = h('div', { class: 'sheet-bg' });
  var box = h('div', { class: 'sheet' + (o.acc ? ' acc-' + o.acc : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title || '', tabindex: '-1' });
  var api = { el: box, closed: false, close: null };
  api.close = function () {
    if (api.closed) return;
    api.closed = true;
    if (sheetCur === api) sheetCur = null;
    bg.classList.remove('on');
    box.classList.remove('on');
    setTimeout(function () { if (bg.parentNode) bg.parentNode.removeChild(bg); if (box.parentNode) box.parentNode.removeChild(box); }, 380);
    if (o.onClose) { try { o.onClose(api); } catch (e) { console.error(e); } }
  };
  var grab = h('div', { class: 'sheet-grab', 'aria-hidden': 'true' });
  box.appendChild(grab);
  if (o.dismissible !== false) {
    var xBtn = h('button', { type: 'button', class: 'sheet-x', 'aria-label': 'إغلاق' }, icon('close'));
    xBtn.addEventListener('click', function () { api.close(); });
    box.appendChild(xBtn);
  }
  /* Top drag zone: the visible handle plus a transparent 44px strip. */
  var grabZone = h('div', { class: 'sheet-grab-zone', 'aria-hidden': 'true' });
  box.appendChild(grabZone);
  var drag = { on: false, y0: 0, dy: 0, t0: 0 };
  function dragMove(e) {
    if (!drag.on) return;
    var d = e.clientY - drag.y0;
    drag.dy = d > 0 ? d : 0;
    box.style.transform = drag.dy ? 'translateY(' + drag.dy + 'px)' : '';
    if (drag.dy && e.cancelable) e.preventDefault();
  }
  function dragEnd() {
    if (!drag.on) return;
    drag.on = false;
    doc.removeEventListener('pointermove', dragMove);
    doc.removeEventListener('pointerup', dragEnd);
    doc.removeEventListener('pointercancel', dragEnd);
    var dy = drag.dy, dt = Math.max(1, Date.now() - drag.t0);
    if (dy > 90 || (dy > 12 && dy / dt > 0.6)) {
      box.style.transition = '';
      box.style.transform = '';
      api.close();
      return;
    }
    if (reducedMotion()) {
      box.style.transition = 'none';
      box.style.transform = '';
      setTimeout(function () { box.style.transition = ''; }, 0);
    } else {
      box.style.transition = 'transform .25s';
      box.style.transform = '';
      setTimeout(function () { box.style.transition = ''; }, 260);
    }
  }
  function dragStart(e) {
    if (e.button != null && e.button > 0) return;
    drag.on = true; drag.y0 = e.clientY; drag.dy = 0; drag.t0 = Date.now();
    box.style.transition = 'none';
    doc.addEventListener('pointermove', dragMove, { passive: false });
    doc.addEventListener('pointerup', dragEnd);
    doc.addEventListener('pointercancel', dragEnd);
  }
  grab.addEventListener('pointerdown', dragStart);
  grabZone.addEventListener('pointerdown', dragStart);
  box.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.stopPropagation(); api.close(); }
  });
  if (o.title) box.appendChild(h('h2', { richText: o.title }));
  if (o.html) box.appendChild(h('p', { rich: o.html }));
  else if (o.text) box.appendChild(h('p', { richText: o.text }));
  if (o.body) {
    if (typeof o.body === 'function') { try { o.body(box, api); } catch (e) { console.error(e); } }
    else box.appendChild(o.body);
  }
  (o.actions || []).forEach(function (a) {
    var btn = h('button', { class: 'btn ' + (BTN_KIND[a.kind] || BTN_KIND.soft), type: 'button' }, a.label);
    btn.addEventListener('click', function () {
      var r;
      try { r = a.onClick ? a.onClick(api, btn) : undefined; } catch (e) { console.error(e); }
      if (r !== false) api.close();
    });
    box.appendChild(btn);
  });
  if (o.cancel) {
    box.appendChild(h('button', { class: 'btn btn-soft', type: 'button', onclick: function () { api.close(); } }, o.cancel === true ? 'إلغاء' : o.cancel));
  }
  bg.addEventListener('click', function () { if (o.dismissible !== false) api.close(); });
  host.appendChild(bg);
  host.appendChild(box);
  void box.offsetWidth;
  bg.classList.add('on');
  box.classList.add('on');
  sheetCur = api;
  try { box.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  return api;
}
function closeSheet() { if (sheetCur) sheetCur.close(); }
/* ask({title, text, ok, cancel, danger}) -> Promise<boolean>; replaces confirm() */
function ask(o) {
  o = o || {};
  return new Promise(function (resolve) {
    var answered = false;
    sheet({
      title: o.title, text: o.text, html: o.html, acc: o.acc,
      actions: [{ label: o.ok || 'تمام', kind: o.danger ? 'danger' : 'primary', onClick: function () { answered = true; resolve(true); } }],
      cancel: o.cancel || true,
      onClose: function () { if (!answered) resolve(false); }
    });
  });
}

/* =====================================================================
   8. Navigation: tabs, pushed pages, history
   ===================================================================== */
var TABS = ['today', 'lessons', 'practice', 'cards'];
var TAB_TITLES = { today: 'اليوم', lessons: 'الدروس', practice: 'تدرّب', cards: 'بطاقات' };
var appEl = null, tabbarEl = null;
var curTab = 'today', stack = [], booted = false;
var dirty = { today: true, lessons: true, practice: true, cards: true };
var scrollMem = {};
var histOK = true;
var lastRenderDay = null;

function markDirty() { TABS.forEach(function (t) { dirty[t] = true; }); }
function tabEl(name) { return doc.getElementById('tab-' + name); }
function setInert(el, on) { if (!el) return; if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }

function topbar(o) {
  var start = h('div', { class: 'bar-start' }), end = h('div', { class: 'bar-end' });
  if (o.back != null) {
    start.appendChild(h('button', { class: 'back', type: 'button', 'aria-label': 'رجوع', onclick: function () { back(); } }, icon('back'), h('span', { richText: o.back })));
  }
  return h('header', { class: 'topbar' + (o.large ? ' large' : '') }, start, h('div', { class: 'bar-title', richText: o.title || '' }), end);
}
function updateBar(screen) {
  var bar = screen && screen.firstElementChild;
  if (!bar || !bar.classList.contains('topbar')) return;
  bar.classList.toggle('scrolled', screen.scrollTop > (bar.classList.contains('large') ? 44 : 2));
}
function watchScroll(screen) {
  if (screen.__phScroll) return;
  screen.__phScroll = true;
  screen.addEventListener('scroll', function () { updateBar(screen); }, { passive: true });
}

function tabFrame(el, name) {
  el.textContent = '';
  var title = TAB_TITLES[name];
  var bar = topbar({ title: title, large: true });
  var sub = h('p');
  var body = h('div', { class: 'body' }, h('div', { class: 'lt' }, h('h1', null, title), sub));
  el.appendChild(bar);
  el.appendChild(body);
  return {
    el: el, bar: bar, body: body, sub: sub, title: title,
    start: bar.querySelector('.bar-start'), end: bar.querySelector('.bar-end'),
    setSub: function (t) { sub.textContent = t || ''; },
    refresh: function () { dirty[name] = true; if (curTab === name && !stack.length) renderTab(name); }
  };
}
var TAB_RENDER = {
  today: function (el) { renderToday(el); },
  lessons: function (el) { renderLessons(el); },
  practice: function (el) { renderModuleTab(el, 'practice'); },
  cards: function (el) { renderModuleTab(el, 'cards'); }
};
function renderModuleTab(el, name) {
  var f = tabFrame(el, name);
  var fn = reg.tabs[name];
  if (fn) fn(f.body, f);
  else f.body.appendChild(placeholder('هذا القسم قيد التجهيز.'));
}
function renderTab(name) {
  var el = tabEl(name);
  if (!el) return;
  var top = el.scrollTop;
  dirty[name] = false;
  try { TAB_RENDER[name](el); }
  catch (e) {
    console.error('[App] tab "' + name + '" failed', e);
    el.textContent = '';
    var f = tabFrame(el, name);
    f.body.appendChild(placeholder('حدث خطأ في هذا القسم. أعيدي فتح الصفحة.'));
  }
  el.scrollTop = top;
  updateBar(el);
}
function showTab(name, force) {
  if (TABS.indexOf(name) < 0) return;
  if (stack.length) closeAllPages();
  var prevEl = tabEl(curTab);
  if (prevEl && curTab !== name) scrollMem[curTab] = prevEl.scrollTop;
  TABS.forEach(function (t) { var el = tabEl(t); if (el) el.classList.toggle('on', t === name); });
  if (tabbarEl) {
    var btns = tabbarEl.querySelectorAll('.tab');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].getAttribute('data-tab') === name) btns[i].setAttribute('aria-current', 'page');
      else btns[i].removeAttribute('aria-current');
    }
  }
  var changed = curTab !== name;
  curTab = name;
  var el = tabEl(name);
  if (force || dirty[name] || !el.firstChild) renderTab(name);
  if (changed && hasOwn.call(scrollMem, name)) { el.scrollTop = scrollMem[name]; updateBar(el); }
  if (changed) emit('tab', name);
}
function refresh(name) {
  markDirty();
  if (!booted) return;
  if (name && name !== curTab) return;
  if (!stack.length) renderTab(curTab);
}

function topScreen() { return stack.length ? stack[stack.length - 1].el : tabEl(curTab); }
function runBuild(build, body, handle) {
  try { if (build) build(body, handle); }
  catch (e) {
    console.error('[App] page build failed', e);
    body.appendChild(placeholder('حدث خطأ في هذه الصفحة.'));
  }
}
function swapAcc(el, lec) {
  (el.getAttribute('class') || '').split(/\s+/).forEach(function (c) { if (/^acc-L\d$/.test(c)) el.classList.remove(c); });
  if (lec && accClass(lec)) el.classList.add(accClass(lec));
}
/* openPage(title, build(body, page), {acc, large, back, end, onClose, onShow, className}) -> page handle */
function openPage(title, build, opts) {
  opts = opts || {};
  /* A double tap must not stack the same page twice. */
  var topPage = stack[stack.length - 1];
  if (topPage && topPage.title === title && Date.now() - (topPage.openedAt || 0) < 800) return topPage;
  closeSheet();
  if (!appEl) appEl = doc.getElementById('app');
  if (!tabbarEl) tabbarEl = doc.getElementById('tabbar');
  var under = topScreen();
  var label = opts.back || (under && under.getAttribute('aria-label')) || 'رجوع';
  if (label.length > 18) label = 'رجوع';
  var page = h('section', {
    class: 'screen page' + (opts.acc && accClass(opts.acc) ? ' ' + accClass(opts.acc) : '') + (opts.className ? ' ' + opts.className : ''),
    'aria-label': title || '', tabindex: '-1'
  });
  var bar = topbar({ title: title, large: !!opts.large, back: label });
  var body = h('div', { class: 'body' });
  page.appendChild(bar);
  page.appendChild(body);
  var handle = {
    el: page, body: body, bar: bar, end: bar.querySelector('.bar-end'), title: title,
    onClose: opts.onClose || null, onShow: opts.onShow || null,
    close: function () { if (stack[stack.length - 1] === handle) back(); },
    setTitle: function (t) { handle.title = t; bar.querySelector('.bar-title').innerHTML = richText(t || ''); page.setAttribute('aria-label', t || ''); },
    replace: function (t, b, o) {
      o = o || {};
      handle.setTitle(t);
      if (o.acc) swapAcc(page, o.acc);
      body.textContent = '';
      handle.end.textContent = '';
      page.scrollTop = 0;
      runBuild(b, body, handle);
      updateBar(page);
    }
  };
  if (opts.end) handle.end.appendChild(opts.end);
  runBuild(build, body, handle);
  watchScroll(page);
  appEl.appendChild(page);
  void page.offsetWidth;
  if (under) { under.classList.add('under'); under.classList.add('shift'); setInert(under, true); }
  if (!stack.length && tabbarEl) { tabbarEl.classList.add('shift'); setInert(tabbarEl, true); }
  page.classList.add('in');
  handle.openedAt = Date.now();
  stack.push(handle);
  if (histOK) { try { history.pushState({ phDepth: stack.length }, ''); } catch (e) { histOK = false; } }
  try { page.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  emit('page-open', handle);
  return handle;
}
function closeTop() {
  var p = stack.pop();
  if (!p) return;
  var under = topScreen();
  p.el.classList.remove('in');
  setInert(p.el, true);
  if (under) { under.classList.remove('shift'); setInert(under, false); }
  if (!stack.length && tabbarEl) { tabbarEl.classList.remove('shift'); setInert(tabbarEl, false); }
  setTimeout(function () { if (p.el.parentNode) p.el.parentNode.removeChild(p.el); }, 480);
  closeSheet();
  stopAudio();
  if (p.onClose) { try { p.onClose(p); } catch (e) { console.error(e); } }
  emit('page-close', p);
  if (!stack.length) { if (dirty[curTab]) renderTab(curTab); }
  else {
    var t = stack[stack.length - 1];
    if (t.onShow) { try { t.onShow(t); } catch (e) { console.error(e); } }
  }
}
function back() {
  if (sheetCur) { closeSheet(); return; }
  if (!stack.length) return;
  var depth = stack.length, closing = stack[depth - 1];
  if (histOK && history.state && history.state.phDepth === depth) {
    try { history.back(); } catch (e) { closeTop(); return; }
    setTimeout(function () { if (stack.length === depth && stack[depth - 1] === closing) closeTop(); }, 600);
  } else closeTop();
}
function closeAllPages() {
  var n = stack.length;
  if (!n) return;
  var st = history.state;
  while (stack.length) closeTop();
  if (histOK && st && st.phDepth === n) { try { history.go(-n); } catch (e) { /* ignore */ } }
}

/* =====================================================================
   9. Plan: 7 days from D.planStart, redistributed when she falls behind
   ===================================================================== */
var EMPTY_TASK = { lessons: {}, prac: 0, cards: 0, doneDate: null };
function taskGet(id) { return state.tasks[id] || EMPTY_TASK; }
function taskRec(id) {
  var r = state.tasks[id];
  if (!r) r = state.tasks[id] = { lessons: {}, prac: 0, cards: 0, doneDate: null };
  return r;
}
function lessonDone(id) { return !!state.lessons[id]; }
function explainItems(task) {
  var ls = task.lessons || [];
  if (ls.length) return ls;
  return task.mock ? ['_summary'] : [];
}
function taskProgress(task) {
  if (typeof task === 'string') task = PIDX[task];
  if (!task) return null;
  var r = taskGet(task.id);
  var items = explainItems(task);
  var ex = items.length ? items.filter(function (id) { return r.lessons[id] || (id.charAt(0) !== '_' && state.lessons[id]); }).length / items.length : 1;
  var pr = clamp01((r.prac || 0) / PRAC_GOAL);
  var cd = clamp01((r.cards || 0) / CARD_GOAL);
  var split = task.split || [15, 20, 10];
  var parts = [ex, pr, cd];
  var minutes = split.reduce(function (a, m, i) { return a + m * parts[i]; }, 0);
  var nextPart = ex < 1 ? 'explain' : (pr < 1 ? 'prac' : (cd < 1 ? 'cards' : null));
  return {
    id: task.id, parts: parts, explain: ex, prac: pr, cards: cd, split: split,
    minutes: Math.round(minutes), total: split.reduce(function (a, b) { return a + b; }, 0),
    counts: { prac: r.prac || 0, cards: r.cards || 0 }, goals: { prac: PRAC_GOAL, cards: CARD_GOAL },
    done: !!r.doneDate, doneDate: r.doneDate, started: minutes > 0 || (r.prac || 0) > 0 || (r.cards || 0) > 0, nextPart: nextPart
  };
}
function planInfo() {
  var plan = D.plan || [], t = today(), n = plan.length || 1;
  var since = D.planStart ? daysBetween(D.planStart, t) : 0;
  var idx = Math.max(0, Math.min(n - 1, since));
  var daysLeft = Math.max(1, n - idx);
  var finished = [], unfinished = [];
  plan.forEach(function (p) {
    var r = taskGet(p.id);
    if (r.doneDate) { if (r.doneDate === t) finished.push(p); }
    else unfinished.push(p);
  });
  var perDay = Math.ceil((unfinished.length + finished.length) / daysLeft);
  var take = Math.max(0, perDay - finished.length);
  var ah = state.prefs.ahead;
  var aheadIds = ah && ah.d === t && Array.isArray(ah.ids) ? ah.ids : [];
  var chosen = {};
  finished.forEach(function (p) { chosen[p.id] = 1; });
  unfinished.slice(0, take).forEach(function (p) { chosen[p.id] = 1; });
  unfinished.forEach(function (p) { if (aheadIds.indexOf(p.id) > -1) chosen[p.id] = 1; });
  var list = plan.filter(function (p) { return chosen[p.id]; });
  var open = list.filter(function (p) { return !taskGet(p.id).doneDate; });
  return {
    today: t, dayIndex: idx, daysLeft: daysLeft, perDay: perDay,
    list: list, open: open, current: open[0] || null,
    todayDone: !open.length && unfinished.length > 0, complete: !unfinished.length,
    next: unfinished.filter(function (p) { return !chosen[p.id]; })[0] || null,
    lastDone: finished[finished.length - 1] || null, aheadIds: aheadIds.slice(),
    remaining: unfinished.length, examIn: D.examDate ? daysBetween(t, D.examDate) : 0, beforeStart: since < 0
  };
}
function topicMatch(task, info) {
  var topics = info.topics || (info.topic ? [info.topic] : []);
  if (!topics.length) return false;
  var hit = topics.some(function (x) { return (task.topics || []).indexOf(x) > -1; });
  if (!hit) return false;
  if (task.types && info.type && task.types.indexOf(info.type) < 0) return false;
  return true;
}
function creditTask(kind, info) {
  var pi = planInfo();
  var cand = pi.open;
  if (kind === 'prac') cand = cand.filter(function (t) { return topicMatch(t, info); });
  var t = cand[0];
  if (!t) return null;
  var r = taskRec(t.id);
  r[kind] = Math.min((r[kind] || 0) + 1, kind === 'prac' ? PRAC_GOAL : CARD_GOAL);
  checkDone(t, pi.today);
  return t.id;
}
function checkDone(task, t) {
  var r = taskRec(task.id);
  if (r.doneDate) return false;
  var p = taskProgress(task);
  if (p.parts[0] >= 1 && p.parts[1] >= 1 && p.parts[2] >= 1) {
    r.doneDate = t || today();
    emit('task-done', task);
    setTimeout(function () { toast('أحسنتِ! خلصتِ مهمة «' + task.ar + '».', 3000); }, 60);
    return true;
  }
  return false;
}
function markLesson(id) {
  if (!LIDX[id]) return false;
  var first = !state.lessons[id];
  state.lessons[id] = 1;
  (D.plan || []).forEach(function (p) {
    if ((p.lessons || []).indexOf(id) > -1) { var r = taskRec(p.id); if (!r.doneDate) r.lessons[id] = 1; }
  });
  var pi = planInfo();
  pi.open.forEach(function (p) { checkDone(p, pi.today); });
  save();
  emit('lesson', { id: id, first: first });
  return first;
}
function markSummary() {
  var pi = planInfo(), changed = false;
  pi.open.forEach(function (p) {
    if (!p.mock) return;
    var r = taskRec(p.id);
    if (!r.lessons._summary) { r.lessons._summary = 1; changed = true; checkDone(p, pi.today); }
  });
  if (changed) save();
}
function takeNext() {
  var pi = planInfo();
  if (!pi.next) return null;
  var ids = pi.aheadIds.concat([pi.next.id]);
  state.prefs.ahead = { d: pi.today, ids: ids };
  save();
  refresh('today');
  return pi.next;
}
function firstUnfinishedLesson(task) {
  var r = taskGet(task.id);
  return (task.lessons || []).filter(function (id) { return !r.lessons[id] && !state.lessons[id]; })[0] || null;
}
function partOpen(task, part) {
  if (typeof task === 'string') task = PIDX[task];
  if (!task) return null;
  var r = taskGet(task.id);
  if (part === 'explain') {
    if (!(task.lessons || []).length) return go('summary', { task: task });
    return openLesson(firstUnfinishedLesson(task) || task.lessons[0], { task: task });
  }
  if (part === 'prac') {
    if (task.mock) return go('mock', { task: task });
    return go('practice-task', { task: task, topics: (task.topics || []).slice(), types: task.types ? task.types.slice() : null, goal: PRAC_GOAL, count: r.prac || 0 });
  }
  return go('cards-task', { task: task, topics: (task.topics || []).slice(), goal: CARD_GOAL, count: r.cards || 0 });
}
function startTask(task) {
  if (typeof task === 'string') task = PIDX[task];
  if (!task) return null;
  var p = taskProgress(task);
  return partOpen(task, p.nextPart || 'explain');
}

/* pages by name; modules register their own (see app-api.md) */
var PAGE_TITLES = { mock: 'اختبار تجريبي', mistakes: 'مراجعة الأخطاء', summary: 'ملخص ليلة الاختبار', assignment: 'حل Assignment 2', settings: 'الإعدادات', 'memory-map': 'خريطة الحفظ' };
var PAGE_FALLBACK = {
  'practice-task': function () { showTab('practice'); return null; },
  'cards-task': function () { showTab('cards'); return null; }
};
function go(name, opts) {
  opts = opts || {};
  if (name === 'lesson') return openLesson(opts.id, opts);
  if (TABS.indexOf(name) > -1) { showTab(name); return null; }
  if (name === 'summary') markSummary();
  var fn = reg.pages[name];
  if (fn) {
    try { return fn(opts) || null; }
    catch (e) { console.error('[App] page "' + name + '" failed', e); toast('حدث خطأ. جرّبي مرة ثانية.'); return null; }
  }
  if (PAGE_FALLBACK[name]) return PAGE_FALLBACK[name]();
  return openPage(PAGE_TITLES[name] || '', function (body) { body.appendChild(placeholder('هذه الصفحة قيد التجهيز.')); });
}
function hasPage(name) { return !!reg.pages[name] || name === 'lesson'; }

/* =====================================================================
   10. Today tab
   ===================================================================== */
var animMem = {};
function animScale(el, f, key) {
  f = clamp01(f);
  var from = key && hasOwn.call(animMem, key) ? animMem[key] : 0;
  if (key) animMem[key] = f;
  if (reducedMotion()) from = f;
  el.style.transform = 'scaleX(' + from + ')';
  if (from === f) return;
  requestAnimationFrame(function () { requestAnimationFrame(function () { el.style.transform = 'scaleX(' + f + ')'; }); });
}
function ringEl(split, parts, key) {
  var C = 2 * Math.PI * 48, GAP = split.length > 1 ? 5 : 0, total = split.reduce(function (a, b) { return a + b; }, 0) || 1;
  var CS = C.toFixed(2);
  var root = svg('svg', { viewBox: '0 0 120 120', 'aria-hidden': 'true' });
  var fills = [], start = 0;
  split.forEach(function (m, i) {
    var L = m / total * C, len = Math.max(0, L - GAP), off = (-(start + GAP / 2)).toFixed(2);
    root.appendChild(svg('circle', { class: 'trk', cx: 60, cy: 60, r: 48, 'stroke-dasharray': len.toFixed(2) + ' ' + CS, 'stroke-dashoffset': off }));
    fills.push({ el: svg('circle', { class: 'fil', cx: 60, cy: 60, r: 48, 'stroke-dasharray': '0 ' + CS, 'stroke-dashoffset': off }), len: len, m: m });
    start += L;
  });
  fills.forEach(function (f) { root.appendChild(f.el); });
  var minutesOf = function (fr) { return Math.round(split.reduce(function (a, m, i) { return a + m * fr[i]; }, 0)); };
  var to = parts.map(clamp01);
  var from = key && animMem['ring:' + key] ? animMem['ring:' + key] : [0, 0, 0];
  if (key) animMem['ring:' + key] = to.slice();
  var num = h('b', { class: 'num' }, String(minutesOf(from)));
  function paint(fr) {
    fills.forEach(function (f, i) { f.el.setAttribute('stroke-dasharray', (f.len * clamp01(fr[i])).toFixed(2) + ' ' + CS); });
    num.textContent = String(minutesOf(fr));
  }
  var same = from.every(function (x, i) { return x === to[i]; });
  if (same || reducedMotion()) paint(to);
  else {
    paint(from);
    var t0 = 0, dur = 900;
    var step = function (now) {
      if (!t0) t0 = now;
      var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      paint(from.map(function (x, i) { return x + (to[i] - x) * e; }));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  var mins = minutesOf(to);
  return h('div', { class: 'ring', role: 'img', 'aria-label': 'درستِ ' + mins + ' من ' + total + ' دقيقة' },
    root, h('div', { class: 'ring-c' }, num, h('span', null, 'من ' + total + ' د')));
}
function countdown(n) {
  if (n > 10) return { pre: 'باقي', big: String(n), unit: 'يوم' };
  if (n >= 3) return { pre: 'باقي', big: String(n), unit: 'أيام' };
  if (n === 2) return { pre: 'باقي', big: 'يومين' };
  if (n === 1) return { pre: 'الاختبار', big: 'بكرة' };
  if (n === 0) return { pre: 'الاختبار', big: 'اليوم' };
  return { pre: '', big: 'انتهى', unit: 'الاختبار' };
}
function cdNote(pi) {
  if (pi.examIn < 0) return 'تقدرين تراجعين متى ما بغيتِ.';
  if (pi.examIn === 0) return 'بالتوفيق اليوم!';
  if (pi.complete) return 'خلصتِ الخطة كلها، وباقي المراجعة.';
  if (pi.beforeStart) return 'الخطة تبدأ ' + fmtDate(D.planStart, { weekday: 'long' }) + '، وتقدرين تبدئين من الحين.';
  if (pi.open.length >= 2) return 'اليوم عندكِ ' + plural(pi.open.length, ['مهمة', 'مهمتين', 'مهام', 'مهمة']) + ' لتلحقي بالخطة.';
  return 'الاختبار ' + fmtDate(D.examDate);
}
function summaryCard(pi, task, prog) {
  var lec = task ? task.lec : 'L3';
  var split = (task && task.split) || [15, 20, 10];
  var parts = prog ? prog.parts : [0, 0, 0];
  if (pi.todayDone || pi.complete) parts = [1, 1, 1];
  var cd = countdown(pi.examIn);
  var week = h('div', { class: 'week', 'aria-hidden': 'true' });
  (D.plan || []).forEach(function (p, i) {
    var c = [];
    if (taskGet(p.id).doneDate) c.push('done');
    if (i === pi.dayIndex && pi.examIn > 0 && !pi.beforeStart) c.push('today');
    week.appendChild(h('i', { class: c.join(' ') || null }));
  });
  week.appendChild(icon('flag'));
  return h('section', { class: 'card summary ' + accClass(lec), 'aria-label': 'ملخص اليوم' },
    ringEl(split, parts, task ? task.id : 'none'),
    h('div', null,
      h('p', { class: 'cd-line' }, cd.pre ? h('span', { class: 'pre' }, cd.pre) : null, h('b', { class: 'num' }, cd.big), cd.unit ? h('span', { class: 'unit' }, cd.unit) : null),
      week,
      h('p', { class: 'cd-note' }, cdNote(pi))));
}
function taskCard(pi, task, prog) {
  if (pi.complete) {
    return h('section', { class: 'card tinted task ' + accClass(task ? task.lec : 'L4'), 'aria-label': 'مهمة اليوم' },
      h('p', { class: 'task-done' }, icon('checkFill'), 'خلصتِ الخطة كلها'),
      h('p', { class: 'dim', style: 'font-size:15px;line-height:1.5' }, 'باقي تراجعين أخطاءك وتجربين الاختبار التجريبي.'),
      h('div', { class: 'btn-row', style: 'margin-top:14px' },
        h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { go('mock'); } }, 'اختبار تجريبي'),
        h('button', { class: 'btn btn-soft', type: 'button', onclick: function () { go('mistakes'); } }, 'راجعي الأخطاء')));
  }
  if (pi.todayDone) {
    var nx = pi.next;
    return h('section', { class: 'card tinted task ' + accClass((pi.lastDone || task || {}).lec || 'L3'), 'aria-label': 'مهمة اليوم' },
      h('p', { class: 'task-done' }, icon('checkFill'), 'خلصتِ مهمة اليوم'),
      nx ? h('p', { class: 'dim', style: 'font-size:15px;line-height:1.5', richText: 'مهمة بكرة «' + nx.ar + '». إذا عندكِ وقت، ابدئيها الحين.' }) : null,
      nx ? h('button', { class: 'btn btn-tint', type: 'button', style: 'margin-top:14px', onclick: function () { takeNext(); } }, 'خذي مهمة بكرة') : null);
  }
  if (!task) return placeholder('ما فيه مهمة لليوم.');
  var labels = task.mock ? ['ملخص', 'اختبار', 'بطاقات'] : ['شرح', 'تدريب', 'بطاقات'];
  var keys = ['explain', 'prac', 'cards'];
  var split = prog.split;
  var splitEl = h('div', { class: 'split', style: 'grid-template-columns:' + split.map(function (m) { return m + 'fr'; }).join(' ') });
  split.forEach(function (m, i) {
    var f = prog.parts[i];
    var fillEl = h('span');
    animScale(fillEl, f, 'sg:' + task.id + ':' + i);
    splitEl.appendChild(h('button', {
      class: 'sg' + (f >= 1 ? ' done' : ''), type: 'button',
      'aria-label': labels[i] + '، ' + m + ' دقيقة' + (f >= 1 ? '، خلص' : ''),
      onclick: function () { partOpen(task, keys[i]); }
    }, h('i', null, fillEl), h('b', null, labels[i]), h('small', { class: 'num' }, m + ' د')));
  });
  var also = null;
  if (pi.aheadIds.indexOf(task.id) > -1) also = 'هذه مهمة بكرة، خذيها على راحتكِ.';
  else if (pi.open[1]) also = 'وبعدها: ' + pi.open[1].ar;
  return h('section', { class: 'card tinted task ' + accClass(task.lec), 'aria-label': 'مهمة اليوم' },
    h('div', { class: 'task-head' }, tag(task.lec), h('span', { class: 'task-dur num' }, icon('clock'), prog.total + ' د')),
    h('h2', { richText: task.ar }),
    h('bdi', { class: 'en-pill', dir: 'ltr' }, task.en),
    also ? h('p', { class: 'also', richText: also }) : null,
    splitEl,
    h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { startTask(task); } }, prog.started ? 'كمّلي' : 'ابدئي'));
}
function lecturesCard() {
  return h('div', { class: 'card lectures' }, LECS.map(function (k) {
    var ls = (D.lessons || []).filter(function (L) { return L.lec === k; });
    var dn = ls.filter(function (L) { return lessonDone(L.id); }).length;
    var bar = h('i');
    animScale(bar, ls.length ? dn / ls.length : 0, 'lec:' + k);
    var name = LEC_SHORT[k] || ((D.lectures || {})[k] || {}).ar || k;
    return h('button', {
      class: 'lec ' + k, type: 'button', 'aria-label': k + ' ' + name + '، خلصتِ ' + dn + ' من ' + ls.length,
      onclick: function () { showTab('lessons'); scrollToLec(k); }
    }, tag(k), h('p', { class: 'name' }, name), h('div', { class: 'bar' }, bar),
      h('p', { class: 'st num' }, ls.length && dn === ls.length ? 'خلصت' : dn + ' من ' + ls.length));
  }));
}
function extrasList() {
  var wrong = wrongIds().length;
  return h('div', { class: 'list' },
    row({ title: 'خريطة الحفظ', sub: 'كلمات تشترك في الكتابة والصوت', icon: 'list', iconBg: 'var(--l3-btn)', onClick: function () { go('memory-map'); } }),
    row({ title: 'الحروف الصعبة', sub: 'تدريب المتشابهات', icon: 'compass', iconBg: 'var(--l3-btn)', onClick: function () { go('hard-vowels'); } }),
    row({ title: 'اختبار تجريبي', icon: 'mock', iconBg: 'var(--l2-btn)', onClick: function () { go('mock'); } }),
    row({ title: 'مراجعة الأخطاء', icon: 'redo', iconBg: 'var(--l3-btn)', meta: wrong ? String(wrong) : null, onClick: function () { go('mistakes'); } }),
    row({ title: 'ملخص ليلة الاختبار', icon: 'moon', iconBg: 'var(--l4-btn)', onClick: function () { go('summary'); } }),
    row({ title: ['حل ', h('bdi', { dir: 'ltr' }, 'Assignment 2')], icon: 'doc', iconBg: 'var(--l1-btn)', onClick: function () { go('assignment'); } }),
    row({ title: 'الإعدادات', icon: 'sliders', iconBg: '#8E8E93', onClick: function () { go('settings'); } }));
}
function renderToday(el) {
  var f = tabFrame(el, 'today');
  lastRenderDay = today();
  f.setSub(fmtDate(lastRenderDay));
  bannerNodes().forEach(function (b) { f.body.appendChild(b); });
  var pi = planInfo();
  var plan = D.plan || [];
  var shown = pi.current || pi.lastDone || plan[plan.length - 1] || null;
  var prog = shown ? taskProgress(shown) : null;
  var summaryTask = pi.aheadIds.length ? pi.lastDone : shown;
  var summaryProg = summaryTask ? taskProgress(summaryTask) : null;
  f.body.appendChild(summaryCard(pi, summaryTask, summaryProg));
  f.body.appendChild(taskCard(pi, shown, prog));
  f.body.appendChild(secHead('المحاضرات'));
  f.body.appendChild(lecturesCard());
  f.body.appendChild(secHead('أكثر'));
  f.body.appendChild(extrasList());
}

/* =====================================================================
   11. Lessons tab, lesson page and text blocks
   ===================================================================== */
function renderLessons(el) {
  var f = tabFrame(el, 'lessons');
  var all = D.lessons || [];
  var dnAll = all.filter(function (L) { return lessonDone(L.id); }).length;
  f.setSub('خلصتِ ' + dnAll + ' من ' + all.length);
  /* Guides that live in the Lessons tab but are not lessons: no check mark and
     they never change the done/total counts, the plan or the Today card. */
  var guides = {
    L3: [
      { after: 'l3-long', title: 'الحروف الصعبة', sub: 'تدريب المتشابهات',
        icon: 'compass', iconBg: 'var(--l3-btn)', page: 'hard-vowels' },
      { after: 'l3-long', title: 'خريطة الحفظ', sub: 'كلمات تشترك في الكتابة والصوت',
        icon: 'list', iconBg: 'var(--l3-btn)', page: 'memory-map' }
    ],
    L4: [
      { after: 'l4-rpga', title: 'كيف أكتب النطق؟', sub: 'من الكلمة إلى النطق الكامل',
        icon: 'doc', iconBg: 'var(--l4-btn)', page: 'how-to-transcribe' }
    ]
  };
  LECS.forEach(function (k) {
    var ls = all.filter(function (L) { return L.lec === k; });
    if (!ls.length) return;
    var dn = ls.filter(function (L) { return lessonDone(L.id); }).length;
    var head = h('h2', { class: 'sec-h', id: 'lessons-' + k },
      h('span', { style: 'display:inline-flex;align-items:center;gap:6px' }, tag(k), ((D.lectures || {})[k] || {}).ar || k),
      h('b', { class: 'num' }, dn + ' من ' + ls.length));
    f.body.appendChild(head);
    var guideList = guides[k] || [];
    var items = [];
    ls.forEach(function (L) {
      var done = lessonDone(L.id);
      items.push(row({
        title: L.ar, sub: [L.min + ' د · ', h('bdi', { dir: 'ltr', class: 'en' }, L.en)], check: done,
        onClick: function () { openLesson(L.id); }
      }));
      guideList.forEach(function (guide) {
        if (guide.after !== L.id) return;
        items.push(row({
          title: guide.title, sub: guide.sub, icon: guide.icon, iconBg: guide.iconBg,
          onClick: function () { go(guide.page); }
        }));
      });
    });
    f.body.appendChild(h('div', { class: 'list ' + accClass(k) }, items));
  });
}
function scrollToLec(k) {
  var el = tabEl('lessons'), target = doc.getElementById('lessons-' + k);
  if (!el || !target) return;
  el.scrollTop = Math.max(0, target.offsetTop - 56);
  updateBar(el);
}

function blockPlaceholder() { return placeholder('هذا الجزء قيد التجهيز.'); }
var VOWEL_BLOCKS = { chart: 1, glide: 1, mouth: 1, vdesc: 1, rptable: 1 };
var META_KEYS = { src: 1, en: 1, blocks: 1 };
function blockType(b) {
  var keys = Object.keys(b), i;
  for (i = 0; i < keys.length; i++) { var k = keys[i]; if (CORE_BLOCKS[k] || reg.blocks[k] || VOWEL_BLOCKS[k]) return k; }
  for (i = 0; i < keys.length; i++) if (!META_KEYS[keys[i]]) return keys[i];
  return null;
}
function renderBlock(b, ctx) {
  if (!isObj(b)) return null;
  var type = blockType(b);
  var fn = type ? (CORE_BLOCKS[type] || reg.blocks[type]) : null;
  var node;
  try { node = fn ? fn(b, ctx) : blockPlaceholder(type); }
  catch (e) { console.error('[App] block "' + type + '" failed', e); node = blockPlaceholder(type); }
  if (!node) return null;
  if (b.src) return h('div', { class: 'blk' }, node, h('span', { class: 'src', rich: b.src }));
  if (node.nodeType === 1) { node.classList.add('blk'); return node; }
  return h('div', { class: 'blk' }, node);
}
function renderBlocks(blocks, container, ctx) {
  (blocks || []).forEach(function (b) { var n = renderBlock(b, ctx); if (n) container.appendChild(n); });
  return container;
}
function pickWords(sym, n) {
  var all = lexFor(sym);
  var v = vowel(sym) || {};
  var asg = [].concat((D.assignment || {}).part2 || [], (D.assignment || {}).part3 || []);
  var head = v.head || [];
  function score(e) {
    var w = e.w.toLowerCase();
    return (asg.indexOf(w) > -1 ? 8 : 0) + (head.indexOf(w) > -1 ? 4 : 0) + (hasAudio(w) ? 2 : 0) + (e.ex ? -20 : 0);
  }
  var list = all.slice().sort(function (a, b) { return score(b) - score(a); });
  var good = list.filter(function (e) { return !e.ex; });
  var pick = good.length >= 4 ? good : list;
  return pick.slice(0, n).map(function (e) { return e.w; });
}
CORE_BLOCKS = {
  p: function (b) { return h('p', { class: 'blk-p', rich: b.p }); },
  /* Arabic title at the start (right), English subtitle pushed to the end (left) */
  h: function (b) {
    return h('div', { class: 'blk-h' }, h('h2', { rich: b.h }), b.en ? h('bdi', { class: 't-en', dir: 'ltr', html: b.en }) : null);
  },
  /* one line: Arabic term (right) … English term (left); then the English definition, then the Arabic explanation */
  def: function (b) {
    var d = b.def || [];
    return h('div', { class: 'card def' },
      h('div', { class: 'd-top' }, d[1] ? h('span', { class: 'd-ar', rich: d[1] }) : null, h('bdi', { class: 'd-en', dir: 'ltr', html: d[0] || '' })),
      d[2] ? h('p', { class: 'd-txt', dir: 'ltr', html: d[2] }) : null,
      d[3] ? h('p', { class: 'd-x', rich: d[3] }) : null);
  },
  list: function (b) {
    return h('div', { class: 'card blk-list' }, h('ul', null, (b.list || []).map(function (x) { return h('li', { rich: x }); })));
  },
  table: function (b) {
    var t = b.table || {};
    return h('div', { class: 'card tbl' }, h('table', null,
      t.head ? h('thead', null, h('tr', null, t.head.map(function (c) { return h('th', { rich: c }); }))) : null,
      h('tbody', null, (t.rows || []).map(function (r) { return h('tr', null, r.map(function (c) { return h('td', { rich: c }); })); }))));
  },
  /* stacked cells: English title above the Arabic one (same pattern as tree children) */
  compare: function (b) {
    return h('div', { class: 'compare' }, (b.compare || []).map(function (c) {
      return h('div', { class: 'card cmp' },
        h('b', { html: c.t || '' }),
        c.ar || c.en ? h('em', null, c.ar ? h('span', { rich: c.ar }) : null, c.en ? [' · ', h('bdi', { dir: 'ltr', class: 'en' }, c.en)] : null) : null,
        h('ul', null, (c.items || []).map(function (x) { return h('li', { rich: x }); })));
    }));
  },
  tree: function (b) {
    var t = b.tree || {}, root = t.root || [];
    return h('div', { class: 'card tree' },
      h('div', { class: 't-root' }, root[1] ? h('span', { rich: root[1] }) : null, h('b', { dir: 'ltr', html: root[0] || '' })),
      h('div', { class: 't-kids' }, (t.kids || []).map(function (k) {
        return h('div', { class: 't-kid' },
          h('b', { html: k[0] || '' }), k[1] ? h('em', { rich: k[1] }) : null,
          k[2] ? h('small', { rich: k[2] }) : null, k[3] ? h('code', { html: k[3] }) : null);
      })));
  },
  note: function (b) { return h('div', { class: 'note' }, icon('info'), h('div', { rich: b.note })); },
  more: function (b, ctx) {
    var inner = h('div', { class: 'more-in' });
    renderBlocks(b.blocks || [], inner, ctx);
    return h('details', { class: 'more' }, h('summary', null, h('span', { rich: b.more }), icon('down')), inner);
  },
  words: function (b) {
    var w = b.words, list;
    if (Array.isArray(w)) list = w;
    else if (typeof w === 'string') list = pickWords(vowel(w) ? vowel(w).s : w, 10);
    else list = [];
    return h('div', { class: 'card', style: 'padding:12px' }, h('div', { class: 'wlist' }, list.map(function (x) { return wordChip(x); })));
  },
  spell: function (b) {
    return h('div', { class: 'card spell' }, (b.spell || []).map(function (code) {
      var v = vowel(code);
      if (!v) return null;
      return h('div', { class: 'sp-row' },
        h('div', { class: 'sp-sym', dir: 'ltr' }, h('span', null, v.s), v.name ? h('small', null, v.name) : null),
        h('div', { style: 'min-width:0' },
          v.spell && v.spell.length ? h('div', { class: 'sp-pats' }, v.spell.map(function (p) {
            return h('span', { class: 'sp-pat' }, h('b', null, p[0]), p[1] ? ' ' + p[1] : null);
          })) : null,
          h('div', { class: 'wlist' }, pickWords(v.s, 8).map(function (w) { return wordChip(w); }))));
    }));
  }
};

/* Shared, persisted teaching steps. Horizontal card rails own their swipes. */
function ensureTeachingCSS() {
  if (!doc.getElementById('css-teaching-steps')) doc.head.appendChild(h('style', { id: 'css-teaching-steps', text: `
    .study-page{display:flex;flex-direction:column}.study-page>.topbar{flex:none}
    .study-page>.body{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 16px}
    .study-index{display:flex;align-items:center;gap:8px;flex:none;width:100%;min-height:44px;color:var(--acc-ink);font-size:15px;text-align:start}
    .study-index svg{width:20px;height:20px;flex:none}.study-index-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .study-index-list{margin-top:12px;max-height:65dvh;overflow-y:auto;overscroll-behavior:contain}
    .study-index-list .row{gap:10px;padding-inline:12px}.study-index-list .meta{font-size:13px}
    .study-index-list .row[aria-current="step"]{background:var(--acc-wash)}
    .study-index-number{flex:none;min-width:20px;color:var(--label2);font-size:15px;text-align:center}
    .study-dots{display:flex;justify-content:center;align-items:center;gap:1px;flex:none}
    .study-dot{width:44px;min-height:44px;display:grid;place-items:center}
    .study-dot i{width:7px;height:7px;border-radius:50%;background:var(--fill2)}
    .study-dot[aria-current="step"] i{background:var(--acc-ink);width:18px;border-radius:5px}
    .study-stage{flex:1;min-height:0}.study-title{font-size:22px;font-weight:600;line-height:1.3;margin:0 0 4px}
    .study-bar{flex:none;display:flex;gap:10px;padding:8px 0 calc(12px + env(safe-area-inset-bottom));background:var(--bg)}
    .study-bar .btn{flex:1}.study-stage p{line-height:1.6}.study-stage .sec-h{font-size:21px;font-weight:600}
    .study-bar .study-action{flex:2;padding:8px;font-size:17px}
    .study-page .study-stage{overflow-y:auto;overscroll-behavior:contain}
    .study-rail{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;padding:2px 0 10px;touch-action:pan-x pan-y}
    .study-rail>*{flex:0 0 100%;min-width:0;scroll-snap-align:start;scroll-snap-stop:always;box-sizing:border-box}
    .study-rail-nav{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:14px;color:var(--label2)}
    .study-rail-nav button{min-width:44px;min-height:44px;color:var(--acc-ink)}
    .study-rail-nav .btn{width:auto;font-size:14px;font-weight:500;padding:0 4px}.study-rail-nav>span{flex:1;text-align:center}
  ` }));
}
function teachingSteps(body, page, key, steps, options) {
  options = options || {};
  ensureTeachingCSS();
  page.el.classList.add('study-page');
  var saved = state.prefs.studySteps || (state.prefs.studySteps = {});
  var previous = saved[key];
  var record = previous && typeof previous === 'object' && !Array.isArray(previous) ? previous : { index: previous };
  var views = isObj(record.views) ? record.views : {};
  function resolve(value, fallback) {
    var byId = steps.findIndex(function (s) { return s.id === value; });
    if (byId >= 0) return byId;
    var n = Number(value);
    return value != null && value !== '' && Number.isFinite(n) ? Math.max(0, Math.min(steps.length - 1, Math.floor(n))) : fallback;
  }
  var last = resolve(record.id, resolve(record.index, 0));
  var index = options.initial == null ? last : resolve(options.initial, last);
  var seen = Array.isArray(record.seen) ? record.seen.filter(function (id) { return steps.some(function (s) { return s.id === id; }); }) : [];
  if (previous != null && seen.indexOf(steps[last].id) < 0) seen.push(steps[last].id);
  var label = h('span', { class: 'study-index-label' });
  var header = h('button', { type: 'button', class: 'study-index', 'aria-haspopup': 'dialog', onclick: openIndex }, icon('list'), label);
  var dots = h('nav', { class: 'study-dots', 'aria-label': 'خطوات الشرح' });
  var stage = h('div', { class: 'study-stage' });
  var bar = h('div', { class: 'study-bar' });
  body.appendChild(header); body.appendChild(dots); body.appendChild(stage); body.appendChild(bar);
  function position(i) { return 'القسم ' + (i + 1) + ' من ' + steps.length + ' · ' + steps[i].title; }
  /* Keep the original detail nodes, including live readouts and audio handlers.
     Only teaching steps move their details into a sheet. */
  function sheetDetails() {
    Array.from(stage.querySelectorAll('details')).reverse().forEach(function (detail) {
      var summary = detail.querySelector('summary');
      if (!summary) return;
      var title = summary.textContent.trim();
      var button = h('button', { type: 'button', class: 'study-detail-open', 'aria-haspopup': 'dialog' });
      Array.from(summary.childNodes).forEach(function (node) { button.appendChild(node.cloneNode(true)); });
      var holder = h('div', { class: detail.className + ' study-detail' }, button);
      detail.parentNode.replaceChild(holder, detail);
      button.addEventListener('click', function () {
        detail.open = true;
        var api = sheet({ title: title, body: detail, onClose: function () {
          if (button.isConnected) button.focus({ preventScroll: true });
        } });
        api.el.classList.add('study-detail-sheet', 'vx');
        Array.from(page.el.classList).forEach(function (cls) {
          if (/^acc-/.test(cls)) api.el.classList.add(cls);
        });
        api.el.addEventListener('keydown', function (e) {
          if (e.key !== 'Tab') return;
          var items = Array.from(api.el.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')).filter(function (el) {
            return !el.disabled && el.tabIndex >= 0 && el.getClientRects().length;
          });
          var first = items[0], last = items[items.length - 1];
          if (e.shiftKey && (doc.activeElement === first || doc.activeElement === api.el)) {
            e.preventDefault(); if (last) last.focus();
          } else if (!e.shiftKey && doc.activeElement === last) {
            e.preventDefault(); if (first) first.focus();
          }
        });
      });
    });
  }
  function openIndex() {
    var list = h('div', { class: 'list study-index-list' });
    var api;
    steps.forEach(function (s, i) {
      var item = row({ title: s.title, meta: i === index ? 'أنتِ هنا' : null,
        check: seen.indexOf(s.id) >= 0, chev: false, onClick: function () { api.close(); show(i, true); } });
      item.insertBefore(h('span', { class: 'study-index-number num' }, String(i + 1)), item.firstChild);
      item.setAttribute('data-step-id', s.id);
      if (i === index) item.setAttribute('aria-current', 'step');
      list.appendChild(item);
    });
    api = sheet({ title: 'أقسام الشرح', body: list, cancel: 'إغلاق', onClose: function () { header.focus({ preventScroll: true }); } });
    list.querySelector('[aria-current="step"]').focus({ preventScroll: true });
  }
  function show(n, animate) {
    var old = index; index = resolve(n, index);
    saved = state.prefs.studySteps || (state.prefs.studySteps = {});
    if (seen.indexOf(steps[index].id) < 0) seen.push(steps[index].id);
    saved[key] = { index: index, id: steps[index].id, seen: seen, views: views }; save();
    label.innerHTML = richText(position(index));
    header.setAttribute('aria-label', position(index));
    stage.textContent = ''; bar.textContent = ''; dots.textContent = '';
    dots.appendChild(h('span', { class: 'sr', 'aria-live': 'polite' }, 'الخطوة ' + (index + 1) + ' من ' + steps.length));
    steps.forEach(function (s, i) { dots.appendChild(h('button', { type: 'button', class: 'study-dot',
      'aria-label': 'الخطوة ' + (i + 1) + ': ' + s.title, 'aria-current': i === index ? 'step' : null,
      onclick: function () { show(i, true); } }, h('i', { 'aria-hidden': 'true' }))); });
    stage.appendChild(h('h2', { class: 'study-title', richText: steps[index].title }));
    var stepId = steps[index].id;
    if (!isObj(views[stepId])) views[stepId] = {};
    steps[index].build(stage, views[stepId]);
    sheetDetails();
    if (index) bar.appendChild(h('button', { type: 'button', class: 'btn btn-soft', onclick: function () { show(index - 1, true); } }, 'السابق'));
    bar.appendChild(h('button', { type: 'button', class: 'btn btn-primary' + (index === steps.length - 1 ? ' study-action' : ''), onclick: function () {
      if (index < steps.length - 1) show(index + 1, true); else if (options.done) options.done();
    } }, index < steps.length - 1 ? 'التالي' : (options.action || 'ابدئي')));
    page.el.scrollTop = 0;
    if (animate && !reducedMotion() && stage.animate) stage.animate([
      { transform: 'translateX(' + (index > old ? -24 : 24) + 'px)', opacity: .6 }, { transform: 'translateX(0)', opacity: 1 }
    ], { duration: 200, easing: 'cubic-bezier(.25,1,.5,1)' });
  }
  var start = null;
  stage.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1 || e.target.closest('.study-rail, .chart, .gl-chart, button, input')) { start = null; return; }
    start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (!start || !e.changedTouches.length) return;
    var dx = e.changedTouches[0].clientX - start.x, dy = e.changedTouches[0].clientY - start.y; start = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) show(index + (dx > 0 ? 1 : -1), true);
  }, { passive: true });
  show(index, false);
  if (options.initial == null && index > 0) toast('كمّلتِ من: ' + steps[index].title);
  if (options.openIndex) setTimeout(function () { if (App.topPage() === page) openIndex(); }, 0);
  return { show: show, current: function () { return index; }, openIndex: openIndex };
}

function openLesson(id, opts) {
  var L = LIDX[id];
  if (!L) return null;
  opts = opts || {};
  return openPage(L.ar, function (body, page) { buildLesson(body, page, L, opts); }, { large: ['l3-intro', 'l3-short', 'l3-long', 'l4-intro'].indexOf(id) < 0, acc: L.lec, back: opts.back });
}
function nextLessonInTask(task, cur) {
  var r = taskGet(task.id);
  return (task.lessons || []).filter(function (id) { return id !== cur && !r.lessons[id] && !state.lessons[id]; })[0] || null;
}
function buildLesson(body, page, L, opts) {
  if (['l3-intro', 'l3-short', 'l3-long', 'l4-intro'].indexOf(L.id) >= 0) {
    page.el.classList.add('lesson-steps');
    page.bar.classList.remove('large');
    var views = state.prefs.lessonViews || (state.prefs.lessonViews = {});
    var view = views[L.id] || (views[L.id] = {});
    if (opts.sym && vowel(opts.sym)) view.sym = opts.sym;
    var ctxStep = { lesson: L, lec: L.lec, page: page, task: opts.task || null };
    ctxStep.render = function (blocks, container) { return renderBlocks(blocks, container, ctxStep); };
    function blocksStep(id, title, list) { return { id: id, title: title, build: function (el) { renderBlocks(list, el, ctxStep); } }; }
    var steps;
    if (L.id === 'l3-intro') steps = [
      blocksStep('types', 'أنواع الحروف الصوتية', L.blocks.slice(0, 2)),
      blocksStep('length', 'القصيرة والطويلة', L.blocks.slice(2, 5)),
      blocksStep('quality', 'الطول ونوع الصوت', L.blocks.slice(5, 9)),
      blocksStep('description', 'كيف نصف الحرف؟', L.blocks.slice(9))
    ];
    else if (L.id === 'l4-intro') steps = [
      blocksStep('groups', 'الحروف المزدوجة ومجموعاتها', L.blocks.slice(0, 4)),
      { id: 'glide', title: 'استكشفي الحركة', build: function (el) {
        el.appendChild(widget('glideChart', { group: 'all', sel: view.sym, onSelect: function (it) { view.sym = it.s; view.group = it.g; save(); } }));
        renderBlocks(L.blocks.slice(5), el, ctxStep);
      } }
    ];
    else {
      var spellBlock = L.blocks.filter(function (b) { return b.spell; })[0];
      var codes = spellBlock.spell, set = L.id === 'l3-short' ? 'short' : 'long';
      if (!view.sym || !codes.some(function (code) { return vowel(code).s === view.sym; })) view.sym = vowel(codes[0]).s;
      steps = [
        { id: 'explore', title: 'استكشفي الحرف', build: function (el) {
          renderBlocks([L.blocks[0]], el, ctxStep);
          el.appendChild(widget('vowelChart', { set: set, sel: view.sym, onSelect: function (v) { view.sym = v.s; save(); } }));
        } },
        { id: 'spelling', title: 'كتابته وأمثلته', build: function (el) {
          var content = h('div'), nav = h('div', { class: 'study-rail-nav' });
          function select(n) {
            var i = codes.findIndex(function (c) { return vowel(c).s === view.sym; });
            i = (i + n + codes.length) % codes.length;
            view.sym = vowel(codes[i]).s; save(); content.textContent = ''; nav.textContent = '';
            renderBlocks([{ spell: [codes[i]] }], content, ctxStep);
            if (view.sym === 'ɑː' && L.blocks[4]) renderBlocks([L.blocks[4]], content, ctxStep);
            nav.appendChild(h('button', { type: 'button', onclick: function () { select(-1); } }, 'الحرف السابق'));
            nav.appendChild(h('span', { richText: 'الحرف /' + view.sym + '/ · ' + (i + 1) + ' من ' + codes.length }));
            nav.appendChild(h('button', { type: 'button', onclick: function () { select(1); } }, 'الحرف التالي'));
          }
          el.appendChild(nav); el.appendChild(content); select(0);
        } }
      ];
    }
    teachingSteps(body, page, 'lesson-' + L.id, steps, { initial: opts.initial, openIndex: opts.openIndex, action: 'كمّلي', done: function () {
      var first = markLesson(L.id), nextId = opts.task ? nextLessonInTask(opts.task, L.id) : null;
      if (nextId && LIDX[nextId]) {
        var next = LIDX[nextId];
        page.el.classList.remove('study-page', 'lesson-steps');
        page.replace(next.ar, function (b, p) { buildLesson(b, p, next, opts); }, { acc: next.lec });
      } else { if (first) toast('أحسنتِ! خلصتِ الدرس.'); back(); }
    } });
    return;
  }
  body.appendChild(h('div', { class: 'intro' },
    h('div', { class: 'intro-tags' },
      tag(L.lec),
      L.min ? h('span', { class: 'dim num', style: 'font-size:13px' }, L.min + ' د') : null,
      h('bdi', { class: 'en-pill', dir: 'ltr', style: 'margin-right:auto' }, L.en)),
    h('h1', { richText: L.ar })));
  var ctx = { lesson: L, lec: L.lec, page: page, task: opts.task || null };
  ctx.render = function (blocks, container) { return renderBlocks(blocks, container, ctx); };
  renderBlocks(L.blocks || [], body, ctx);
  var btn = h('button', { class: 'btn btn-primary', type: 'button' }, 'كمّلي');
  btn.addEventListener('click', function () {
    var first = markLesson(L.id);
    var nextId = opts.task ? nextLessonInTask(opts.task, L.id) : null;
    if (nextId && LIDX[nextId]) {
      toast('أحسنتِ! إلى الدرس التالي.');
      var N = LIDX[nextId];
      page.replace(N.ar, function (b2, p2) { buildLesson(b2, p2, N, opts); }, { acc: N.lec });
    } else {
      if (first) toast('أحسنتِ! خلصتِ الدرس.');
      back();
    }
  });
  body.appendChild(h('div', { class: 'blk', style: 'margin-top:28px' }, btn));
}

/* =====================================================================
   12. Environment, banners, service worker
   ===================================================================== */
var ua = navigator.userAgent || '';
var env = (function () {
  var ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var standalone = false;
  try { standalone = !!(navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)); } catch (e) { /* ignore */ }
  var inAppToken = /FBAN|FBAV|FB_IAB|Instagram|Snapchat|WhatsApp|Telegram|Line\/|TikTok|musical_ly|Messenger|MicroMessenger|GSA\//.test(ua);
  var inApp = !standalone && ((ios && (inAppToken || !/Safari\//.test(ua))) || (/Android/.test(ua) && (inAppToken || /; wv\)/.test(ua))));
  var file = location.protocol === 'file:';
  var http = /^https?:$/.test(location.protocol);
  var safari = ios && !inApp && !standalone && !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|DuckDuckGo/.test(ua);
  var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  return { ios: ios, standalone: standalone, inApp: inApp, file: file, http: http, safari: safari, local: local };
})();

var sessionHidden = {};
var swReg = null, swWaiting = null, updateReady = false, reloadOnUpdate = false;
function bannerHidden(id) { return sessionHidden[id] || !!(state.prefs.banners && state.prefs.banners[id]); }
function hideBanner(id, forever) {
  sessionHidden[id] = true;
  if (forever) { state.prefs.banners = state.prefs.banners || {}; state.prefs.banners[id] = 1; save(); }
}
function bannerEl(o) {
  var node = h('div', { class: 'banner', role: 'note' }, icon(o.icon));
  var txt = h('div', { class: 'b-txt' }, h('div', { rich: o.html }));
  if (o.actions && o.actions.length) {
    txt.appendChild(h('div', { class: 'b-act' }, o.actions.map(function (a) {
      return h('button', { type: 'button', onclick: function () { a.onClick(node); } }, a.label);
    })));
  }
  node.appendChild(txt);
  if (o.dismiss) {
    node.appendChild(h('button', {
      class: 'b-x', type: 'button', 'aria-label': 'إخفاء',
      onclick: function () { hideBanner(o.id, o.dismiss === 'forever'); if (node.parentNode) node.parentNode.removeChild(node); }
    }, icon('close')));
  }
  return node;
}
function cleanUrl() { try { var u = new URL(location.href); u.search = ''; u.hash = ''; return u.href; } catch (e) { return location.href; } }
function copyText(text) {
  function fallback() {
    var ta = h('textarea', { readonly: true, style: 'position:fixed;top:-100px;opacity:0' });
    ta.value = text;
    doc.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
    doc.body.removeChild(ta);
    return ok;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
  }
  return Promise.resolve(fallback());
}
function copyLink() {
  var url = cleanUrl();
  copyText(url).then(function (ok) {
    if (ok) { toast('نسختُ الرابط.'); return; }
    sheet({
      title: 'انسخي الرابط', text: 'اضغطي على الرابط مطوّلًا وانسخيه، ثم الصقيه في Safari.',
      body: function (box) { var ta = h('textarea', { readonly: true }); ta.value = url; box.appendChild(ta); },
      cancel: 'تم'
    });
  });
}
function bannerNodes() {
  var out = [];
  if (updateReady && !bannerHidden('update')) {
    out.push(bannerEl({ id: 'update', icon: 'refresh', html: 'فيه تحديث جديد للتطبيق.', dismiss: 'session', actions: [{ label: 'حدّثي', onClick: applyUpdate }] }));
  }
  if (env.inApp && !bannerHidden('inapp')) {
    out.push(bannerEl({
      id: 'inapp', icon: 'compass', dismiss: 'session',
      html: 'افتحي الرابط في <bdi>Safari</bdi> لحفظ تقدّمكِ وتشغيل الأصوات بدون إنترنت. من القائمة ⋯ أو زر المشاركة اختاري «فتح في <bdi>Safari</bdi>».',
      actions: [{ label: 'انسخي الرابط', onClick: copyLink }]
    }));
  }
  if (env.file && !bannerHidden('file')) {
    out.push(bannerEl({
      id: 'file', icon: 'warn', dismiss: 'session',
      html: 'هذه نسخة محفوظة على جهازكِ. قد لا تحفظ تقدّمكِ أو تشغّل الأصوات. افتحي الرابط الأصلي في <bdi>Safari</bdi>.'
    }));
  }
  if (!storageOK && !env.inApp && !env.file && !bannerHidden('storage')) {
    out.push(bannerEl({
      id: 'storage', icon: 'warn', dismiss: 'session',
      html: 'هذا المتصفح لا يحفظ التقدّم. سيضيع تقدّمكِ عند إغلاق الصفحة.'
    }));
  }
  if (env.safari && env.http && !bannerHidden('a2hs')) {
    var hp = hasProgress();
    out.push(bannerEl({
      id: 'a2hs', icon: 'share', dismiss: 'forever',
      html: 'أضيفي التطبيق للشاشة الرئيسية: زر المشاركة ثم «إضافة إلى الشاشة الرئيسية». ' +
        (hp ? 'لا ينتقل تقدّمكِ تلقائيًا. صدّريه من الإعدادات، ثم استورديه في تطبيق الشاشة الرئيسية.' : 'أضيفيه قبل البدء، فالتقدّم لا ينتقل تلقائيًا بينهما.'),
      actions: hp ? [{ label: 'الإعدادات', onClick: function () { go('settings'); } }] : []
    }));
  }
  return out;
}
function setUpdate(worker) {
  if (worker) swWaiting = worker;
  if (updateReady) return;
  updateReady = true;
  if (booted) refresh('today');
}
function applyUpdate() {
  if (swWaiting) {
    reloadOnUpdate = true;
    try { swWaiting.postMessage({ type: 'skip-waiting' }); } catch (e) { location.reload(); return; }
    setTimeout(function () { location.reload(); }, 3000);
  } else location.reload();
}
function registerSW() {
  if (!('serviceWorker' in navigator) || !env.http) return;
  var forced = /[?&]sw=1\b/.test(location.search);
  if (env.local && !forced) return;
  var sw = navigator.serviceWorker;
  sw.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.type === 'sw-updated') { if (reloadOnUpdate) location.reload(); else setUpdate(null); }
  });
  sw.addEventListener('controllerchange', function () { if (reloadOnUpdate) location.reload(); });
  sw.register('./sw.js', { scope: './' }).then(function (r) {
    swReg = r;
    if (r.waiting && sw.controller) setUpdate(r.waiting);
    r.addEventListener('updatefound', function () {
      var w = r.installing;
      if (!w) return;
      w.addEventListener('statechange', function () { if (w.state === 'installed' && sw.controller) setUpdate(w); });
    });
  }).catch(function (e) { console.warn('[App] service worker not registered', e); });
}

/* =====================================================================
   13. Boot
   ===================================================================== */
var readyFns = [];
function onReady(fn) { if (booted) { try { fn(); } catch (e) { console.error(e); } } else readyFns.push(fn); }
function boot() {
  if (booted) return;
  appEl = doc.getElementById('app');
  tabbarEl = doc.getElementById('tabbar');
  toastEl = doc.getElementById('toast');
  if (!appEl) return;
  booted = true;
  applyTheme(getTheme());
  TABS.forEach(function (t) { var el = tabEl(t); if (el) watchScroll(el); });
  if (tabbarEl) {
    tabbarEl.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.tab') : null;
      if (!b) return;
      var name = b.getAttribute('data-tab');
      if (name === curTab && !stack.length) {
        var el = tabEl(name);
        try { el.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }); } catch (err) { el.scrollTop = 0; }
        return;
      }
      showTab(name);
    });
  }
  try { history.replaceState({ phDepth: 0 }, ''); } catch (e) { histOK = false; }
  window.addEventListener('popstate', function (e) {
    if (sheetCur && stack.length && (!e.state || e.state.phDepth === stack.length - 1)) { closeSheet(); try { history.pushState({ phDepth: stack.length }, ''); } catch (err) { /* ignore */ } return; }
    var d = e.state && typeof e.state.phDepth === 'number' ? e.state.phDepth : 0;
    closeSheet();
    while (stack.length > d) closeTop();
    if (d > stack.length) { try { history.replaceState({ phDepth: stack.length }, ''); } catch (err) { /* ignore */ } }
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (sheetCur) closeSheet(); else if (stack.length) back();
  });
  doc.addEventListener('visibilitychange', function () {
    if (doc.hidden) { stopAudio(); return; }
    if (lastRenderDay && lastRenderDay !== today()) refresh();
  });
  window.addEventListener('pagehide', stopAudio);
  window.addEventListener('pageshow', function (e) { if (e.persisted) refresh(); });
  if (motionMQ && motionMQ.addEventListener) motionMQ.addEventListener('change', function () { animMem = {}; });
  if (window.matchMedia) {
    try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { emit('theme', getTheme()); }); } catch (e) { /* old Safari */ }
  }
  loadAudioList();
  registerSW();
  showTab('today', true);
  readyFns.splice(0).forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
  emit('boot');
}
if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
else setTimeout(boot, 0);

/* =====================================================================
   14. Public API (documented in content/app-api.md)
   ===================================================================== */
App.version = 'core-1';
App.D = D;
Object.defineProperty(App, 'state', { enumerable: true, get: function () { return state; } });
Object.defineProperty(App, 'env', { enumerable: true, get: function () { return env; } });

/* DOM + text */
App.h = h; App.el = h; App.svg = svg; App.icon = icon; App.icons = Object.keys(ICONS);
App.esc = esc; App.normIPA = normIPA; App.plural = plural;
App.shuffle = shuffle; App.sample = sample; App.reducedMotion = reducedMotion;
App.en = enHTML; App.ipa = ipaHTML; App.pg = pgHTML; App.ipaEl = ipaEl; App.enEl = enEl;
App.rich = rich; App.richText = richText; App.richify = richify; App.srcEl = srcEl; App.pgEl = pgEl;

/* dates */
App.today = today; App.daysBetween = daysBetween; App.fmtDate = fmtDate;

/* data views */
App.lex = LEX; App.lexWord = lexWord; App.lexFor = lexFor; App.lexFrame = lexFrame;
App.spellHTML = spellHTML; App.spellNode = spellNode;
App.vowel = vowel; App.vowelKind = vowelKind; App.descLine = descLine; App.descAr = descAr;
App.lesson = function (id) { return LIDX[id] || null; };
App.lecName = function (lec) { return ((D.lectures || {})[lec] || {}).ar || lec; };
App.lecShort = function (lec) { return LEC_SHORT[lec] || lec; };
App.acc = accClass; App.tag = tag;

/* state */
App.getState = function () { return state; };
App.save = save; App.hasProgress = hasProgress;
App.storageOK = function () { return storageOK && lastSaveOK; };
App.exportState = exportState; App.importState = importState; App.resetState = resetState;
App.qStatus = qStatus; App.countStatus = countStatus; App.wrongIds = wrongIds; App.statusLabel = statusLabel;
App.recordAnswer = recordAnswer; App.recordCard = recordCard; App.cardBox = cardBox;
App.markLesson = markLesson; App.lessonDone = lessonDone;

/* plan */
App.plan = {
  info: planInfo, progress: taskProgress, start: startTask, open: partOpen, takeNext: takeNext,
  task: function (id) { return PIDX[id] || null; }, PRAC_GOAL: PRAC_GOAL, CARD_GOAL: CARD_GOAL
};

/* theme */
App.getTheme = getTheme; App.setTheme = setTheme;

/* registry + navigation */
App.registerBlock = registerBlock; App.registerWidget = registerWidget;
App.registerTab = registerTab; App.registerPage = registerPage;
App.widget = widget; App.hasWidget = hasWidget; App.hasPage = hasPage;
App.renderBlocks = function (blocks, container, ctx) { return renderBlocks(blocks, container, ctx || {}); };
App.openPage = openPage; App.back = back; App.closeAllPages = closeAllPages;
App.teachingSteps = teachingSteps;
/* A shared last choice for the two word-practice entry screens. */
App.chooseRound = function (page, start, explanation) {
  var prefs = state.prefs.practice || (state.prefs.practice = {});
  var size = [5, 10, 15].indexOf(prefs.roundLength) >= 0 ? prefs.roundLength : 10;
  page.body.textContent = '';
  var choices = h('div', { class: 'round-segments', role: 'group', 'aria-label': 'عدد الكلمات' });
  function paint() {
    choices.textContent = '';
    [5, 10, 15].forEach(function (n) {
      choices.appendChild(h('button', { type: 'button', 'aria-pressed': n === size ? 'true' : 'false',
        'aria-label': n + ' كلمات', onclick: function () { size = n; prefs.roundLength = n; save(); paint(); }
      }, String(n)));
    });
  }
  paint();
  page.body.appendChild(h('section', { class: 'card round-choice' }, h('h2', null, 'كم كلمة؟'),
    h('div', { class: 'round-size' }, choices, h('span', null, 'كلمة')),
    h('p', null, explanation), h('button', { type: 'button', class: 'btn btn-primary', onclick: function () {
      prefs.roundLength = size; save(); start(size);
    } }, 'ابدئي')));
};
onReady(ensureTeachingCSS);
App.topPage = function () { return stack[stack.length - 1] || null; };
App.go = go; App.openLesson = openLesson;
App.showTab = showTab; App.currentTab = function () { return curTab; }; App.refresh = refresh;
App.on = on; App.off = off; App.onReady = onReady;

/* UI */
App.sheet = sheet; App.closeSheet = closeSheet; App.ask = ask; App.toast = toast;
App.clueRow = clueRow; App.refChip = refChip;
App.placeholder = placeholder; App.row = row; App.secHead = secHead; App.stateChip = stateChip;
App.wordChip = wordChip; App.speakButton = speakButton; App.copyText = copyText;

/* audio */
App.playWord = playWord; App.playVowel = playVowel; App.hasAudio = hasAudio; App.hasVowelAudio = hasVowelAudio; App.vowelWord = vowelWord; App.canPlayVowel = canPlayVowel;
App.audio = {
  ready: loadAudioList, prime: prime, stop: stopAudio, downloadAll: downloadAll, stats: audioStats,
  persist: persist, persisted: persisted, urls: audioUrls, CACHE: AUDIO_CACHE
};
})();
