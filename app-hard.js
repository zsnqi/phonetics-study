/* Focused spelling clues and look-alike practice. All words come from App.lex. */
(function () {
'use strict';
var App = window.App;
if (!App) return;
var h = App.h;
var GROUPS = [['ʊ', 'uː'], ['ɔː', 'ɒ', 'ɑː'], ['ɜː', 'ə']];
var BACK = ['uː', 'ʊ', 'ɔː', 'ɒ', 'ɑː'];
var SYMBOLS = BACK.concat(['ɜː', 'ə']);
var KEYS = { 'uː': 'food', 'ʊ': 'put', 'ɔː': 'horse', 'ɒ': 'pot', 'ɑː': 'card', 'ɜː': 'bird', 'ə': 'about' };
var CSS = `
.hd-page .en{white-space:nowrap}
.hd-intro{color:var(--label2);line-height:1.6}
.hd-group{display:flex;justify-content:center;align-items:flex-start;gap:10px;padding:10px 8px;border-radius:14px;background:var(--card)}
.hd-groups{display:grid;gap:10px}
.hd-group>div{display:grid;justify-items:center;gap:4px;min-width:0}
.hd-group .t-ipa{font-size:28px}
.hd-len{font-size:13px;color:var(--label2);text-align:center}
.hd-rtext{line-height:1.6;margin-bottom:6px}
.hd-word{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:9px 12px;border-radius:11px;background:var(--raised);font-size:16px}
.hd-word svg{width:16px;height:16px;color:var(--label2)}
.hd-word mark,.hd-clue mark{background:var(--acc-wash);color:var(--acc-ink);text-decoration:underline;text-underline-offset:3px;border-radius:3px}
.hd-group .hd-word{padding:8px 10px;font-size:15px}
.hd-pairs{display:grid;gap:10px;margin-top:14px}
.hd-pair{display:flex;align-items:center;justify-content:center;gap:10px;padding:10px 8px;border-radius:14px;background:var(--card)}
.hd-pair .t-ipa{font-size:28px}
.hd-pair .hd-word{padding:8px 10px;font-size:15px}
.hd-pair-eq{color:var(--label3);font-size:20px}
.hd-chips{margin-top:14px;display:flex;justify-content:center}
.hd-exam{display:grid;gap:12px}
.hd-exam-row{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.hd-exam-row .t-ipa{font-size:24px;min-width:34px}
.hd-exam-row .t-en{font-weight:600;min-width:56px}
.hd-exam-desc{font-size:14px;color:var(--label2);flex:1;min-width:0}
.hd-options{grid-template-columns:repeat(3,minmax(0,1fr));direction:ltr}
.hd-options.hd-two{grid-template-columns:repeat(2,minmax(0,1fr))}
.hd-opt-cell{display:grid;gap:4px;justify-items:center}
.hd-options .opt{width:100%;flex-direction:column;justify-content:center;gap:2px;font-size:28px;padding:10px 4px;min-height:72px}
.hd-options .opt small{font-size:13px;color:var(--label2);font-weight:500}
.hd-ear{display:grid;place-items:center;width:44px;height:44px;border-radius:22px;background:var(--fill);color:var(--acc-ink)}
.hd-ear svg{width:20px;height:20px}
.hd-question .pr-prompt-word{display:flex;align-items:center;justify-content:center;gap:12px;margin:16px 0}
.hd-question .pr-word{margin:0}.hd-drill-wrap{display:grid;gap:16px}.hd-drill-wrap .pr-bar{position:static;padding:0}
.hd-words{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.hd-clue{display:block;font-size:25px;margin-top:10px}.hd-feedback:focus{outline:none}
.hd-feedback .clue{margin-block:6px}
.hd-cmp{display:grid;gap:4px;margin:6px 0 10px}
.hd-cmp-row{display:flex;align-items:center;flex-wrap:wrap;gap:8px 10px;min-height:44px}
.hd-cmp-lab{min-width:52px;font-size:14px;font-weight:600;color:var(--label2)}
.hd-cmp-row.is-right .hd-cmp-lab{color:var(--acc-ink)}
.hd-cmp .t-ipa{font-size:24px}
.hd-cmp .wchip{min-height:44px}
.hd-result-actions{display:grid;gap:10px;margin-top:16px}
.hd-mistakes{margin-bottom:18px}.hd-mistakes-only > .pr-endwrap{display:none}
`;
function ensureCSS() {
  if (document.getElementById('css-hard')) return;
  document.head.appendChild(h('style', { id: 'css-hard', text: CSS }));
}

/* Match at the marked target, never at an unrelated vowel in the word. */
function spelling(e) {
  var m = /^(.*?)\[([^\]]+)\](.*)$/.exec(e.sp);
  return { letters: m ? m[2].toLowerCase() : '', tail: m ? (m[2] + m[3]).replace(/[\[\]]/g, '').toLowerCase() : '' };
}
function letters(re) { return function (e) { return re.test(spelling(e).letters); }; }
function tail(re) { return function (e) { return re.test(spelling(e).tail); }; }
function named(words) { return function (e) { return words.indexOf(e.w.toLowerCase()) >= 0; }; }
function stressed(e) { return e.v !== 'ə' && !e.ex; }
function stressedTail(re) { var f = tail(re); return function (e) { return stressed(e) && f(e); }; }
function rule(sym, clue, after, tag, match) { return { sym: sym, clue: clue, after: after, tag: tag, match: match }; }
var RULES = [
  rule('ʊ', 'oo', 'k · d', 'غالبًا', tail(/^oo[kd]/)),
  rule('ʊ', 'u', '', 'في كلمات قليلة', named(['put', 'pull', 'full', 'push'])),
  rule('ʊ', 'ou', '', 'في كلمات قليلة', named(['would', 'could'])),
  rule('uː', 'oo', '', 'غالبًا', letters(/^oo$/)),
  rule('uː', 'ew', '', '', letters(/ew/)),
  rule('uː', 'u…e', '', 'الحرف الأخير لا يُنطق', tail(/^u[^aeiou]e$/)),
  rule('uː', 'oe', '', '', letters(/^oe$/)),
  rule('uː', 'ou', '', 'أحيانًا', letters(/^ou$/)),
  rule('ɔː', 'or', '', 'في مقطع عليه ضغط', stressedTail(/^or/)),
  rule('ɔː', 'aw', '', '', letters(/^aw$/)),
  rule('ɔː', 'alk', '', 'الحرف l لا يُنطق', tail(/^alk/)),
  rule('ɔː', 'all', '', '', tail(/^all/)),
  rule('ɔː', 'augh · ough', '', '', letters(/^(augh|ough)$/)),
  rule('ɔː', 'our', '', 'أحيانًا', letters(/^our$/)),
  rule('ɒ', 'o', '', 'في مقطع مغلق', function (e) {
    return spelling(e).letters === 'o' && /^[^aeiou]*o[^aeiou]+$/i.test(e.w);
  }),
  rule('ɒ', 'wa', '', 'أحيانًا', function (e) { return /^w\[(?:a|ar|al)\]/i.test(e.sp); }),
  rule('ɑː', 'ar', '', 'في مقطع عليه ضغط', stressedTail(/^ar/)),
  rule('ɑː', 'al', 'f · m · v', 'الحرف l لا يُنطق', tail(/^al[fmv]/)),
  rule('ɑː', 'a', 's · f · th · n', 'جنوب شرق إنجلترا', tail(/^a(?:s(?!h)|f|th|n)/)),
  rule('ɜː', 'er', '', 'في مقطع عليه ضغط', stressedTail(/^er/)),
  rule('ɜː', 'ir', '', 'في مقطع عليه ضغط', stressedTail(/^ir/)),
  rule('ɜː', 'ur', '', 'في مقطع عليه ضغط', stressedTail(/^ur/)),
  rule('ɜː', 'ear', '', 'يليها حرف ساكن', tail(/^ear[b-df-hj-np-tv-z]/)),
  rule('ə', 'a · e · o · u', '', 'في مقطع بلا ضغط', function (e) {
    return e.v === 'ə' || (e.ex && /ˈ/.test(e.t) && ['orange', 'cabbage', 'private', 'dances', 'wanted', 'begin', 'music', 'minute'].indexOf(e.w.toLowerCase()) >= 0);
  })
];
RULES.forEach(function (r) {
  r.words = App.lex.filter(function (e) { return r.match(e) && e.v === r.sym; });
});
RULES = RULES.filter(function (r) { return r.words.length >= 2; });

function id(e) { return 'g-hard-' + e.w.toLowerCase(); }
var POOL = App.lex.filter(function (e) {
  return SYMBOLS.indexOf(e.v) >= 0 && (!e.ex || (e.v === 'ə' && /\[[^\]]+\]/.test(e.sp)));
});
function group(sym) { return GROUPS.filter(function (g) { return g.indexOf(sym) >= 0; })[0]; }
function rowOf(r, sym, w, tag) { return App.clueRow({ clue: r.clue, after: r.after, sym: sym, word: w, tag: tag }); }
/* Feedback node. node.showsSym tells the caller the symbol is already on screen. */
function cmpRow(label, sym, chips, right) {
  var r = h('div', { class: 'hd-cmp-row' + (right ? ' is-right' : '') }, h('span', { class: 'hd-cmp-lab', text: label }), App.ipaEl(sym));
  chips.forEach(function (w) { r.appendChild(App.wordChip(w, { trans: false })); });
  return r;
}
/* Two rows, examples on their own rows: what she picked, then the right sound. */
function comparison(e, picked, rowFollows) {
  var right = [];
  var same = e.w.toLowerCase() === KEYS[e.v];
  if (!(rowFollows && same)) right.push(KEYS[e.v]);
  if (!rowFollows && !same) right.push(e.w);
  return h('div', { class: 'hd-cmp' }, cmpRow('اخترتِ', picked, [KEYS[picked]], false), cmpRow('الصح', e.v, right, true));
}
function explanation(e, wrong, picked) {
  var box = h('div', null);
  var r = RULES.filter(function (x) { return x.sym === e.v && x.match(e); })[0];
  var broken = r ? null : RULES.filter(function (x) { return x.sym !== e.v && x.match(e); })[0];
  if (wrong && picked && KEYS[picked]) { box.appendChild(comparison(e, picked, !!(r || broken))); box.cmp = true; }
  if (r) {
    box.appendChild(rowOf(r, e.v, e.w, r.tag));
    box.appendChild(h('p', { class: 'fb-why' }, wrong ? 'هذا ما يقوله الدليل هنا.' : 'القاعدة تنطبق هنا.'));
    box.showsSym = true; return box;
  }
  if (broken) {
    box.appendChild(rowOf(broken, e.v, e.w, ''));
    box.appendChild(h('p', { class: 'fb-why' }, 'هذه الكلمة استثناء. اسمعيها واحفظي نطقها.'));
    box.showsSym = true; return box;
  }
  box.appendChild(h('p', { class: 'fb-why' }, 'اسمعي هذه الكلمة واحفظي نطقها.'));
  return box;
}
function word(e, showVowel) {
  return h('button', { class: 'hd-word', type: 'button', 'aria-label': 'اسمعي كلمة ' + e.w,
    onclick: function () { App.playWord(e.w); } },
    h('bdi', { dir: 'ltr', lang: 'en', html: App.spellHTML(e) }), showVowel ? App.ipaEl(e.v) : null, App.icon('speaker'));
}
function heading(text) { return App.secHead(text); }
function btn(text, fn, kind) { return h('button', { class: 'btn ' + (kind || 'btn-primary'), type: 'button', onclick: fn }, text); }

