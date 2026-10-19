/* app-vowels.js — vowel explorer, animated mouth and glide charts.
   Contract: content/app-api.md. Copy: content/copy-guide.md.

   Lesson blocks: chart ('short'|'long'|'all'), glide ('all'|'centring'|'closing-i'|'closing-u'|'tri'),
                  mouth ('label'), vdesc (true), rptable (true).

   Widgets — App.widget(name, opts):
     vowelChart  {set:'short'|'long'|'all', sel?:sym|code, onSelect?(vowelRecord), lec?:'L3'}
                 → explorer node; node.api.select(symOrCode)
     mouth       {sym?:sym|code|{h,f,r}, labels?:true, big?:false, lec?}
                 → node; node.api.set(symOrCode | {h:0-100, f:0-100, r:0-1}, instant?)
     glideChart  {group:'all'|'centring'|'closing-i'|'closing-u'|'tri', sel?:sym, lec?}
                 → node; node.api.select(sym)
     miniChart   (alias: hintChart) — practice hint: ONE position dot and NO symbols.
       App.widget('miniChart', 'uh')                         vowel code or symbol, as a string
       App.widget('miniChart', { sym: 'ʊ' })                 monophthong → one dot;
                                                             diphthong ('aɪ' or 'ay') → start dot + arrow, no symbols
       App.widget('miniChart', { h: 25, f: 61 })             Roach chart numbers: h 0 = high … 100 = low,
                                                             f 0 = front … 100 = back (f is relative to the slanted front edge)
       App.widget('miniChart', { h: 'mid-high', f: 'back' }) the lecturer's words (high, mid-high, mid, mid-low, low;
                                                             front, central, back)
       optional keys: { lec: 'L3' } (accent colour), { label: 'aria label' }
       Returns <div class="vx vx-mini">; node.api.set(sameKindOfArg) moves the dot without rebuilding. */
