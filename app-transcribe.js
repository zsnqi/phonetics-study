/* Whole-word transcription guide. Examples and audio use the lecture lexicon. */
(function () {
'use strict';
var App = window.App;
if (!App) return;
var h = App.h;
var CSS = `
.tr-intro{color:var(--label2);line-height:1.6}
.tr-card{padding:16px;margin-top:0}.tr-card p{line-height:1.6}
.tr-letters{display:flex;flex-wrap:wrap;gap:8px;direction:ltr;margin:14px 0 18px}
.tr-letter{display:inline-grid;place-items:center;min-width:44px;height:44px;border-radius:12px;background:var(--raised);font-size:19px}
.tr-after{margin-top:6px}
.tr-example{display:inline-flex;direction:ltr;align-items:center;justify-content:flex-start;flex-wrap:wrap;gap:8px;min-height:44px;padding:8px 10px;border-radius:10px;background:var(--raised);text-align:start}
.tr-example svg{width:16px;height:16px;color:var(--label2)}
.tr-example.playing{background:var(--acc-wash);color:var(--acc-ink)}
.tr-examples{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.tr-symbols .clue-line{min-height:46px}
.tr-symbols{background:var(--card);border-radius:14px;padding:4px 12px}
.tr-trap h3{font-size:17px;margin-bottom:6px}
.tr-sent{margin-bottom:4px}
.tr-trap .clue{margin-top:4px}
.tr-trap .ref-chip{margin-top:10px}
.tr-steps{list-style:none;display:grid;gap:12px;counter-reset:tr}
.tr-steps li{counter-increment:tr;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.tr-steps li:before{content:counter(tr);display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--acc-wash);color:var(--acc-ink);font-weight:700;flex:none}
.tr-steps .tr-run{display:inline-flex;direction:ltr;align-items:center;gap:8px;margin-inline-start:auto}
.tr-steps .t-ipa{font-size:22px}
.tr-pair{margin-top:16px}
`;
function ensureCSS() {
  if (!document.getElementById('css-transcribe')) document.head.appendChild(h('style', { id: 'css-transcribe', text: CSS }));
}
function example(w, compact) {
  var e = App.lexWord(w);
  if (!e) return null;
  return h('button', { type: 'button', class: 'tr-example', 'aria-label': 'اسمعي كلمة ' + e.w,
    onclick: function (ev) { App.playWord(e.w, ev.currentTarget); } },
    App.enEl(e.w), compact ? null : h('span', { dir: 'ltr', 'aria-hidden': 'true' }, '→'),
    compact ? null : App.ipaEl(App.normIPA(e.t)), App.icon('speaker'));
}
function rChip() { return App.refChip('الحرف r', function () { if (App.showRSheet) App.showRSheet(); }); }
function rows(list) { return list.map(function (o) { return App.clueRow(o); }); }
function trap(title, text, content) {
  return h('div', { class: 'tr-trap' }, h('h3', { richText: title }), h('p', { class: 'tr-sent', richText: text }), content);
}
function exampleList(words) { return h('div', { class: 'tr-examples' }, words.map(function (w) { return example(w); })); }
App.registerPage('how-to-transcribe', function (o) {
  ensureCSS();
  return App.openPage('كيف أكتب النطق؟', function (body, page) {
    var initialCard = o && o.card != null ? Math.max(0, Math.min(6, +o.card || 0)) : null;
    App.teachingSteps(body, page, 'how-to-transcribe', [
      { id: 'consonants', title: 'حروف تبقى كما هي', build: function (el) {
        el.appendChild(h('p', { class: 'tr-intro' }, 'هذه الحروف تُكتب في النطق كما هي.'));
        el.appendChild(h('div', { class: 'tr-letters', dir: 'ltr' }, 'p b t d k g f v s z m n l w h'.split(' ').map(function (l) {
          return h('span', { class: 'tr-letter' }, App.enEl(l));
        })));
        el.appendChild(h('p', { class: 'tr-intro', richText: 'الحرف r يُكتب في النطق إذا جاء بعده حرف صوتي.' }));
      } },
      { id: 'symbols', title: '7 رموز جديدة', build: function (el) {
        el.appendChild(h('div', { class: 'tr-symbols' }, rows([
          { clue: 'sh', sym: 'ʃ', word: 'fish' }, { clue: 'ch', sym: 'tʃ', word: 'chin' }, { clue: 'j · ge', sym: 'dʒ', word: 'age' },
          { clue: 'th', sym: 'θ', word: 'death', tag: 'بلا اهتزاز' }, { clue: 'th', sym: 'ð', word: 'thus', tag: 'مع اهتزاز' },
          { clue: 'ng', sym: 'ŋ', word: 'king' }, { clue: 'y', sym: 'j', word: 'yes', tag: 'انتبهي: شكل الرمز يختلف عن الحرف.', warn: true }
        ])));
      } },
      { id: 'traps', title: 'الفخاخ', build: function (el, memory) {
        var traps = [
          ['اكتبي ما تسمعينه', 'إذا لم تسمعي الحرف، فلا تكتبيه.', exampleList(['know', 'wrong'])],
          ['الحرف المكتوب r', 'لا تكتبي /r/ إذا لم يأتِ بعده حرف صوتي.', h('div', null, rChip())],
          ['اكتبي الصوت مرة واحدة', 'حرفان مكتوبان وصوت واحد. اكتبي الصوت مرة واحدة.', exampleList(['fill', 'miss'])],
          ['الحرف المكتوب e في النهاية', 'غالبًا لا تسمعين الحرف e في النهاية، فلا تكتبيه.', exampleList(['give', 'mate'])],
          ['الحرف المكتوب c', 'الحرف c له صوتان. اسمعي الكلمة لتختاري.', h('div', null, rows([{ clue: 'c', sym: 'k', word: 'cat' }, { clue: 'c', sym: 's', word: 'face' }]))],
          ['الحرف المكتوب x', 'الحرف x صوتان معًا.', h('div', null, rows([{ clue: 'x', sym: 'ks', word: 'tax' }, { clue: 'x', sym: 'ks', word: 'text' }]))],
          ['الحرفان المكتوبان ph', 'الحرفان ph صوت واحد.', h('div', null, rows([{ clue: 'ph', sym: 'f', word: 'phone' }, { clue: 'ph', sym: 'f', word: 'phoned' }]))]
        ];
        var row = h('div', { class: 'study-rail tr-traps', tabindex: '0', 'aria-label': 'بطاقات الفخاخ' }, traps.map(function (t) {
          return h('section', { class: 'card tr-card' }, trap(t[0], t[1], t[2]));
        }));
        var n = initialCard != null ? initialCard : Math.max(0, Math.min(6, +memory.card || 0));
        initialCard = null;
        var count = h('span', { text: (n + 1) + ' من 7' });
        function move(to) { n = Math.max(0, Math.min(6, to)); row.scrollLeft = -n * (row.clientWidth + 12); memory.card = n; App.save(); count.textContent = (n + 1) + ' من 7'; }
        row.addEventListener('scroll', function () { n = Math.min(6, Math.round(Math.abs(row.scrollLeft) / (row.clientWidth + 12))); count.textContent = (n + 1) + ' من 7'; if (row.isConnected) { memory.card = n; App.save(); } }, { passive: true });
        row.addEventListener('keydown', function (e) { if (e.target === row && /ArrowLeft|ArrowRight/.test(e.key)) { e.preventDefault(); move(n + (e.key === 'ArrowLeft' ? 1 : -1)); } });
        el.appendChild(row);
        var resume = n; requestAnimationFrame(function () { if (row.isConnected) move(resume); });
        el.appendChild(h('div', { class: 'study-rail-nav' },
          h('button', { type: 'button', onclick: function () { move(n - 1); } }, 'الفخ السابق'), count,
          h('button', { type: 'button', onclick: function () { move(n + 1); } }, 'الفخ التالي')));
      } },
      { id: 'three-steps', title: '3 خطوات لكل كلمة', build: function (el) {
        el.appendChild(h('section', { class: 'card tr-card' }, h('ol', { class: 'tr-steps' },
          h('li', null, h('b', null, 'الحروف الساكنة'), h('span', { class: 'tr-run' }, App.ipaEl('k'), App.ipaEl('t'))),
          h('li', null, h('b', null, 'الحرف الصوتي'), h('span', { class: 'tr-run' }, App.ipaEl('ɜː'))),
          h('li', null, h('b', null, 'النتيجة'), h('span', { class: 'tr-run' }, App.ipaEl('kɜːt'), example('curt', true))))));
        el.appendChild(h('p', { class: 'tr-intro tr-pair', text: 'قارني طول الحرف الصوتي في الكلمتين.' }));
        el.appendChild(exampleList(['pool', 'pull']));
      } }
    ], { initial: o && o.initial, openIndex: o && o.openIndex, action: 'تدرّبي على النطق الكامل', done: function () { App.go('full-transcription'); } });
  }, { acc: 'L3', className: 'tr-page' });
});
})();