function rContent() {
  var d = h('div', null, h('p', { class: 'hd-rtext', richText: 'في اللهجة البريطانية لا يُنطق الحرف r إذا لم يأتِ بعده حرف صوتي.' }));
  [{ clue: 'ar', sym: 'ɑː', word: 'card' }, { clue: 'or', sym: 'ɔː', word: 'horse' }, { clue: 'ir', sym: 'ɜː', word: 'bird' },
    { clue: 'er', sym: 'ə', word: 'paper', tag: 'في آخر الكلمة' }, { clue: 'ear', sym: 'ɪə', word: 'ear', tag: 'تسمعين صوتين' }
  ].forEach(function (o) { d.appendChild(App.clueRow(o)); });
  return d;
}
App.showRSheet = function () { App.sheet({ title: 'الحرف المكتوب r', body: rContent() }); };
App.showExamSheet = function () {
  var body = h('div', { class: 'hd-exam' }, SYMBOLS.map(function (sym) {
    return h('div', { class: 'hd-exam-row', dir: 'ltr' }, App.ipaEl(sym), App.enEl(KEYS[sym]),
      h('span', { class: 'hd-exam-desc', text: App.descLine(App.vowel(sym)) }));
  }));
  App.sheet({ title: 'وصف الاختبار', body: body });
};
App.registerBlock('rsheet', function () { return h('div', null, App.refChip('الحرف r', App.showRSheet)); });