(function () {
'use strict';
var App = window.App;
if (!App) return;
var D = App.D || window.PH || {};
var h = App.h, S = App.svg;

/* =====================================================================
   1. Small helpers
   ===================================================================== */
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
function f1(n) { return Math.round(n * 10) / 10; }
function P2(p) { return f1(p[0]) + ' ' + f1(p[1]); }
function C(x, y) { var p = [x, y]; p.c = 1; return p; }        /* sharp corner in cr() */
function cc(p) { var q = [p[0], p[1]]; q.c = 1; return q; }
function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function reduced() { return App.reducedMotion(); }
function ar(key) { return (D.articulators || {})[key] || [key, key]; }
function isNum(x) { return typeof x === 'number' && isFinite(x); }
function setD(el, d) { if (el.__d !== d) { el.__d = d; el.setAttribute('d', d); } }

/* Smooth path through points (Catmull-Rom → cubic Bézier). Points marked with .c are sharp corners. */
function cr(pts, closed, cont) {
  var n = pts.length;
  if (!n) return '';
  var d = cont ? '' : 'M' + P2(pts[0]);
  var segs = closed ? n : n - 1, k = 1 / 6;
  for (var i = 0; i < segs; i++) {
    var p1 = pts[i], p2 = pts[(i + 1) % n];
    var p0 = closed ? pts[(i - 1 + n) % n] : pts[Math.max(0, i - 1)];
    var p3 = closed ? pts[(i + 2) % n] : pts[Math.min(n - 1, i + 2)];
    var ax = p1.c ? 0 : (p2[0] - p0[0]) * k, ay = p1.c ? 0 : (p2[1] - p0[1]) * k;
    var bx = p2.c ? 0 : (p3[0] - p1[0]) * k, by = p2.c ? 0 : (p3[1] - p1[1]) * k;
    d += 'C' + f1(p1[0] + ax) + ' ' + f1(p1[1] + ay) + ' ' + f1(p2[0] - bx) + ' ' + f1(p2[1] - by) + ' ' + P2(p2);
  }
  return closed ? d + 'Z' : d;
}
function bz(p0, p1, p2, p3, t) {
  var u = 1 - t;
  return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
          u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
}
function bzC(a, b, c) { return 'C' + P2(a) + ' ' + P2(b) + ' ' + P2(c); }
function dist(a, b) { var dx = a[0] - b[0], dy = a[1] - b[1]; return Math.sqrt(dx * dx + dy * dy); }
function dSeg(p, a, b) {
  var vx = b[0] - a[0], vy = b[1] - a[1], L = vx * vx + vy * vy;
  var t = L ? clamp(((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L, 0, 1) : 0;
  return dist(p, [a[0] + vx * t, a[1] + vy * t]);
}
function dPoly(p, pts, closed) {
  var best = Infinity, n = pts.length;
  for (var i = 0; i < n - (closed ? 0 : 1); i++) best = Math.min(best, dSeg(p, pts[i], pts[(i + 1) % n]));
  return n === 1 ? dist(p, pts[0]) : best;
}
function inside(p, pts) {
  var c = false;
  for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    var a = pts[i], b = pts[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}

/* One rAF loop for every running animation. Each item: tick(dt) → true while it still moves. */
var ticker = (function () {
  var list = [], raf = 0, last = 0;
  function loop(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    for (var i = list.length - 1; i >= 0; i--) {
      var o = list[i], keep = false;
      try { keep = o.tick(dt); } catch (e) { console.error('[vowels]', e); }
      if (!keep) list.splice(i, 1);
    }
    if (list.length) raf = requestAnimationFrame(loop); else { raf = 0; last = 0; }
  }
  return {
    add: function (o) { if (list.indexOf(o) < 0) list.push(o); if (!raf) raf = requestAnimationFrame(loop); },
    remove: function (o) { var i = list.indexOf(o); if (i > -1) list.splice(i, 1); }
  };
})();

/* Critically-damped-ish springs over named values. cfg[key] = [stiffness, dampingRatio, epsilon]. */
function Springs(vals, cfg, onFrame) {
  this.cur = {}; this.vel = {}; this.tgt = {}; this.cfg = cfg; this.onFrame = onFrame; this.running = false;
  for (var k in vals) { this.cur[k] = this.tgt[k] = vals[k]; this.vel[k] = 0; }
}
Springs.prototype.to = function (t, instant) {
  for (var k in t) if (k in this.tgt && isNum(t[k])) this.tgt[k] = t[k];
  if (instant || reduced()) {
    for (var j in this.tgt) { this.cur[j] = this.tgt[j]; this.vel[j] = 0; }
    if (this.running) { ticker.remove(this); this.running = false; }
    this.onFrame(this.cur);
    return;
  }
  if (!this.running) { this.running = true; ticker.add(this); }
};
Springs.prototype.tick = function (dt) {
  var moving = false, n = Math.max(1, Math.ceil(dt * 240)), hdt = dt / n;
  for (var k in this.tgt) {
    var c = this.cfg[k] || this.cfg._, ks = c[0], kd = 2 * Math.sqrt(ks) * c[1], eps = c[2];
    var x = this.cur[k], v = this.vel[k], t = this.tgt[k];
    for (var i = 0; i < n; i++) { v += (-ks * (x - t) - kd * v) * hdt; x += v * hdt; }
    if (Math.abs(x - t) < eps && Math.abs(v) < eps * 12) { x = t; v = 0; } else moving = true;
    this.cur[k] = x; this.vel[k] = v;
  }
  this.onFrame(this.cur);
  if (!moving) this.running = false;
  return moving;
};

function waapi(el, frames, opts) {
  if (reduced() || !el || typeof el.animate !== 'function') return;
  try { el.animate(frames, opts); } catch (e) { /* old engine */ }
}

/* =====================================================================
   2. CSS (injected once, on first render)
   ===================================================================== */
var CSS = [
  /* readout */
  '.vx .ro-main{min-width:0}',
  '.vx-symrow{display:flex;align-items:center;gap:0;min-width:0;max-width:100%}',
  '.vx .ro-sym{white-space:nowrap}',
  '.vx-vs.speak{background:transparent;position:relative;margin-inline-start:2px}',
  '.vx-vs.speak::before{content:"";position:absolute;inset:7px;border-radius:50%;background:var(--fill)}',
  '.vx-vs.speak svg{position:relative;width:16px;height:16px}',
  '.vx button.word{display:block;padding:0;border:0;background:none;cursor:pointer;flex:1 1 auto;max-width:100%}',
  '.vx .word b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  '.vx .word b mark{color:var(--acc-ink)}',
  '.vx .ro-word{min-width:0;max-width:100%}',
  '.vx-sub{display:block;font-size:13px;color:var(--label2);line-height:1.35;margin-top:2px}',
  '.vx .feat div{display:flex;flex-direction:column;justify-content:center;transition:background .25s}',
  '.vx .feat b{white-space:normal;overflow:visible;line-height:1.22;font-size:12.5px}',
  '.vx .feat span{margin-top:2px}',
  '.vx .exam-line{unicode-bidi:isolate}',
  '.vx .exam-line .vx-gl-to{color:var(--label2);font-weight:500}',
  '.vx .ro-more summary{display:flex;align-items:center;gap:6px}',
  '.vx .ro-more summary svg{width:12px;height:12px;transition:transform .2s}',
  '.vx .ro-more[open] summary svg{transform:rotate(180deg)}',
  '.vx .rm-in p + p{margin-top:6px}',
  '.vx .rm-in .t-pg{margin-top:6px}',
  '.vx .rm-in .wlist{margin:2px 0 8px}',
  '.vx .rm-in .sp-pats{margin:6px 0 2px}',
  /* chart */
  '.vx .vm.other circle{fill:var(--bg);stroke:var(--label3);stroke-width:1.4}',
  '.vx .vm.other text{fill:var(--label);font-weight:600}',
  '.vx .vm.sel circle{fill:var(--acc-btn);stroke:none}',
  '.vx .vm.sel text{fill:#fff}',
  '.vx .chart:focus-visible{outline:2px solid var(--tint);outline-offset:4px;border-radius:12px}',
  '.vx-legend{position:absolute;left:1.5%;bottom:1.5%;display:grid;gap:4px;direction:rtl;pointer-events:none;font-size:11px;line-height:1.2;color:var(--label2)}',
  '.vx-legend span{display:flex;align-items:center;gap:5px}',
  '.vx-legend i{display:block;width:11px;height:11px;border-radius:50%;flex:none;box-sizing:border-box}',
  '.vx-legend .lf{background:var(--acc-wash)}',
  '.vx-legend .lo{border:1.4px solid var(--label3);background:var(--bg)}',
  '.vx-legend bdi{color:var(--label3);direction:ltr}',
  '.vx .ex-head{min-height:30px}',
  '.vx .explore{margin-inline:0}',
  '.vx .ex-head .text-btn{display:inline-flex;align-items:center;gap:4px;min-height:44px;margin:-8px -8px -8px 0;padding:0 8px;font-size:15px}',
  '.vx .ex-head .text-btn svg{width:17px;height:17px}',
  '.vx .ex-row.vx-n3{grid-template-columns:repeat(3,1fr)}',
  '.vx .ex-row.vx-n2{grid-template-columns:repeat(2,1fr)}',
  '.vx .ex{font-family:var(--font)}',
  '.vx .ex.vx-long{font-size:17px}',
  /* glide chart */
  '.vx .chart.vx-glchart{touch-action:manipulation;cursor:pointer}',
  '.vx .gl-arrow{stroke-linejoin:round}',
  '.vx .gl-head{stroke:none}',
  '.vx .vx-glchart.vx-has .gl-arrow:not(.sel),.vx .vx-glchart.vx-has .gl-head:not(.sel){opacity:.34}',
  '.vx .vx-glchart.vx-has .gl-dot:not(.sel),.vx .vx-glchart.vx-has .gl-lab:not(.sel){opacity:.6}',
  '.vx .vx-gl .gl-lab{font-size:13.5px}',
  '.vx .vx-ref circle{fill:none;stroke:var(--label3);stroke-width:1;stroke-dasharray:2 3;opacity:.7}',
  '.vx .vx-ref text{font-family:var(--font);font-size:15px;font-weight:700;fill:var(--label3);text-anchor:middle;dominant-baseline:central}',
  '.vx .vx-ref.vx-main text{fill:var(--label);font-size:17px}',
  '.vx .vx-ref.vx-main circle{opacity:1}',
  '.vx .gl-dot.sel{fill:var(--acc-btn)}',
  '.vx-gl-grp{display:block;margin-top:-4px;font-size:14px;font-weight:500;color:var(--label2)}',
  /* mouth */
  '.vx .mouth{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;cursor:pointer}',
  '.vx .mouth svg{touch-action:manipulation;overflow:hidden;border-radius:14px}',
  '.vx-m-soft{opacity:.5}',
  '.vx-m-nasal{opacity:.62}',
  '.vx-tg0{stop-color:var(--tongue)}',
  '.vx-tg1{stop-color:var(--skin)}',
  '.vx-m-epi{fill:var(--skin);stroke:var(--skin-line);stroke-width:1.1;stroke-linejoin:round}',
  '.vx-m-ala{fill:var(--skin);stroke:var(--skin-line);stroke-width:1;stroke-linejoin:round}',
  '.vx .m-label{max-width:none}',
  '.vx .m-label span{margin-top:1px}',
  '.vx .m-peak,.vx .m-peak-ring{transition:opacity .2s}',
  '.vx .mouth.vx-nopeak .m-peak,.vx .mouth.vx-nopeak .m-peak-ring{opacity:0}',
  '.vx .mouth-big .m-cap{align-items:baseline}',
  '.vx .mouth-big .m-cap .vx-hint{color:var(--label3)}',
  '.vx .mouth-big .m-cap bdi{direction:ltr;color:var(--label2)}',
  '.vx-parts{margin:4px 6px 0}',
  '.vx-plist{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:4px 0 6px}',
  '.vx-pbtn{min-height:48px;padding:5px 4px;border-radius:11px;background:var(--fill);text-align:center;line-height:1.2;transition:background .18s,color .18s}',
  '.vx-pbtn b{display:block;font-size:13px;font-weight:600}',
  '.vx-pbtn span{display:block;margin-top:2px;font-size:11px;color:var(--label2);direction:ltr}',
  '.vx-pbtn[aria-pressed="true"]{background:var(--acc-wash);color:var(--acc-ink)}',
  '.vx-pbtn[aria-pressed="true"] span{color:var(--acc-ink)}',
  '.vx-pbtn:active{transform:scale(.97)}',
  /* mini chart (practice hint) */
  '.vx-mini{position:relative;width:100%;max-width:340px;margin:0 auto;aspect-ratio:360/262;direction:ltr;pointer-events:none;-webkit-user-select:none;user-select:none}',
  '.vx-mini svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}',
  '.vx-mini .vx-dot{fill:var(--acc-btn)}',
  '.vx-mini .vx-ring{fill:var(--acc-wash)}',
  '.vx-mini .vx-dot2{fill:var(--bg);stroke:var(--acc-btn);stroke-width:2}',
  '.vx-mini .vx-arr{fill:none;stroke:var(--acc);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}',
  '.vx-mini .vx-arrh{fill:var(--acc)}',
  /* vdesc */
  '.vx-vd .vdesc{padding:12px 12px 10px}',
  '.vx-vd .vdesc div{display:flex;flex-direction:column;align-items:center}',
  '.vx-vd .vdesc i{display:grid;place-items:center;width:20px;height:20px;margin-bottom:6px;border-radius:10px;background:var(--acc-wash);color:var(--acc-ink);font-style:normal;font-size:12px;font-weight:700}',
  '.vx-vd .vdesc b{line-height:1.25}',
  '.vx-vd .vdesc small{margin-top:auto;padding-top:6px}',
  '.vx-vd-ex{margin:0 12px 12px;padding:9px 12px;border-radius:10px;background:var(--fill);font-size:14px;line-height:1.5}',
  '.vx-vd-ex span{display:block;font-size:13px;color:var(--label2)}',
  '.vx-vd-ex p{margin-top:2px;text-align:left;font-size:15px;font-weight:600}',
  '.vx-vd-ex p b{color:var(--acc-ink)}',
  /* RP table */
  '.vx-rp{padding:2px 0 4px}',
  '.vx-rp-h{display:flex;align-items:baseline;gap:8px;margin:16px 2px 8px;font-size:14px;font-weight:600}',
  '.vx-rp-h:first-child{margin-top:4px}',
  '.vx-rp-h bdi{margin-right:auto;font-size:12px;font-weight:500;color:var(--label2);direction:ltr}',
  '.vx-rp-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;direction:ltr}',
  '.vx-rp-t{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:68px;padding:6px 3px;border-radius:12px;background:var(--raised);text-align:center;color:var(--label);font:inherit;transition:background .2s,transform .15s}',
  '.vx-rp-t b{font-size:21px;font-weight:600;line-height:1.15;color:var(--acc-ink)}',
  '.vx-rp-t span{font-size:13px;line-height:1.2;word-break:break-word}',
  '.vx-rp-t i{font-style:normal;font-size:11px;color:var(--label2);line-height:1.2}',
  '.vx-rp-t svg{position:absolute;top:6px;right:6px;width:11px;height:11px;color:var(--acc-ink);opacity:.75}',
  'button.vx-rp-t:active{transform:scale(.96)}',
  '.vx-rp-t.playing{background:var(--acc-wash)}',
  '.vx-rp-t:disabled{cursor:default}'
].join('\n');
var cssDone = false;
function ensureCSS() {
  if (cssDone) return;
  cssDone = true;
  if (document.getElementById('css-vowels')) return;
  var st = document.createElement('style');
  st.id = 'css-vowels';
  st.textContent = CSS;
  document.head.appendChild(st);
}

/* =====================================================================
   3. Data views
   ===================================================================== */
var MONO = D.vowels || [];
var DIPH = D.diphthongs || [];
var BYSYM = {};
MONO.forEach(function (v) { BYSYM[v.s] = v; BYSYM[v.c] = v; });
/* lip shape per vowel: −1 spread … 0 neutral … 1 fully rounded (from the slides' detailed lines) */
var LIP = { iy: -1, ih: -0.8, eh: -0.5, ae: -0.4, aa: 0, oh: 0.45, ao: 1, uh: 0.55, uw: 0.85, ah: 0, er: 0, ax: 0 };
var SCHWA_END = [50, 55];   /* where triphthongs end (research/vowel-chart-anatomy.md) */
var ASG = [].concat((D.assignment || {}).part2 || [], (D.assignment || {}).part3 || []);
var HEIGHT_KEYS = ['high', 'mid-high', 'mid', 'mid-low', 'low'];
var HEIGHT_Y = { 'high': 0, 'mid-high': 33.3, 'mid': 50, 'mid-low': 66.7, 'low': 100 };
var HINT_Y = { 'high': 6, 'mid-high': 33.3, 'mid': 50, 'mid-low': 66.7, 'low': 94 };
var HINT_X = { front: 8, central: 50, back: 92 };

function monoOf(x) {
  if (!x) return null;
  if (typeof x === 'object' && x.s) return BYSYM[x.s] || null;
  var v = App.vowel(String(x));
  return v && App.vowelKind(String(x)) === 'mono' ? v : (BYSYM[x] || null);
}
/* Lexicon words for a vowel, best first: assignment words, then slide headwords, then words with audio. */
function wordsFor(sym, head) {
  var all = App.lexFor(sym) || [];
  head = head || [];
  function score(e) {
    var w = e.w.toLowerCase();
    return (ASG.indexOf(w) > -1 ? 8 : 0) + (head.indexOf(w) > -1 ? 4 : 0) + (App.hasAudio(w) ? 2 : 0) + (e.ex ? -20 : 0);
  }
  return all.map(function (e, i) { return { e: e, s: score(e), i: i }; })
    .sort(function (a, b) { return b.s - a.s || a.i - b.i; })
    .map(function (x) { return x.e; });
}

/* =====================================================================
   4. Chart geometry (LTR, front = left; front edge slanted, base ≈ half the top)
   viewBox 360 × 262, same aspect as .chart in index.html.
   x: 0 = front edge at that height … 100 = back edge;  y: 0 = high … 100 = low.
   ===================================================================== */
var CH = { W: 360, H: 262, x0: 14, x1: 286, y0: 40, y1: 246, slant: 0.49 };
function cXY(x, y) {
  var t = y / 100, L = CH.x0 + CH.slant * t * (CH.x1 - CH.x0);
  return [L + x / 100 * (CH.x1 - L), CH.y0 + t * (CH.y1 - CH.y0)];
}
/* ɜː and ə sit 20 units apart on Roach's chart; at phone size their markers would overlap.
   Display-only nudge (3 units each); the mouth and the hint use the true positions. */
var NUDGE = { 'ɜː': [2, -3], 'ə': [-2, 3] };
function dispXY(v) { var n = NUDGE[v.s] || [0, 0]; return cXY(v.x + n[0], v.y + n[1]); }

function chartGrid(svgEl) {
  var a = cXY(0, 33.3), b = cXY(100, 33.3), c = cXY(0, 66.7), d = cXY(100, 66.7), e = cXY(50, 0), f = cXY(50, 100);
  svgEl.appendChild(S('path', { class: 'g-soft', d: 'M' + P2(a) + 'L' + P2(b) + 'M' + P2(c) + 'L' + P2(d) + 'M' + P2(e) + 'L' + P2(f) }));
  svgEl.appendChild(S('path', { class: 'g-line', d: 'M' + P2(cXY(0, 0)) + 'L' + P2(cXY(100, 0)) + 'L' + P2(cXY(100, 100)) + 'L' + P2(cXY(0, 100)) + 'Z' }));
  var ticks = '';
  HEIGHT_KEYS.forEach(function (k) { var p = cXY(100, HEIGHT_Y[k]); ticks += 'M' + P2(p) + 'h5'; });
  svgEl.appendChild(S('path', { class: 'g-line', d: ticks }));
}
/* Axis labels as HTML (Arabic above, English below), positioned in the viewBox space. Returns {key: el}. */
function axisLabels(host) {
  var out = {};
  function lab(key, x, y, minor) {
    var el = h('div', { class: 'ax' + (minor ? ' minor' : ''), style: 'left:' + f1(x / CH.W * 100) + '%;top:' + f1(y / CH.H * 100) + '%' },
      h('b', null, key in D.posAr ? D.posAr[key] : D.heightAr[key]), h('span', null, key));
    host.appendChild(el);
    out[key] = el;
  }
  lab('front', cXY(9, 0)[0], 18);
  lab('central', cXY(50, 0)[0], 18);
  lab('back', cXY(91, 0)[0], 18);
  HEIGHT_KEYS.forEach(function (k) { lab(k, 324, cXY(100, HEIGHT_Y[k])[1], k === 'mid'); });
  return out;
}

/* =====================================================================
   5. The mouth (mid-sagittal section facing left, after L2 p7; units ≈ that drawing ÷ 4)
   ===================================================================== */
var PIVOT = [190, 70];   /* jaw hinge (projection of the TMJ) */
function rotP(x, y, a) {
  var c = Math.cos(a), s = Math.sin(a), dx = x - PIVOT[0], dy = y - PIVOT[1];
  return [PIVOT[0] + dx * c - dy * s, PIVOT[1] + dx * s + dy * c];
}
var NOSE = [C(74, -12), [65, 14], [54, 38], [45, 53.5], [41, 60], [41.2, 65.6], [45.5, 69.2], [53, 70.4], [61, 70.6], [66.5, 72]];
var ALA = [[59.5, 69.8], [58.5, 64.5], [62.5, 60.2], [69, 60.6], [73.5, 65], [71.5, 70.4]];
var ROOF = [C(96.8, 86.6), [100, 85.6], [103.6, 87.7], [107.6, 89.2], [113, 86], [123, 80.8], [137, 77.9], [151, 77.8], [163, 79.8], [173, 84], [180, 88]];
var VEL_REST = [[187.5, 94], [193.5, 101.5], [197.4, 110.4], [202.6, 111], [204.2, 104], [199, 94], [189, 84.5], [180, 80.5]];
var VEL_UP = [[188.5, 90], [197, 92.4], [205.4, 96.2], [210.2, 95], [206.8, 88.6], [198, 83], [189, 80.5], [180, 79.5]];
var WALL = [[198, 30], [206, 44], [210.5, 60], [212, 80], [212.5, 100], [212.8, 120], [213.5, 145], [215.5, 168], [219, 190], [223.5, 212], [228, 236], [232, 268]];
var NASAL_TOP = [[58.5, 64.5], [56, 57], [61, 47], [71, 38], [90, 31.5], [116, 28.5], [146, 29], [172, 33], [191, 38.5]];
var NASAL_FLOOR = [[166, 74.6], [140, 72.6], [114, 73.3], [94, 74.6], [78, 74], [66, 71.8]];
var TURB = [[[90, 42], [120, 37.5], [158, 39], [183, 46]], [[86, 54], [121, 50], [160, 51.5], [190, 59.5]], [[83, 66], [117, 63.5], [158, 65], [193, 71.5]]];
var AIR = [[82, 100], [96, 82], [140, 74], [205, 76], [214, 90], [216.5, 170], [234.5, 270], [184, 270], [184, 196], [160, 170], [118, 146], [90, 122], [82, 112]];
var U_TOOTH = [C(88.7, 106.2), [88.4, 99], [89.2, 92], [91, 85.3], [97, 86.4], [95.8, 94], [93, 101.5]];
var L_TOOTH = [[93.4, 107.4, 1], [92.3, 112], [91.6, 118], [92.2, 124.2], [98.6, 124.4], [98, 117], [96.7, 110.6]];
var LARYNX_FRONT = [[186.6, 198.5], [185.1, 214], [185.6, 236], [186, 270]];
var FOLDS = 'M185.6 230.5L199 234.6L185.7 238.4Z M226.9 229.8L213.4 234.4L227.6 238.8Z';
/* roof under-surface with the velum raised: where the tongue's highest point can reach */
var ROOF_LOOK = ROOF.concat(VEL_UP.slice(0, 2));
function roofY(x) {
  var L = ROOF_LOOK;
  if (x <= L[0][0]) return L[0][1];
  for (var i = 1; i < L.length; i++) if (x <= L[i][0]) return lerp(L[i - 1][1], L[i][1], (x - L[i - 1][0]) / (L[i][0] - L[i - 1][0]));
  return L[L.length - 1][1];
}
function wallX(y) {
  if (y <= WALL[0][1]) return WALL[0][0];
  for (var i = 1; i < WALL.length; i++) if (y <= WALL[i][1]) return lerp(WALL[i - 1][0], WALL[i][0], (y - WALL[i - 1][1]) / (WALL[i][1] - WALL[i - 1][1]));
  return WALL[WALL.length - 1][0];
}
/* tongue surface regions along its length (tip → root), as a share of the surface */
var TONGUE_PARTS = [['tip', 0, 0.07], ['blade', 0.07, 0.19], ['tfront', 0.19, 0.44], ['tback', 0.44, 0.7], ['root', 0.7, 1]];

/* st: { h: 0 high … 1 low, f: 0 front … 1 back (chart units / 100), lip: −1 spread … 1 rounded, vel: 0 rest … 1 raised } */
function mouthGeo(st) {
  var hh = clamp(st.h, -0.05, 1.05), ff = clamp(st.f, -0.05, 1.05);
  var rd = clamp(st.lip, 0, 1.1), sp = clamp(-st.lip, 0, 1.1), vel = clamp(st.vel, 0, 1);
  var a = -(0.8 + 5.2 * clamp(hh, 0, 1)) * Math.PI / 180;   /* the jaw opens only a little */
  function J(x, y, w) { return rotP(x, y, a * (w == null ? 1 : w)); }
  var g = {};

  /* velum: lowered (rest, like the slide) … raised (vowels are oral) */
  var V = VEL_REST.map(function (p, i) { return [lerp(p[0], VEL_UP[i][0], vel), lerp(p[1], VEL_UP[i][1], vel)]; });

  /* lips: rounded = pushed forward and closer; spread = pulled back */
  var UL = [[70, 77], [70.6, 84.5], [68.6 - 4.6 * rd + 1.4 * sp, 91.5 + 0.6 * rd], [67.2 - 3.8 * rd + 1.2 * sp, 99 + 0.4 * rd],
    [72.4 - 2.4 * rd + 0.8 * sp, 103.6 + 1 * rd], [80 - 1 * rd, 105.2 + 1 * rd], cc([85.6, 105.7 + 0.8 * rd])];
  var LL = [cc(J(86, 107.2 - 1 * rd)), J(79 - 2 * rd + 0.5 * sp, 106.8 - 0.8 * rd), J(72.6 - 4.8 * rd + 1.5 * sp, 111.6 - 0.4 * rd),
    J(72.2 - 3.8 * rd + 1.2 * sp, 119.6), J(77.6 - 1 * rd, 126)];

  /* the tongue's highest point = the vowel's place on the chart, mapped into the mouth */
  var t = clamp(hh, -0.05, 1.05);
  var px = lerp(lerp(116, 147, t), lerp(183, 180, t), ff);
  var py = lerp(roofY(px) + 5.5, 119 + 0.04 * (px - 147), t);
  var P = [px, py];
  var T = J(100.2 + 3 * ff, 112.8 + 0.6 * ff), U = J(100.8 + 2 * ff, 118.6);
  /* root: forward for iː (wide pharynx), back for ɑː (narrow pharynx) */
  var rs = 7 * ff + 5 * hh - 6 * (1 - ff) * (1 - hh) - 4;
  var R = [191 + 1.6 * rs, 146], E = [R[0] - 6, 181];
  var dx = P[0] - T[0];
  var c1 = [T[0] + 0.25 * dx, lerp(T[1], P[1], 0.9 - 0.55 * ff)];
  var c2 = [P[0] - (0.3 + 0.15 * ff) * dx, P[1]];
  var gap = R[0] - P[0], k3 = Math.max(0, Math.min(0.55 * gap + 4, 0.92 * gap));
  var c3 = [P[0] + k3, P[1]], c4 = [R[0], R[1] - 0.55 * (R[1] - P[1])];
  var c5 = [R[0], R[1] + 14], c6 = [E[0] + 3, E[1] - 7];
  var dorsum = 'M' + P2(T) + bzC(c1, c2, P) + bzC(c3, c4, R) + bzC(c5, c6, E);
  var bottom = [E, J(176, 174, 0.4), J(163, 166, 0.55), J(145, 157, 0.75), J(126, 148.5, 0.95), J(111, 139), J(104, 129), U];
  g.tongue = dorsum + cr(bottom, false, true) + bzC([U[0] - 2.6, U[1] - 0.6], [T[0] - 2.6, T[1] + 2.2], T) + 'Z';
  g.dorsum = dorsum;
  g.P = P;

  /* samples along the upper surface, with arc length (for taps and highlights) */
  var samp = [], len = [0], segs = [[T, c1, c2, P], [P, c3, c4, R], [R, c5, c6, E]], Lfront = 0;
  segs.forEach(function (sg, si) {
    for (var i = si ? 1 : 0; i <= 14; i++) {
      var q = bz(sg[0], sg[1], sg[2], sg[3], i / 14);
      if (samp.length) len.push(len[len.length - 1] + dist(q, samp[samp.length - 1]));
      samp.push(q);
    }
    if (si === 0) Lfront = len[len.length - 1];
  });
  g.samp = samp; g.len = len; g.Lfront = Lfront; g.Ltot = len[len.length - 1];
  g.sPeak = lerp(0.3, 0.56, clamp(ff, 0, 1));
  g.tongueArea = samp.concat(bottom.slice(1));

  /* epiglottis, attached behind the tongue root */
  var epi = [[E[0] + 2.5, 184], [R[0] + 3, 165], [R[0] + 5.5, 152.5], C(R[0] + 7.6, 149.4), [R[0] + 9.6, 153.5], [R[0] + 8, 168], [E[0] + 8.5, 187]];
  g.epi = cr(epi, true);

  /* skin: skull and face above the mouth, back wall of the pharynx */
  var VB = V[3], wy = wallX(VB[1]);
  var head = NOSE.concat(UL, [C(88.6, 104.4), [93.2, 104.4], [96.6, 93]], ROOF, [V[0], V[1], V[2], V[3], C(wy, VB[1])],
    WALL.filter(function (p) { return p[1] > VB[1] + 2; }).slice(0, -1), [C(232, 270), C(272, 270), C(272, -14), C(74, -14)]);
  g.head = cr(head, true);
  var nasal = NASAL_TOP.concat(WALL.filter(function (p) { return p[1] > 40 && p[1] < VB[1] - 2; }), [C(wy - 0.4, VB[1])], [V[3], V[4], V[5], V[6], V[7]], NASAL_FLOOR);
  g.nasal = cr(nasal, true);
  g.nasalArea = nasal;

  /* lower jaw: lower lip, chin, floor of the mouth (rotates with the jaw) */
  var jaw = LL.concat([J(76, 136), J(74.6, 150), J(77.6, 166), J(88, 177), J(110, 181.6, 0.95), J(136, 184.6, 0.8), J(152, 189, 0.55),
    J(160, 202, 0.25), J(165, 225, 0.05), C(168, 270), C(186, 270), [185.6, 236], [185.1, 214], [186.6, 198.5],
    [Math.max(R[0] - 1, 187), 186], J(164, 162, 0.6), J(136, 148, 0.85), J(114, 133), J(104, 123), J(99.5, 124.6), J(96, 121), J(91, 121.6)]);
  g.jaw = cr(jaw, true);
  g.lowProfile = cr(jaw.slice(0, 14).concat([[168, 270]]));
  g.upProfile = cr(NOSE.slice(1).concat(UL));
  g.roofLine = cr(ROOF.concat(V));
  g.lTooth = cr(L_TOOTH.map(function (p) { var q = J(p[0], p[1]); if (p[2]) q.c = 1; return q; }), true);
  g.lToothArea = L_TOOTH.map(function (p) { return J(p[0], p[1]); });

  /* parts: polylines (l) or areas (a), an anchor for the label, and a tap bonus for small parts */
  g.parts = {
    nose: { l: NOSE.slice(2), at: [47, 50], b: 1 },
    nasal: { a: nasal, at: [126, 46], b: 0 },
    ulip: { l: UL, at: UL[2], b: 2 },
    llip: { l: LL, at: LL[2], b: 2 },
    uteeth: { a: U_TOOTH, at: [91.5, 96], b: 3 },
    lteeth: { a: g.lToothArea, at: J(95, 116), b: 3 },
    ridge: { l: ROOF.slice(0, 4), at: [101, 86.4], b: 2.5 },
    hard: { l: ROOF.slice(3), at: [140, 78], b: 0.5 },
    velum: { l: [ROOF[10], V[0], V[1]], at: V[0], b: 1.5 },
    uvula: { l: [V[1], V[2], V[3]], at: V[2], b: 3 },
    pharynx: { a: [[R[0] + 4, V[2][1] + 3], [wallX(V[2][1] + 3), V[2][1] + 3], [wallX(130), 130], [wallX(160), 160], [wallX(196), 196], [R[0] + 6, 196], [R[0] + 6, 150]], at: [lerp(R[0], wallX(140), 0.6), 132], b: 0 },
    larynx: { a: [[186, 199], [wallX(199), 199], [232, 270], [186, 270]], at: [206, 224], b: 0 },
    tongue: { a: g.tongueArea, b: 0 }
  };
  g.V = V;
  return g;
}

/* s (0 tip … 1 root) → point / sub-polyline of the tongue surface */
function tongueArc(g, s) {
  return s <= g.sPeak ? s / g.sPeak * g.Lfront : g.Lfront + (s - g.sPeak) / (1 - g.sPeak) * (g.Ltot - g.Lfront);
}
function tonguePoint(g, s) {
  var L = tongueArc(g, s);
  for (var i = 1; i < g.len.length; i++) if (g.len[i] >= L) {
    var t = (L - g.len[i - 1]) / ((g.len[i] - g.len[i - 1]) || 1);
    return [lerp(g.samp[i - 1][0], g.samp[i][0], t), lerp(g.samp[i - 1][1], g.samp[i][1], t)];
  }
  return g.samp[g.samp.length - 1];
}
function tongueSub(g, s0, s1) {
  var a = tongueArc(g, s0), b = tongueArc(g, s1), out = [tonguePoint(g, s0)];
  for (var i = 0; i < g.len.length; i++) if (g.len[i] > a && g.len[i] < b) out.push(g.samp[i]);
  out.push(tonguePoint(g, s1));
  return out;
}
function tongueRegionAt(g, p) {
  var best = 0, bd = Infinity;
  for (var i = 0; i < g.samp.length; i++) { var d = dist(p, g.samp[i]); if (d < bd) { bd = d; best = i; } }
  var L = g.len[best], s = L <= g.Lfront ? L / (g.Lfront || 1) * g.sPeak : g.sPeak + (L - g.Lfront) / ((g.Ltot - g.Lfront) || 1) * (1 - g.sPeak);
  for (var k = 0; k < TONGUE_PARTS.length; k++) if (s <= TONGUE_PARTS[k][2]) return TONGUE_PARTS[k][0];
  return 'root';
}

/* any vowel-ish input → mouth state */
function mouthState(x) {
  if (x == null) return { h: 0.58, f: 0.46, lip: 0, vel: 0 };
  if (typeof x === 'object' && !x.s && !x.c && (isNum(x.h) || isNum(x.f))) {
    return { h: (isNum(x.h) ? x.h : 50) / 100, f: (isNum(x.f) ? x.f : 50) / 100, lip: isNum(x.r) ? x.r : (isNum(x.lip) ? x.lip : 0), vel: 1 };
  }
  var key = typeof x === 'object' ? (x.s || x.c) : String(x);
  var v = App.vowel(key), kind = App.vowelKind(key);
  if (!v) return { h: 0.58, f: 0.46, lip: 0, vel: 0 };
  if (kind === 'mono') return { h: v.y / 100, f: v.x / 100, lip: isNum(LIP[v.c]) ? LIP[v.c] : 0, vel: 1 };
  if (kind === 'diph') return { h: v.from[1] / 100, f: v.from[0] / 100, lip: v.r0 || 0, vel: 1 };
  var b = App.vowel(v.base);
  return b ? { h: b.from[1] / 100, f: b.from[0] / 100, lip: b.r0 || 0, vel: 1 } : { h: 0.58, f: 0.46, lip: 0, vel: 1 };
}
function heightWord(y) { var best = 'mid', bd = 1e9; HEIGHT_KEYS.forEach(function (k) { var d = Math.abs(HEIGHT_Y[k] - y); if (d < bd) { bd = d; best = k; } }); return best; }
function posWord(x) { return x < 34 ? 'front' : (x > 66 ? 'back' : 'central'); }

var M_VB = { small: [37, 28, 194, 162], big: [24, -2, 232, 268] };
var mouthSeq = 0;

function Mouth(o) {
  ensureCSS();
  o = o || {};
  var self = this, big = !!o.big, labels = o.labels !== false;
  var vb = big ? M_VB.big : M_VB.small;
  var root = h('div', { class: 'mouth' + (big ? ' vx-mbig' : '') + (o.sym == null ? ' vx-nopeak' : '') });
  var svgEl = S('svg', { viewBox: vb.join(' '), role: 'img', 'aria-label': 'مقطع جانبي للفم واللسان', focusable: 'false' });
  function P(cls, d) { var p = S('path', { class: cls }); if (d) p.setAttribute('d', d); svgEl.appendChild(p); return p; }
  /* the tongue body fades into the floor of the mouth, so only its surface reads as "the tongue" */
  var gid = 'vx-tg-' + (++mouthSeq);
  svgEl.appendChild(S('defs', null, S('linearGradient', { id: gid, gradientUnits: 'userSpaceOnUse', x1: 0, y1: 112, x2: 0, y2: 174 },
    S('stop', { offset: 0, class: 'vx-tg0' }), S('stop', { offset: 0.34, class: 'vx-tg0' }), S('stop', { offset: 1, class: 'vx-tg1' }))));
  P('m-air', cr(AIR, true));
  var head = P('m-skin'), nasal = P('m-air vx-m-nasal');
  P('m-line vx-m-soft', TURB.map(function (t) { return cr(t); }).join(''));
  var nasalTop = P('m-line vx-m-soft', cr(NASAL_TOP.slice(1)));
  var jaw = P('m-skin');
  P('m-skin', FOLDS);
  P('m-line', FOLDS + cr(LARYNX_FRONT));
  var epi = P('vx-m-epi');
  var tongue = P('m-tongue');
  tongue.style.fill = 'url(#' + gid + ')';
  var upLine = P('m-line'), lowLine = P('m-line'), roof = P('m-line');
  P('m-line', cr(WALL));
  P('vx-m-ala', cr(ALA, true));
  P('m-tooth', cr(U_TOOTH, true));
  var lTooth = P('m-tooth');
  var dors = P('m-dorsum');
  var ring = S('circle', { class: 'm-peak-ring', r: 5.6 }), peak = S('circle', { class: 'm-peak', r: 2.7 });
  svgEl.appendChild(ring); svgEl.appendChild(peak);
  var hl = P('m-hl'), mark = S('circle', { class: 'm-mark', r: 2.6, cx: -99, cy: -99 });
  svgEl.appendChild(mark);
  root.appendChild(svgEl);
  var label = h('div', { class: 'm-label', 'aria-hidden': 'true' });
  root.appendChild(label);
  nasalTop.setAttribute('d', cr(NASAL_TOP.slice(1)));

  var geo = null, shown = null, hideT = 0;
  function render(c) {
    geo = mouthGeo(c);
    setD(head, geo.head); setD(nasal, geo.nasal); setD(jaw, geo.jaw); setD(epi, geo.epi);
    setD(tongue, geo.tongue); setD(dors, geo.dorsum); setD(upLine, geo.upProfile); setD(lowLine, geo.lowProfile);
    setD(roof, geo.roofLine); setD(lTooth, geo.lTooth);
    ring.setAttribute('cx', f1(geo.P[0])); ring.setAttribute('cy', f1(geo.P[1]));
    peak.setAttribute('cx', f1(geo.P[0])); peak.setAttribute('cy', f1(geo.P[1]));
  }
  this.anim = new Springs(mouthState(o.sym == null ? null : o.sym),
    { h: [190, 0.8, 0.0006], f: [190, 0.8, 0.0006], lip: [150, 0.82, 0.001], vel: [110, 0.95, 0.001] }, render);
  render(this.anim.cur);

  function partShape(key) {
    var p = geo.parts[key];
    if (p) return { pts: p.a || p.l, closed: !!p.a, at: p.at };
    for (var i = 0; i < TONGUE_PARTS.length; i++) if (TONGUE_PARTS[i][0] === key) {
      var s0 = TONGUE_PARTS[i][1], s1 = TONGUE_PARTS[i][2];
      return { pts: tongueSub(geo, s0, s1), closed: false, at: tonguePoint(geo, (s0 + s1) / 2) };
    }
    return null;
  }
  function hit(pt) {
    var best = null, bs = Infinity, lim = big ? 9 : 14;
    Object.keys(geo.parts).forEach(function (k) {
      var p = geo.parts[k];
      if (!big && k === 'larynx') return;
      var d = p.a ? (inside(pt, p.a) ? 0 : dPoly(pt, p.a, true)) : dPoly(pt, p.l, false);
      if (d > lim) return;
      var sc = d - (p.b || 0) - (k === 'tongue' && d === 0 ? 1.5 : 0);
      if (sc < bs) { bs = sc; best = k; }
    });
    if (best === 'tongue') best = tongueRegionAt(geo, pt);
    return best;
  }
  function placeLabel(at) {
    var x = (at[0] - vb[0]) / vb[2], y = (at[1] - vb[1]) / vb[3];
    var W = root.clientWidth || 1, w = label.offsetWidth || 80;
    var px = clamp(x * W, w / 2 + 2, Math.max(w / 2 + 2, W - w / 2 - 2));
    label.style.left = f1(px) + 'px';
    label.style.top = f1(y * 100) + '%';
  }
  function show(key, fromList) {
    var s = partShape(key);
    if (!s) return;
    shown = key;
    var n = ar(key);
    label.textContent = '';
    label.appendChild(document.createTextNode(n[0]));
    label.appendChild(h('span', { dir: 'ltr' }, n[1]));
    placeLabel(s.at);
    label.classList.add('on');
    hl.setAttribute('d', cr(s.pts, s.closed));
    hl.classList.add('on');
    mark.setAttribute('cx', f1(s.at[0])); mark.setAttribute('cy', f1(s.at[1]));
    mark.classList.add('on');
    clearTimeout(hideT);
    if (!big) hideT = setTimeout(hide, 2600);
    if (self.onPart) self.onPart(key, n, fromList);
  }
  function hide() {
    clearTimeout(hideT);
    shown = null;
    label.classList.remove('on'); hl.classList.remove('on'); mark.classList.remove('on');
    if (self.onPart) self.onPart(null);
  }
  if (labels) {
    root.addEventListener('click', function (e) {
      var r = svgEl.getBoundingClientRect();
      if (!r.width) return;
      var pt = [vb[0] + (e.clientX - r.left) / r.width * vb[2], vb[1] + (e.clientY - r.top) / r.height * vb[3]];
      var k = hit(pt);
      if (k && k !== shown) show(k); else hide();
    });
  }

  this.el = root;
  this.show = show;
  this.hide = hide;
  this.state = function () { return this.anim.tgt; };
  /* x: symbol / code / {h,f,r}; instant: no spring */
  this.set = function (x, instant) {
    var st = mouthState(x);
    if (shown) hide();
    root.classList.toggle('vx-nopeak', x == null);
    this.anim.to(st, instant);
    var v = typeof x === 'string' ? App.vowel(x) : null, kind = typeof x === 'string' ? App.vowelKind(x) : null;
    var hy = st.h * 100, fx = st.f * 100;
    var hw = kind === 'mono' && v ? v.h : heightWord(hy), pw = kind === 'mono' && v ? v.f : posWord(fx);
    svgEl.setAttribute('aria-label', 'مقطع جانبي للفم: اللسان ' + D.heightAr[hw] + ' و' + D.posAr[pw] +
      (st.lip > 0.3 ? '، والشفتان مدوّرتان' : (st.lip < -0.3 ? '، والشفتان مفرودتان' : '')));
  };
  /* drive the springs toward a raw state (used by the glide animation) */
  this.toState = function (st, instant) { if (shown) hide(); this.anim.to(st, instant); };
  if (o.sym != null) this.set(o.sym, true);
  root.api = this;
}

/* Big labelled mouth card (L2): drawing + caption + list of all parts */
function buildMouthCard(o) {
  ensureCSS();
  o = o || {};
  var m = new Mouth({ big: true, labels: true, sym: o.sym });
  var cap = h('div', { class: 'm-cap', 'aria-live': 'polite' });
  function capHint() { cap.textContent = ''; cap.appendChild(h('span', { class: 'vx-hint' }, 'المسي أي جزء في الرسم')); }
  capHint();
  var order = ['nose', 'nasal', 'ulip', 'llip', 'uteeth', 'lteeth', 'ridge', 'hard', 'velum', 'uvula', 'tip', 'blade', 'tfront', 'tback', 'root', 'pharynx', 'larynx'];
  var btns = {};
  var list = h('div', { class: 'vx-plist' }, order.map(function (k) {
    var n = ar(k);
    var b = h('button', { class: 'vx-pbtn', type: 'button', 'aria-pressed': 'false' }, h('b', null, n[0]), h('span', null, n[1]));
    b.addEventListener('click', function () { if (b.getAttribute('aria-pressed') === 'true') m.hide(); else m.show(k, true); });
    btns[k] = b;
    return b;
  }));
  m.onPart = function (k, n) {
    Object.keys(btns).forEach(function (x) { btns[x].setAttribute('aria-pressed', x === k ? 'true' : 'false'); });
    if (!k) { capHint(); return; }
    cap.textContent = '';
    cap.appendChild(h('b', null, n[0]));
    cap.appendChild(h('bdi', { dir: 'ltr' }, n[1]));
  };
  var root = h('div', { class: 'vx card mouth-big' + (o.lec ? ' ' + App.acc(o.lec) : '') }, m.el, cap,
    h('details', { class: 'ro-more vx-parts' }, h('summary', null, h('span', null, 'أسماء الأجزاء'), App.icon('down')), list));
  root.api = m;
  return root;
}

/* =====================================================================
   6. Vowel explorer (readout + mouth + scrubbable chart)
   ===================================================================== */
var SETS = {
  short: { order: D.shortOrder || ['ɪ', 'e', 'æ', 'ʌ', 'ɒ', 'ʊ', 'ə'], ar: 'القصيرة', done: 'أحسنتِ، جرّبتِ السبعة' },
  long: { order: D.longOrder || ['iː', 'ɑː', 'ɔː', 'uː', 'ɜː'], ar: 'الطويلة', done: 'أحسنتِ، جرّبتِ الخمسة' },
  all: { order: ['iː', 'ɪ', 'e', 'æ', 'ʌ', 'ɑː', 'ɒ', 'ɔː', 'ʊ', 'uː', 'ɜː', 'ə'], ar: 'كل الحروف الأحادية', done: 'أحسنتِ، جرّبتِها كلها' }
};
var SEEN = { short: {}, long: {}, all: {} };   /* explored vowels, kept for this session */
var POP = [{ transform: 'scale(1)' }, { transform: 'scale(1.32)', offset: 0.38 }, { transform: 'scale(1.06)', offset: 0.7 }, { transform: 'scale(1.14)' }];

function featList(v) {
  return [[D.heightAr[v.h], v.h], [D.posAr[v.f], v.f], [D.roundAr[v.r], v.r], [D.tenseAr[v.t], v.t]];
}
function lexSmall(main, rest) {
  return '/' + main.t + '/';
}

function buildExplorer(o) {
  ensureCSS();
  o = o || {};
  var setKey = SETS[o.set] ? o.set : 'short', SET = SETS[setKey], seen = SEEN[setKey];
  var inSet = {};
  SET.order.forEach(function (s) { inSet[s] = 1; });
  var root = h('div', { class: 'vx vx-ex' + (o.lec ? ' ' + App.acc(o.lec) : '') });

  /* ----- readout ----- */
  var symEl = h('div', { class: 'ro-sym', dir: 'ltr' });
  var speakV = App.speakButton({ vowel: function () { return cur ? cur.c : null; }, label: 'اسمعي الحرف وحده', className: 'vx-vs' });
  var wordB = h('b'), wordS = h('small');
  var wordBtn = h('button', { class: 'word', type: 'button', lang: 'en' }, wordB, wordS);
  var speakW = App.speakButton({ word: function () { return curWord ? curWord.w : null; }, label: 'اسمعي الكلمة' });
  wordBtn.addEventListener('click', function () { if (curWord) App.playWord(curWord.w, speakW); });
  var mouth = new Mouth({ sym: null, labels: true });
  var exam = h('div', { class: 'exam-line', dir: 'ltr' });
  var featEls = [0, 1, 2, 3].map(function () { return h('div', null, h('b'), h('span')); });
  var moreIn = h('div', { class: 'rm-in' });
  var more = h('details', { class: 'ro-more' }, h('summary', null, h('span', null, 'الوصف المفصّل'), App.icon('down')), moreIn);
  var live = h('p', { class: 'sr', 'aria-live': 'polite' });
  var readout = h('section', { class: 'card readout', 'aria-label': 'الحرف المختار' },
    h('div', { class: 'ro-top' },
      h('div', { class: 'ro-main' }, h('div', { class: 'vx-symrow' }, symEl, speakV), h('div', { class: 'ro-word' }, speakW, wordBtn)),
      mouth.el),
    exam, h('div', { class: 'feat' }, featEls), more, live);

  /* ----- chart ----- */
  var chart = h('div', { class: 'chart', tabindex: '0', role: 'application', 'aria-roledescription': 'مخطط',
    'aria-label': 'مخطط الحروف الصوتية. حرّكي إصبعك عليه، أو استخدمي الأسهم.' });
  var svgEl = S('svg', { viewBox: '0 0 360 262', 'aria-hidden': 'true', focusable: 'false' });
  chartGrid(svgEl);
  var xhV = S('line', { class: 'xh' }), xhH = S('line', { class: 'xh' });
  var finger = S('circle', { class: 'finger', r: 22, cx: -60, cy: -60 });
  svgEl.appendChild(xhV); svgEl.appendChild(xhH); svgEl.appendChild(finger);
  var nodes = {}, pos = {};
  MONO.slice().sort(function (a, b) { return (a.len === 'short' ? 1 : 0) - (b.len === 'short' ? 1 : 0); }).forEach(function (v) {
    var p = dispXY(v), short = v.len === 'short';
    pos[v.s] = p;
    var inner = S('g', { class: 'vm-in' }, S('circle', { r: short ? 15.5 : 12.5 }), S('text', { y: 0.5 }, v.s));
    var g = S('g', { class: 'vm ' + (short ? 'focus' : 'other'), transform: 'translate(' + P2(p) + ')' }, inner);
    g.inner = inner;
    nodes[v.s] = g;
    svgEl.appendChild(g);
  });
  chart.appendChild(svgEl);
  var ax = axisLabels(chart);
  chart.appendChild(h('div', { class: 'vx-legend', 'aria-hidden': 'true' },
    h('span', null, h('i', { class: 'lf' }), 'قصير', h('bdi', null, 'lax')),
    h('span', null, h('i', { class: 'lo' }), 'طويل', h('bdi', null, 'tense'))));

  var exHead = h('div', { class: 'ex-head' });
  var exRow = h('div', { class: 'ex-row' + (SET.order.length === 5 ? ' n5' : (SET.order.length === 12 ? ' n12' : '')) });
  var exBtns = {};
  SET.order.forEach(function (s) {
    var v = BYSYM[s];
    if (!v) return;
    var b = h('button', { class: 'ex' + (s.length > 1 ? ' vx-long' : ''), type: 'button', dir: 'ltr', 'aria-pressed': 'false', 'aria-label': 'الحرف ' + s }, s);
    b.addEventListener('click', function () { select(v); });
    exBtns[s] = b;
    exRow.appendChild(b);
  });
  var chartCard = h('section', { class: 'card chart-card', 'aria-label': 'مخطط الحروف الأحادية' }, chart,
    h('div', { class: 'explore' }, exHead, exRow));
  root.appendChild(readout);
  root.appendChild(chartCard);

  /* crosshair springs to the chosen vowel */
  var xh = new Springs({ x: -100, y: -100 }, { _: [420, 0.9, 0.05] }, function (c) {
    xhV.setAttribute('x1', f1(c.x)); xhV.setAttribute('x2', f1(c.x)); xhV.setAttribute('y1', CH.y0 - 8); xhV.setAttribute('y2', f1(c.y));
    xhH.setAttribute('x1', f1(c.x)); xhH.setAttribute('x2', CH.x1 + 6); xhH.setAttribute('y1', f1(c.y)); xhH.setAttribute('y2', f1(c.y));
  });

  var cur = null, curWord = null, prevFeat = null, roRaf = 0, liveT = 0, first = true;
  function renderReadout(force) {
    var v = cur;
    if (!v) return;
    if (symEl.textContent !== v.s) {
      symEl.textContent = v.s;
      if (!first) waapi(symEl, [{ opacity: 0.35, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
    var ws = wordsFor(v.s, v.head);
    curWord = ws[0] || null;
    wordB.textContent = '';
    if (curWord) {
      wordB.appendChild(App.spellNode(curWord));
      wordS.textContent = lexSmall(curWord, ws.slice(1, 2));
      wordBtn.setAttribute('aria-label', 'اسمعي كلمة ' + curWord.w);
    } else { wordS.textContent = ''; }
    speakW.sync(); speakV.sync();
    speakV.setAttribute('aria-label', App.hasVowelAudio(v.c) ? 'اسمعي الحرف وحده' : 'اسمعي الحرف في كلمة ' + (App.vowelWord(v.c) || ''));
    exam.textContent = '';
    exam.appendChild(h('span', { class: 'sym' }, '/' + v.s + '/'));
    exam.appendChild(document.createTextNode('  ' + App.descLine(v)));
    var fl = featList(v);
    featEls.forEach(function (el, i) {
      el.firstChild.textContent = fl[i][0] || '';
      el.lastChild.textContent = fl[i][1] || '';
      el.classList.toggle('hl', !!prevFeat && prevFeat[i][1] !== fl[i][1]);
    });
    prevFeat = fl;
    moreIn.textContent = '';
    if (v.det) moreIn.appendChild(h('p', null, 'في الشريحة: ', h('bdi', { class: 'ltrx', dir: 'ltr' }, v.det.join(' · '))));
    if (v.mouth && v.mouth.length) moreIn.appendChild(h('p', null, 'حركة الفم: ', h('bdi', { dir: 'ltr' }, v.mouth.join(' · '))));
    if (v.name || v.note) moreIn.appendChild(h('p', null, 'ملاحظة: ', h('bdi', { dir: 'ltr' }, [v.name, v.note].filter(Boolean).join(' · '))));
    if (v.page) moreIn.appendChild(App.pgEl('L3', v.page));
    first = false;
    if (force) return;
    clearTimeout(liveT);
    liveT = setTimeout(function () { live.textContent = v.s + ': ' + App.descLine(v) + (curWord ? '، ' + curWord.w : ''); }, 450);
  }
  function scheduleReadout() {
    if (roRaf) return;
    roRaf = requestAnimationFrame(function () { roRaf = 0; renderReadout(); });
  }
  function updateExplore() {
    var n = 0;
    SET.order.forEach(function (s) {
      var b = exBtns[s];
      if (!b) return;
      if (seen[s]) n++;
      b.classList.toggle('seen', !!seen[s]);
      var on = !!cur && cur.s === s;
      b.classList.toggle('cur', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    exHead.textContent = '';
    exHead.appendChild(h('b', null, SET.ar));
    if (n >= SET.order.length) exHead.appendChild(h('span', { class: 'done' }, App.icon('tick'), SET.done));
    else exHead.appendChild(h('span', { class: 'num' }, n + ' من ' + SET.order.length));
  }
  function select(v, how) {
    how = how || {};
    if (!v || (cur === v && !how.force)) return;
    var prev = cur;
    cur = v;
    if (prev) nodes[prev.s].classList.remove('sel');
    var n = nodes[v.s];
    n.classList.add('sel');
    if (prev) waapi(n.inner, POP, { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1)' });
    if (inSet[v.s]) seen[v.s] = 1;
    var keys = [v.h, v.f];
    Object.keys(ax).forEach(function (k) { ax[k].classList.toggle('on', keys.indexOf(k) > -1); });
    var p = pos[v.s];
    xh.to({ x: p[0], y: p[1] }, how.instant || !prev);
    mouth.set(v.s, how.instant || !prev);
    if (how.instant || !prev) renderReadout(true); else scheduleReadout();
    updateExplore();
    if (typeof o.onSelect === 'function') { try { o.onSelect(v); } catch (e) { console.error(e); } }
  }

  /* ----- scrub: pointer events, one rect read per gesture, moves batched per frame ----- */
  var rect = null, scrubbing = false, pend = 0, lastPt = null;
  function toVB(e) { return [(e.clientX - rect.left) / rect.width * CH.W, (e.clientY - rect.top) / rect.height * CH.H]; }
  function nearest(p) {
    var best = null, bd = Infinity;
    MONO.forEach(function (v) { var q = pos[v.s], d = (q[0] - p[0]) * (q[0] - p[0]) + (q[1] - p[1]) * (q[1] - p[1]); if (d < bd) { bd = d; best = v; } });
    if (cur && best !== cur) {   /* a little hysteresis so the choice does not flicker on a boundary */
      var q = pos[cur.s], dc = Math.sqrt((q[0] - p[0]) * (q[0] - p[0]) + (q[1] - p[1]) * (q[1] - p[1]));
      if (dc - Math.sqrt(bd) < 2.5) return cur;
    }
    return best;
  }
  function applyScrub() {
    if (!lastPt) return;
    finger.setAttribute('cx', f1(lastPt[0])); finger.setAttribute('cy', f1(lastPt[1]));
    select(nearest(lastPt));
  }
  chart.addEventListener('pointerdown', function (e) {
    if (e.button > 0) return;
    rect = chart.getBoundingClientRect();
    if (!rect.width) return;
    scrubbing = true;
    chart.classList.add('scrub');
    try { chart.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    lastPt = toVB(e);
    applyScrub();
    e.preventDefault();
  });
  chart.addEventListener('pointermove', function (e) {
    if (!scrubbing) return;
    lastPt = toVB(e);
    if (!pend) pend = requestAnimationFrame(function () { pend = 0; if (scrubbing) applyScrub(); });
  });
  function endScrub() { if (!scrubbing) return; scrubbing = false; chart.classList.remove('scrub'); }
  chart.addEventListener('pointerup', endScrub);
  chart.addEventListener('pointercancel', endScrub);
  chart.addEventListener('lostpointercapture', endScrub);
  chart.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && curWord) { e.preventDefault(); App.playWord(curWord.w, speakW); return; }
    var dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!dir || !cur) return;
    e.preventDefault();
    var c = pos[cur.s], best = null, bs = Infinity;
    MONO.forEach(function (v) {
      if (v === cur) return;
      var q = pos[v.s], dx = q[0] - c[0], dy = q[1] - c[1], along = dx * dir[0] + dy * dir[1];
      if (along <= 2) return;
      var score = along + Math.abs(dx * dir[1] - dy * dir[0]) * 2;
      if (score < bs) { bs = score; best = v; }
    });
    if (best) select(best);
  });

  var start = monoOf(o.sel) || BYSYM[SET.order[0]];
  select(start, { instant: true, force: true });
  App.audio.ready().then(function () { if (cur) renderReadout(true); });
  root.api = { select: function (x) { var v = monoOf(x); if (v) select(v); }, mouth: mouth, current: function () { return cur; } };
  return root;
}

/* =====================================================================
   7. Glide chart (diphthongs / triphthongs)
   ===================================================================== */
var GL_LAB = { 'ɪə': [16, 0], 'eə': [16, 4], 'ʊə': [16, -1], 'eɪ': [16, 2], 'aɪ': [-17, -2], 'ɔɪ': [-5, -15], 'əʊ': [5, 15], 'aʊ': [16, -2],
  'eɪə': [19, 2], 'aɪə': [-21, -2], 'ɔɪə': [-6, -15], 'əʊə': [-15, 14], 'aʊə': [19, -2] };
var GL_GROUP_AR = { all: 'الحروف المزدوجة الثمانية', tri: 'الحروف الثلاثية' };
var HEAD_LEN = 8;

function glideItems(group) {
  if (group === 'tri') {
    return (D.triphthongs || []).map(function (t) {
      var b = App.vowel(t.base);
      if (!b) return null;
      return { s: t.s, tri: true, base: b, pts: [b.from, b.to, SCHWA_END], lips: [b.r0 || 0, b.r1 || 0, 0], head: t.head || [], g: 'tri', page: 20 };
    }).filter(Boolean);
  }
  return DIPH.filter(function (d) { return group === 'all' || d.g === group; }).map(function (d) {
    return { s: d.s, d: d, pts: [d.from, d.to], lips: [d.r0 || 0, d.r1 || 0], head: (d.head || []).concat(d.more || []), g: d.g, page: d.page };
  });
}
function polyLen(pts) { var L = 0; for (var i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]); return L; }
function pointAt(pts, L) {
  for (var i = 1; i < pts.length; i++) {
    var d = dist(pts[i - 1], pts[i]);
    if (L <= d || i === pts.length - 1) {
      var t = d ? clamp(L / d, 0, 1) : 1;
      return { p: [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t)],
        ang: Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]), i: i, t: t };
    }
    L -= d;
  }
  return { p: pts[pts.length - 1], ang: 0, i: pts.length - 1, t: 1 };
}

function buildGlide(o) {
  ensureCSS();
  o = o || {};
  var group = { all: 1, centring: 1, 'closing-i': 1, 'closing-u': 1, tri: 1 }[o.group] ? o.group : 'all';
  var items = glideItems(group);
  var root = h('div', { class: 'vx vx-glide' + (o.lec ? ' ' + App.acc(o.lec) : '') });
  if (!items.length) return App.placeholder('هذا الرسم قيد التجهيز.');

  /* ----- readout ----- */
  var symEl = h('div', { class: 'ro-sym', dir: 'ltr' });
  var grpEl = h('span', { class: 'vx-gl-grp' });
  var speakV = App.speakButton({ vowel: function () { return cur ? (cur.tri ? cur.s : cur.d.c) : null; }, label: 'اسمعي الحرف وحده', className: 'vx-vs' });
  var wordB = h('b'), wordS = h('small');
  var wordBtn = h('button', { class: 'word', type: 'button', lang: 'en' }, wordB, wordS);
  var speakW = App.speakButton({ word: function () { return curWord ? curWord.w : null; }, label: 'اسمعي الكلمة' });
  wordBtn.addEventListener('click', function () { if (curWord) App.playWord(curWord.w, speakW); });
  var mouth = new Mouth({ sym: items[0].s, labels: true });
  var exam = h('div', { class: 'exam-line', dir: 'ltr' });
  var moreIn = h('div', { class: 'rm-in' });
  var more = h('details', { class: 'ro-more' }, h('summary', null, h('span', null, 'كلمات من المحاضرة'), App.icon('down')), moreIn);
  var readout = h('section', { class: 'card readout', 'aria-label': 'الحرف المختار' },
    h('div', { class: 'ro-top' },
      h('div', { class: 'ro-main' }, h('div', { class: 'vx-symrow' }, symEl, speakV), grpEl, h('div', { class: 'ro-word' }, speakW, wordBtn)),
      mouth.el),
    exam, more);

  /* ----- chart ----- */
  var chart = h('div', { class: 'chart vx-glchart', role: 'img', 'aria-label': 'مخطط حركة اللسان في ' + (group === 'tri' ? 'الحروف الثلاثية' : 'الحروف المزدوجة') });
  var svgEl = S('svg', { viewBox: '0 0 360 262', 'aria-hidden': 'true', focusable: 'false' });
  chartGrid(svgEl);
  /* reference targets: ə for centring and triphthongs, ɪ and ʊ for closing */
  var refs = group === 'tri' ? [] : group === 'centring' ? [['ə', 1]] : (group === 'closing-i' ? [['ɪ', 1]] : (group === 'closing-u' ? [['ʊ', 1]] : []));
  refs.forEach(function (r) {
    var v = BYSYM[r[0]];
    if (!v) return;
    var p = cXY(v.x, v.y);
    svgEl.appendChild(S('g', { class: 'vx-ref' + (r[1] ? ' vx-main' : ''), transform: 'translate(' + P2(p) + ')' }, S('circle', { r: 14 }), S('text', { y: 0.5 }, r[0])));
  });
  items.forEach(function (it) {
    var full = it.pts.map(function (p) { return cXY(p[0], p[1]); });
    var n = full.length, a = full[n - 2], b = full[n - 1], d = dist(a, b) || 1;
    var cut = full.slice(0, n - 1).concat([[b[0] - (b[0] - a[0]) / d * (HEAD_LEN - 2), b[1] - (b[1] - a[1]) / d * (HEAD_LEN - 2)]]);
    it.full = full; it.cut = cut; it.L = polyLen(cut);
    var dpath = 'M' + cut.map(P2).join('L');
    it.path = S('path', { class: 'gl-arrow', d: dpath });
    it.headEl = S('path', { class: 'gl-head', d: 'M0 0L-' + HEAD_LEN + ' -3.8L-' + (HEAD_LEN - 2) + ' 0L-' + HEAD_LEN + ' 3.8Z' });
    it.dot = S('circle', { class: 'gl-dot', r: 4.2, cx: f1(full[0][0]), cy: f1(full[0][1]) });
    var off = GL_LAB[it.s] || [16, 0];
    it.lab = S('text', { class: 'gl-lab', x: f1(full[0][0] + off[0]), y: f1(full[0][1] + off[1]) }, it.s);
    it.grp = S('g', { class: 'vx-gl' }, it.path, it.headEl, it.dot, it.lab);
    svgEl.appendChild(it.grp);
    setHead(it, 1);
  });
  chart.appendChild(svgEl);
  axisLabels(chart);

  var exHead = h('div', { class: 'ex-head' });
  var replay = h('button', { class: 'text-btn', type: 'button' }, App.icon('redo'), 'أعيدي');
  replay.addEventListener('click', function () { if (cur) play(cur); });
  var nCls = items.length === 8 ? ' n8' : (items.length === 5 ? ' n5' : (items.length === 3 ? ' vx-n3' : (items.length === 2 ? ' vx-n2' : '')));
  var exRow = h('div', { class: 'ex-row' + nCls });
  items.forEach(function (it) {
    it.btn = h('button', { class: 'ex' + (it.tri ? ' vx-long' : ''), type: 'button', dir: 'ltr', 'aria-pressed': 'false', 'aria-label': 'الحرف ' + it.s }, it.s);
    it.btn.addEventListener('click', function () { select(it, true); });
    exRow.appendChild(it.btn);
  });
  var grpTitle = GL_GROUP_AR[group] || (D.groups[group] || {}).ar || '';
  exHead.appendChild(h('b', { richText: grpTitle }));
  exHead.appendChild(replay);
  root.appendChild(readout);
  root.appendChild(h('section', { class: 'card chart-card', 'aria-label': 'مخطط حركة اللسان' }, chart, h('div', { class: 'explore' }, exHead, exRow)));

  function setHead(it, p) {
    var at = pointAt(it.cut, it.L * p), ang = at.ang;
    var tip = [at.p[0] + Math.cos(ang) * (HEAD_LEN - 2), at.p[1] + Math.sin(ang) * (HEAD_LEN - 2)];
    it.headEl.setAttribute('transform', 'translate(' + P2(tip) + ') rotate(' + f1(ang * 180 / Math.PI) + ')');
  }
  function fullArrow(it) {
    it.path.style.strokeDasharray = '';
    it.path.style.strokeDashoffset = '';
    it.headEl.style.opacity = '';
    setHead(it, 1);
  }
  function stateAt(it, p) {   /* mouth state p (0..1) along the glide, by length */
    var at = pointAt(it.full, polyLen(it.full) * p), i = at.i, t = at.t;
    var A = it.pts[i - 1], B = it.pts[i];
    return { h: lerp(A[1], B[1], t) / 100, f: lerp(A[0], B[0], t) / 100, lip: lerp(it.lips[i - 1], it.lips[i], t), vel: 1 };
  }

  var cur = null, curWord = null, tl = null;
  function play(it) {
    if (tl) { ticker.remove(tl); if (tl.it !== it) fullArrow(tl.it); tl = null; }
    var start = stateAt(it, 0);
    if (reduced()) { fullArrow(it); mouth.toState(stateAt(it, 1), true); return; }
    var HOLD = 380, GLIDE = it.tri ? 1250 : 950, total = HOLD + GLIDE, ms = 0, L = it.L;
    it.path.style.strokeDasharray = f1(L) + ' ' + f1(L + 20);
    it.path.style.strokeDashoffset = f1(L);
    it.headEl.style.opacity = '0';
    mouth.toState(start);
    tl = {
      it: it,
      tick: function (dt) {
        ms += dt * 1000;
        if (ms < HOLD) return true;
        var p = easeInOut(clamp((ms - HOLD) / GLIDE, 0, 1));
        it.path.style.strokeDashoffset = f1(L * (1 - p));
        it.headEl.style.opacity = '1';
        setHead(it, p);
        mouth.toState(stateAt(it, p));
        if (ms >= total) { fullArrow(it); tl = null; return false; }
        return true;
      }
    };
    ticker.add(tl);
  }
  function renderReadout() {
    var it = cur;
    symEl.textContent = it.s;
    grpEl.textContent = '';
    grpEl.innerHTML = it.tri ? App.richText(it.base.s + ' + ə') : App.rich((D.groups[it.g] || {}).ar || '');
    var ws = wordsFor(it.s, it.head);
    curWord = ws[0] || null;
    wordB.textContent = '';
    if (curWord) {
      wordB.appendChild(App.spellNode(curWord));
      wordS.textContent = lexSmall(curWord, ws.slice(1, 2));
      wordBtn.setAttribute('aria-label', 'اسمعي كلمة ' + curWord.w);
    } else {
      wordB.textContent = it.head[0] || '';
      wordS.textContent = '';
    }
    speakW.sync(); speakV.sync();
    speakV.setAttribute('aria-label', App.hasVowelAudio(cur.tri ? cur.s : cur.d.c) ? 'اسمعي الحرف وحده' : 'اسمعي الحرف في كلمة ' + (App.vowelWord(cur.tri ? cur.s : cur.d.c) || ''));
    exam.textContent = '';
    exam.appendChild(h('span', { class: 'sym' }, '/' + it.s + '/'));
    var parts = it.tri ? [it.base.s.charAt(0), it.base.s.charAt(1), 'ə'] : [it.s.charAt(0), it.s.charAt(1)];
    exam.appendChild(document.createTextNode('  ' + parts.join(' → ')));
    exam.appendChild(h('span', { class: 'vx-gl-to' }, '  · ' + (it.tri ? 'triphthong' : (D.groups[it.g] || {}).en || '')));
    moreIn.textContent = '';
    var wl = (it.head || []).filter(function (w, i, a) { return a.indexOf(w) === i; }).slice(0, 10);
    if (wl.length) moreIn.appendChild(h('div', { class: 'wlist' }, wl.map(function (w) { return App.wordChip(w); })));
    var sp = it.tri ? null : it.d.spell;
    if (sp && sp.length) moreIn.appendChild(h('div', { class: 'sp-pats' }, sp.map(function (p) { return h('span', { class: 'sp-pat' }, h('b', null, p[0]), ' ' + p[1]); })));
    if (it.page) moreIn.appendChild(App.pgEl('L4', it.page));
  }
  function select(it, animate) {
    if (cur && cur !== it) {
      cur.path.classList.remove('sel'); cur.headEl.classList.remove('sel'); cur.dot.classList.remove('sel'); cur.lab.classList.remove('sel');
      cur.btn.classList.remove('cur'); cur.btn.setAttribute('aria-pressed', 'false');
    }
    cur = it;
    chart.classList.add('vx-has');
    it.path.classList.add('sel'); it.headEl.classList.add('sel'); it.dot.classList.add('sel'); it.lab.classList.add('sel');
    it.btn.classList.add('cur'); it.btn.setAttribute('aria-pressed', 'true');
    svgEl.appendChild(it.grp);   /* bring the chosen arrow to the front */
    renderReadout();
    if (animate) play(it); else mouth.toState(stateAt(it, 0), true);
  }
  chart.addEventListener('click', function (e) {
    var r = chart.getBoundingClientRect();
    if (!r.width) return;
    var p = [(e.clientX - r.left) / r.width * CH.W, (e.clientY - r.top) / r.height * CH.H];
    var best = null, bd = Infinity;
    items.forEach(function (it) {
      var d = Math.min(dPoly(p, it.full, false), dist(p, it.full[0]) - 4);
      if (d < bd) { bd = d; best = it; }
    });
    if (best && bd < 30) select(best, true);
  });

  var first = null;
  if (o.sel) items.forEach(function (it) { if (!first && (it.s === o.sel || (it.d && it.d.c === o.sel))) first = it; });
  select(first || items[0], false);
  App.audio.ready().then(function () { if (cur) renderReadout(); });
  root.api = { select: function (s) { items.forEach(function (it) { if (it.s === s || (it.d && it.d.c === s)) select(it, true); }); }, mouth: mouth };
  return root;
}

/* =====================================================================
   8. Mini chart — practice hint (one dot, no symbols)
   ===================================================================== */
function miniPoints(a) {
  if (a == null) return null;
  if (typeof a === 'string' || (typeof a === 'object' && a.sym != null)) {
    var key = typeof a === 'string' ? a : String(a.sym);
    var v = App.vowel(key), kind = App.vowelKind(key);
    if (!v) return null;
    if (kind === 'mono') return [[v.x, v.y]];
    if (kind === 'diph') return [v.from, v.to];
    var b = App.vowel(v.base);
    return b ? [b.from, b.to, SCHWA_END] : null;
  }
  if (typeof a === 'object') {
    var hy = isNum(a.h) ? a.h : (isNum(a.y) ? a.y : HINT_Y[a.h]);
    var fx = isNum(a.f) ? a.f : (isNum(a.x) ? a.x : HINT_X[a.f]);
    if (!isNum(hy) && !isNum(fx)) return null;
    return [[isNum(fx) ? clamp(fx, 0, 100) : 50, isNum(hy) ? clamp(hy, 0, 100) : 50]];
  }
  return null;
}
function buildMini(arg) {
  ensureCSS();
  var o = typeof arg === 'string' ? { sym: arg } : (arg || {});
  var root = h('div', { class: 'vx vx-mini' + (o.lec ? ' ' + App.acc(o.lec) : ''), role: 'img' });
  var svgEl = S('svg', { viewBox: '0 0 360 262', 'aria-hidden': 'true', focusable: 'false' });
  chartGrid(svgEl);
  var arr = S('path', { class: 'vx-arr' }), arrH = S('path', { class: 'vx-arrh', d: 'M0 0L-9 -4L-7 0L-9 4Z' });
  var ring = S('circle', { class: 'vx-ring', r: 15 }), dot = S('circle', { class: 'vx-dot', r: 7 });
  [arr, arrH, ring, dot].forEach(function (n) { svgEl.appendChild(n); });
  root.appendChild(svgEl);
  axisLabels(root);
  function set(a) {
    var pts = miniPoints(a) || [[50, 50]];
    var sc = pts.map(function (p) { return cXY(p[0], p[1]); });
    ring.setAttribute('cx', f1(sc[0][0])); ring.setAttribute('cy', f1(sc[0][1]));
    dot.setAttribute('cx', f1(sc[0][0])); dot.setAttribute('cy', f1(sc[0][1]));
    if (sc.length > 1) {
      var n = sc.length, a2 = sc[n - 2], b2 = sc[n - 1], d = dist(a2, b2) || 1, ux = (b2[0] - a2[0]) / d, uy = (b2[1] - a2[1]) / d;
      var cut = sc.slice(0, n - 1).concat([[b2[0] - ux * 6, b2[1] - uy * 6]]);
      arr.setAttribute('d', 'M' + cut.map(P2).join('L'));
      arrH.setAttribute('transform', 'translate(' + P2(b2) + ') rotate(' + f1(Math.atan2(uy, ux) * 180 / Math.PI) + ')');
      arr.style.display = arrH.style.display = '';
    } else { arr.style.display = arrH.style.display = 'none'; }
    /* generic on purpose: words like «خلفي» would give the answer away */
    var lbl = (a && a.label) || ('مكان الحرف على مخطط الحروف' + (pts.length > 1 ? '، والسهم حركة اللسان' : ''));
    root.setAttribute('aria-label', lbl);
  }
  set(o);
  root.api = { set: function (a) { set(typeof a === 'string' ? { sym: a } : a); } };
  return root;
}

/* =====================================================================
   9. Static blocks: vdesc (the four features) and rptable (44 RP symbols, L1 p14)
   ===================================================================== */
function buildVdesc() {
  ensureCSS();
  var cells = [
    ['ارتفاع اللسان', 'tongue height', 'high · mid-high · mid · mid-low · low'],
    ['مكان اللسان', 'tongue position', 'front · central · back'],
    ['شكل الشفتين', 'lip rounding', 'rounded · unrounded'],
    ['مشدود أو مرتخٍ', 'tense · lax', 'tense = long · lax = short']
  ];
  var ex = ((D.assignment || {}).part1 || [])[4] || ['mid-high, back, rounded, tense', 'ɔː'];
  return h('div', { class: 'vx vx-vd card' },
    h('div', { class: 'vdesc' }, cells.map(function (c, i) {
      return h('div', null, h('i', { class: 'num' }, String(i + 1)), h('b', null, c[0]), h('span', null, c[1]), h('small', null, c[2]));
    })),
    h('div', { class: 'vx-vd-ex' }, h('span', null, 'مثال من الواجب:'),
      h('p', { dir: 'ltr' }, ex[0] + ' → ', h('b', null, '/' + ex[1] + '/'))));
}
var RP = [
  ['القصيرة', 'Short vowels', [['ɪ', 'pit', 'pɪt'], ['e', 'pet', 'pet'], ['æ', 'pat', 'pæt'], ['ʌ', 'putt', 'pʌt'], ['ɒ', 'pot', 'pɒt'], ['ʊ', 'put', 'pʊt'], ['ə', 'about', 'əbaʊt']]],
  ['الطويلة', 'Long vowels', [['iː', 'key', 'kiː'], ['ɑː', 'car', 'kɑː'], ['ɔː', 'core', 'kɔː'], ['uː', 'coo', 'kuː'], ['ɜː', 'cur', 'kɜː']]],
  ['المزدوجة', 'Diphthongs', [['eɪ', 'bay', 'beɪ'], ['aɪ', 'buy', 'baɪ'], ['ɔɪ', 'boy', 'bɔɪ'], ['əʊ', 'go', 'gəʊ'], ['aʊ', 'cow', 'kaʊ'], ['ɪə', 'peer', 'pɪə'], ['eə', 'pear', 'peə'], ['ʊə', 'poor', 'pʊə']]],
  ['الساكنة', 'Consonants', [['p', 'pea', 'piː'], ['b', 'bee', 'biː'], ['t', 'toe', 'təʊ'], ['d', 'doe', 'dəʊ'], ['k', 'cap', 'kæp'], ['g', 'gap', 'gæp'],
    ['f', 'fat', 'fæt'], ['v', 'vat', 'væt'], ['θ', 'thing', 'θɪŋ'], ['ð', 'this', 'ðɪs'], ['s', 'sip', 'sɪp'], ['z', 'zip', 'zɪp'], ['ʃ', 'ship', 'ʃɪp'],
    ['ʒ', 'measure', 'meʒə'], ['h', 'hat', 'hæt'], ['m', 'map', 'mæp'], ['n', 'nap', 'næp'], ['ŋ', 'hang', 'hæŋ'], ['l', 'led', 'led'], ['r', 'red', 'red'],
    ['j', 'yet', 'jet'], ['w', 'wet', 'wet'], ['tʃ', 'chin', 'tʃɪn'], ['dʒ', 'gin', 'dʒɪn']]]
];
function buildRptable() {
  ensureCSS();
  var tiles = [];
  var root = h('div', { class: 'vx vx-rp' });
  RP.forEach(function (grp) {
    root.appendChild(h('div', { class: 'vx-rp-h' }, h('span', null, grp[0] + ' (' + grp[2].length + ')'), h('bdi', { dir: 'ltr' }, grp[1])));
    root.appendChild(h('div', { class: 'vx-rp-g' }, grp[2].map(function (r) {
      var t = h('button', { class: 'vx-rp-t', type: 'button', disabled: true, lang: 'en', 'aria-label': r[0] + ' as in ' + r[1] },
        h('b', null, r[0]), h('span', null, r[1]), h('i', null, '/' + r[2] + '/'));
      t.addEventListener('click', function () { App.playWord(r[1], t); });
      t.word = r[1];
      tiles.push(t);
      return t;
    })));
  });
  App.audio.ready().then(function () {
    tiles.forEach(function (t) {
      if (!App.hasAudio(t.word)) return;
      t.disabled = false;
      t.appendChild(App.icon('speaker'));
    });
  });
  return root;
}

/* =====================================================================
   10. Registration
   ===================================================================== */
App.registerBlock('chart', function (b, ctx) { return buildExplorer({ set: b.chart, lec: null, ctx: ctx }); });
App.registerBlock('glide', function (b) { return buildGlide({ group: b.glide }); });
App.registerBlock('mouth', function () { return buildMouthCard({}); });
App.registerBlock('vdesc', function () { return buildVdesc(); });
App.registerBlock('rptable', function () { return buildRptable(); });

App.registerWidget('vowelChart', function (o) { return buildExplorer(o || {}); });
App.registerWidget('glideChart', function (o) { return buildGlide(o || {}); });
App.registerWidget('mouth', function (o) {
  o = o || {};
  if (o.big) return buildMouthCard(o);
  ensureCSS();
  var m = new Mouth({ sym: o.sym, labels: o.labels !== false });
  var wrap = h('div', { class: 'vx' + (o.lec ? ' ' + App.acc(o.lec) : '') }, m.el);
  wrap.api = m;
  return wrap;
});
App.registerWidget('miniChart', buildMini);
App.registerWidget('hintChart', buildMini);
})();