function lenTag(sym) {
  if (sym === 'ə') return 'قصير وضعيف';
  var v = App.vowel(sym);
  return v && v.len === 'long' ? 'طويل' : 'قصير';
}
function pairWords() {
  var used = [], out = [];
  ['ʊ', 'uː', 'ɔː', 'ɑː'].forEach(function (sym) {
    var syms = [sym].concat(SYMBOLS.slice(SYMBOLS.indexOf(sym) + 1)).concat(SYMBOLS);
    for (var i = 0; i < syms.length; i++) {
      var s = syms[i];
      if (used.indexOf(s) >= 0) continue;
      var t = (App.lexFor(s) || []).filter(function (e) { return !e.ex && e.w !== KEYS[s]; })[0];
      if (t) { used.push(s); out.push({ sym: s, test: t, key: App.lexWord(KEYS[s]) }); return; }
    }
  });
  return out;
}
App.registerPage('hard-vowels', function (o) {
  ensureCSS();
  return App.openPage('الحروف الصعبة', function (body, page) {
    var steps = [
      { id: 'groups', title: '7 أصوات متشابهة', build: function (el) {
        el.appendChild(h('div', { class: 'hd-groups' }, GROUPS.map(function (g) {
          return h('div', { class: 'hd-group', dir: 'ltr' }, g.map(function (sym) {
            return h('div', null, App.ipaEl(sym), word(App.lexWord(KEYS[sym])), h('span', { class: 'hd-len', dir: 'rtl' }, lenTag(sym)));
          }));
        })));
        el.appendChild(h('div', { class: 'hd-chips' }, App.refChip('وصف الاختبار', function () { App.showExamSheet(); })));
      } },
      { id: 'ear', title: 'قارني بالأذن', build: function (el) {
        el.appendChild(h('p', { class: 'hd-intro' }, 'اسمعي الكلمة، ثم اسمعي كلمة المفتاح.'));
        el.appendChild(h('div', { class: 'hd-pairs' }, pairWords().map(function (p) {
          return h('div', { class: 'hd-pair', dir: 'ltr' }, word(p.test), h('span', { class: 'hd-pair-eq', 'aria-hidden': 'true' }, '≈'), word(p.key), App.ipaEl(p.sym));
        })));
      } }
    ];
    /* A saved step that no longer exists (the old spelling step) restarts at the first step. */
    var mem = App.state && App.state.prefs && App.state.prefs.studySteps, saved = mem && mem['hard-vowels'];
    if (saved != null && !(typeof saved === 'object' && steps.some(function (s) { return s.id === saved.id; }))) delete mem['hard-vowels'];
    App.teachingSteps(body, page, 'hard-vowels', steps, { initial: o && o.initial, openIndex: o && o.openIndex, action: 'ابدئي التمرين', done: function () { App.go('hard-drill'); } });
    if (o && o.section === 'silent-r') setTimeout(function () { App.showRSheet(); }, 0);
  }, { acc: 'L3', className: 'hd-page' });
});

function initialRound(size) {
  var list = [];
  /* Sample targets before words so a short round keeps varied symbols. */
  var targets = App.shuffle(SYMBOLS);
  targets.slice(0, size).forEach(function (s) {
    list = list.concat(App.sample(POOL.filter(function (e) { return e.v === s; }), 1));
  });
  var rest = POOL.filter(function (e) { return list.indexOf(e) < 0; });
  return App.shuffle(list.concat(App.sample(rest, size - list.length)));
}
function startRound(page) {
  App.chooseRound(page, function (size) { run(page, initialRound(size), false); },
    'الكلمات التي تخطئين فيها تعود داخل الجولة. إعادتها لا تزيد عدد الكلمات المختار.');
}
function run(page, entries, review) {
  var queue = entries.map(function (e) { return { e: e, repeat: false }; });
  var total = queue.length, i = 0, first = 0, right = 0, attempts = 0;
  function result() {
    page.body.textContent = '';
    page.el.scrollTop = 0;
    page.body.appendChild(h('section', { class: 'card result' },
      h('h2', null, review ? 'أنهيتِ المراجعة' : 'أنهيتِ الجولة'),
      h('p', null, 'إجاباتكِ الصحيحة من المحاولة الأولى'),
      h('div', { class: 'r-big' }, String(right), h('small', null, ' / ' + total)),
      h('p', { richText: 'عدد المحاولات: ' + attempts + '.' })));
    page.body.appendChild(h('div', { class: 'hd-result-actions' },
      btn('جولة جديدة', function () { startRound(page); }),
      btn(review ? 'رجوع للمراجعة' : 'رجوع', function () { page.close(); }, 'btn-soft')));
  }
  function show() {
    if (i >= queue.length) { result(); return; }
    page.body.textContent = '';
    page.el.scrollTop = 0;
    var item = queue[i], e = item.e, answered = false;
    var wrap = h('div', { class: 'hd-drill-wrap' });
    var fill = h('i', { style: 'transform:scaleX(' + (first / total) + ')' });
    wrap.appendChild(h('div', { class: 'q-top' }, h('div', { class: 'q-prog', 'aria-hidden': 'true' }, fill),
      h('span', { class: 'q-count num', richText: item.repeat ? 'إعادة خطأ · ' + first + ' من ' + total : 'السؤال ' + (first + 1) + ' من ' + total })));
    var choices = App.shuffle(group(e.v));
    var opts = h('div', { class: 'opts hd-options' + (choices.length === 2 ? ' hd-two' : '') });
    var chip = App.stateChip(App.qStatus(id(e)));
    chip.classList.add('pr-end');
    var card = h('section', { class: 'card q-card hd-question', 'aria-label': 'السؤال', 'data-word': e.w },
      h('div', { class: 'q-meta' }, App.tag('L3'), h('span', { class: 'q-kind' }, 'الحروف المتشابهة'), chip),
      h('h2', { class: 'pr-ins' }, 'اختاري الحرف الصوتي في الكلمة'),
      h('div', { class: 'pr-prompt-word' },
        h('p', { class: 'pr-word' + (e.ex && e.v === 'ə' ? ' hd-clue' : ''), dir: 'ltr', lang: 'en', html: e.ex && e.v === 'ə' ? App.spellHTML(e) : App.esc(e.w) }),
        App.speakButton({ word: e.w, label: 'اسمعي الكلمة' })),
      e.ex && e.v === 'ə' ? h('p', null, 'ما صوت الجزء الملوّن؟') : null,
      opts);
    var after = h('div', { 'aria-live': 'polite', 'aria-atomic': 'true' });
    choices.forEach(function (s) {
      var optBtn = h('button', { class: 'opt', type: 'button', 'data-vowel': s, onclick: function () {
        if (answered) return;
        answered = true;
        var ok = s === e.v;
        attempts++;
        if (!item.repeat) { first++; if (ok) right++; }
        if (!ok) queue.splice(Math.min(i + 4, queue.length), 0, { e: e, repeat: true });
        var status = App.recordAnswer(id(e), ok, { topics: ['hard', 'l3', App.vowel(e.v).len], type: 'word', lec: 'L3' });
        var nextChip = App.stateChip(status);
        nextChip.classList.add('pr-end'); chip.replaceWith(nextChip);
        Array.prototype.forEach.call(opts.querySelectorAll('.opt'), function (b) {
          b.disabled = true;
          var value = b.getAttribute('data-vowel');
          b.classList.add(value === e.v ? 'right' : value === s ? 'wrong' : 'muted');
        });
        var why = explanation(e, !ok, s);
        var fb = h('section', { class: 'fb hd-feedback ' + (ok ? 'right' : 'wrong'), tabindex: '-1' },
          h('h3', { class: 'fb-head' }, App.icon(ok ? 'tick' : 'cross'), ok ? 'صح' : 'غلط'),
          why.showsSym || why.cmp ? null : h('p', { class: 'fb-ans' }, App.ipaEl(e.v)),
          why.showsSym || why.cmp ? null : h('bdi', { class: 'hd-clue', dir: 'ltr', lang: 'en', html: App.spellHTML(e) }),
          why,
          !ok ? h('p', { class: 'fb-why' }, 'ستعود هذه الكلمة لاحقًا في الجولة.') : null);
        after.appendChild(fb);
        fill.style.transform = 'scaleX(' + (first / total) + ')';
        wrap.appendChild(h('div', { class: 'pr-bar' }, btn(i + 1 >= queue.length ? 'النتيجة' : 'التالي', function () { i++; show(); })));
        fb.focus({ preventScroll: true });
        fb.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      } }, App.ipaEl(s), h('small', { dir: 'ltr', lang: 'en' }, KEYS[s]));
      var ear = h('button', { class: 'hd-ear', type: 'button', 'aria-label': 'اسمعي كلمة ' + KEYS[s],
        onclick: function (ev) { ev.stopPropagation(); App.playWord(KEYS[s], ear); } }, App.icon('speaker'));
      opts.appendChild(h('div', { class: 'hd-opt-cell' }, optBtn, ear));
    });
    wrap.appendChild(card); wrap.appendChild(after);
    page.body.appendChild(wrap);
  }
  show();
}
App.registerPage('hard-drill', function (o) {
  ensureCSS();
  var review = !!(o && o.mistakes);
  var entries = review ? hardWrong() : null;
  return App.openPage('تدريب المتشابهات', function (body, page) {
    if (!review) { startRound(page); return; }
    if (!entries.length) { body.appendChild(h('p', null, 'ليس لديكِ أخطاء حاليًا.')); return; }
    run(page, entries, !!(o && o.mistakes));
  }, { acc: 'L3', className: 'pr-page hd-page', back: 'رجوع' });
});

function hardWrong() { return POOL.filter(function (e) { return App.qStatus(id(e)) === 'wrong'; }); }
/* The practice bank has no external-question registry. Add a self-contained section
   to its review landing page using page events; never alter its bank or questions. */
App.on('page-open', function (page) {
  if (page.title !== 'مراجعة الأخطاء') return;
  ensureCSS();
  var host = null, observer;
  function sync() {
    var home = page.body.querySelector('.pr-endwrap');
    /* Generic review results also use pr-endwrap; only extend its landing page. */
    if (!home || !home.querySelector('.pr-intro')) { if (host) { host.remove(); host = null; } page.body.classList.remove('hd-mistakes-only'); return; }
    var words = hardWrong();
    if (host) host.remove();
    host = null;
    var regular = App.wrongIds().some(function (qid) { return App.practice && !!App.practice.question(qid); });
    page.body.classList.toggle('hd-mistakes-only', !!words.length && !regular);
    if (!words.length) return;
    host = h('section', { class: 'hd-mistakes acc-L3' }, heading('أخطاء الحروف الصعبة'),
      h('div', { class: 'list' }, App.row({ title: 'راجعي المتشابهات', sub: 'الكلمات التي أخطأتِ فيها في هذا التدريب', meta: String(words.length),
        icon: 'redo', iconBg: 'var(--l3-btn)', onClick: function () { App.go('hard-drill', { mistakes: true }); } })),
      h('div', { class: 'hd-words' }, words.map(function (e) { return h('bdi', { dir: 'ltr', lang: 'en', text: e.w }); })));
    /* Let these native buttons handle Enter/Space before Practice's page shortcut. */
    host.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') ev.stopPropagation();
    });
    page.body.insertBefore(host, home);
  }
  function refresh() { observer.disconnect(); sync(); observer.observe(page.body, { childList: true }); }
  observer = new MutationObserver(refresh);
  refresh();
  var oldShow = page.onShow, oldClose = page.onClose;
  page.onShow = function (p) { if (oldShow) oldShow(p); refresh(); };
  page.onClose = function (p) { observer.disconnect(); if (oldClose) oldClose(p); };
});
})();
