/* Study content. Source: the four lecture PDFs (content/L1.md … L4.md) and Assignment 2.
   Page numbers are PDF pages. Nothing here is invented beyond standard RP transcriptions
   of lecture words whose transcription the slides do not print. */
(function () {
'use strict';

/* ---------- inline helpers for lesson HTML ---------- */
function en(t) { return '<bdi class="t-en" dir="ltr">' + t + '</bdi>'; }
function ipa(s) { return '<bdi class="t-ipa" dir="ltr">/' + s + '/</bdi>'; }
function pg(lec, p) { return '<span class="t-pg">' + lec + ' · ص' + p + '</span>'; }

var D = {};
D.examDate = '2026-10-27';
D.planStart = '2026-10-20';

D.lectures = {
  L1: { ar: 'مقدمة', en: 'An introduction' },
  L2: { ar: 'إنتاج الأصوات', en: 'The production of speech sounds' },
  L3: { ar: 'الحروف القصيرة والطويلة', en: 'Short and long vowels' },
  L4: { ar: 'الحروف المزدوجة والثلاثية', en: 'Diphthongs and triphthongs' }
};

/* ---------- Vocabulary of the lecturer's summary lines (L3) ---------- */
D.heightAr = { 'high': 'مرتفع', 'mid-high': 'وسط مرتفع', 'mid': 'وسط', 'mid-low': 'وسط منخفض', 'low': 'منخفض' };
D.posAr = { front: 'أمامي', central: 'مركزي', back: 'خلفي' };
D.roundAr = { unrounded: 'شفاه غير مدوّرة', rounded: 'شفاه مدوّرة' };
D.tenseAr = { tense: 'مشدود (طويل)', lax: 'مرتخٍ (قصير)' };

/* ---------- 12 monophthongs (positions: Roach 4th ed. charts, see research/vowel-chart-anatomy.md) ----------
   x,y = position on the vowel chart (0–100). y: 0 high → 100 low.
   x: 0 = front edge at that height → 100 = back edge.            */
D.vowels = [
  { c: 'iy', s: 'iː', len: 'long',  h: 'high',     f: 'front',   r: 'unrounded', t: 'tense', x: 4,  y: 4,
    det: ['nearly high', 'front', 'spread'], head: ['beat', 'mean', 'peace'], page: 8,
    mouth: ['wide mouth', 'front of tongue up'],
    spell: [['ee', 'feet', 'Common'], ['ea', 'eat', 'Common'], ['e-e', 'scene', 'Common'], ['e', 'me', 'Less common'], ['ie', 'piece', 'Less common']] },
  { c: 'ih', s: 'ɪ',  len: 'short', h: 'high',     f: 'front',   r: 'unrounded', t: 'lax',   x: 25, y: 24,
    det: ['intermediate between high and mid-high', 'front', 'spread'], head: ['bit', 'pin', 'fish'], page: 10,
    mouth: ['front of tongue up'],
    spell: [['i', 'king', 'Common'], ['y', 'gym', 'Common'], ['a', 'orange', 'Weak'], ['e', 'begin', 'Weak'], ['i', 'music', 'Weak'], ['u', 'minute', 'Weak']] },
  { c: 'eh', s: 'e',  len: 'short', h: 'mid',      f: 'front',   r: 'unrounded', t: 'lax',   x: 0,  y: 61,
    det: ['between mid-high and mid-low', 'front', 'slightly spread'], head: ['bet', 'men', 'yes'], page: 14,
    mouth: ['wide mouth', 'back of tongue down (a little)', 'jaw down (a little)'],
    spell: [['e', 'pen', 'Common'], ['ea', 'death', 'Sometimes'], ['ie', 'friend', 'Sometimes'], ['a', 'many', 'Sometimes'], ['ai', 'said', 'Sometimes']] },
  { c: 'ae', s: 'æ',  len: 'short', h: 'low',      f: 'front',   r: 'unrounded', t: 'lax',   x: 9,  y: 94, name: 'the ash',
    det: ['intermediate between mid-low and low', 'front', 'slightly spread'], head: ['bat', 'man', 'gas'], page: 16,
    mouth: ['wide open mouth', 'back of tongue down', 'jaw down'],
    spell: [['a', 'mad', 'Common']] },
  { c: 'aa', s: 'ɑː', len: 'long',  h: 'low',      f: 'back',    r: 'unrounded', t: 'tense', x: 75, y: 96,
    det: ['low', 'not fully back', 'neutral'], head: ['card', 'hard', 'part'], page: 20,
    mouth: ['jaw down', 'tongue low and back'],
    spell: [['ar', 'car', 'Common'], ['al', 'half', 'Common'], ['ear', 'heart', 'Less common'], ['a + s, f, th, n', 'pass', 'South East England']] },
  { c: 'oh', s: 'ɒ',  len: 'short', h: 'low',      f: 'back',    r: 'rounded',   t: 'lax',   x: 95, y: 84,
    det: ['intermediate between mid-low and low', 'back', 'slightly rounded'], head: ['pot', 'gone', 'cross'], page: 22,
    mouth: ['lips rounded (a little)', 'lips forward', 'front of tongue down', 'jaw down'],
    spell: [['o', 'dog', 'Common'], ['a', 'wash', 'Less common']] },
  { c: 'ao', s: 'ɔː', len: 'long',  h: 'mid-high', f: 'back',    r: 'rounded',   t: 'tense', x: 97, y: 39,
    det: ['closer to mid-high', 'back', 'fully rounded'], head: ['board', 'torn', 'horse'], page: 25,
    mouth: ['lips very rounded', 'lips forward', 'front of tongue down', 'jaw down'],
    spell: [['or', 'form', 'Common'], ['a', 'call', 'Less common'], ['ar', 'war', ''], ['au', 'cause', ''], ['aw', 'saw', ''], ['al', 'walk', ''], ['augh', 'taught', ''], ['ough', 'thought', ''], ['our', 'four', '']] },
  { c: 'uh', s: 'ʊ',  len: 'short', h: 'high',     f: 'back',    r: 'rounded',   t: 'lax',   x: 61, y: 25,
    det: ['just above mid high', 'between back and center', 'rounded'], head: ['put', 'pull', 'push'], page: 27,
    mouth: ['lips rounded (a little)', 'lips forward (a little)', 'jaw up (a little)', 'back of tongue up'],
    spell: [['u', 'put', ''], ['o', 'wolf', ''], ['oo', 'good', ''], ['ou', 'would', '']] },
  { c: 'uw', s: 'uː', len: 'long',  h: 'high',     f: 'back',    r: 'rounded',   t: 'tense', x: 81, y: 7,
    det: ['nearly high', 'back', 'rounded'], head: ['food', 'soon', 'loose'], page: 29,
    mouth: ['lips rounded', 'lips forward', 'jaw up', 'back of tongue up'],
    spell: [['oo', 'shoot', ''], ['oe', 'shoe', ''], ['u', 'rude', ''], ['ew', 'new', ''], ['o', 'lose', ''], ['ou', 'soup', '']] },
  { c: 'ah', s: 'ʌ',  len: 'short', h: 'mid-low',  f: 'central', r: 'unrounded', t: 'lax',   x: 50, y: 74, name: 'the caret',
    det: ['lower than mid-low', 'central', 'neutral'], head: ['cut', 'come', 'rush'], page: 33,
    mouth: ['tongue down', 'lips and jaw in relaxed position'],
    spell: [['u', 'cut', ''], ['o', 'come', ''], ['oo', 'blood', ''], ['oe', 'does', ''], ['ou', 'young', '']] },
  { c: 'er', s: 'ɜː', len: 'long',  h: 'mid',      f: 'central', r: 'unrounded', t: 'tense', x: 54, y: 50,
    det: ['between mid-high and mid-low, nearer to the latter', 'center', 'neutral'], head: ['bird', 'fern', 'purse'], page: 35,
    mouth: ['lips, tongue and jaw in relaxed position'], note: 'known as the hesitation sound',
    spell: [['ir', 'girl', 'Common'], ['er', 'her', 'Common'], ['ur', 'hurt', 'Common'], ['or', 'word', 'Less common'], ['ear', 'heard', 'Less common']] },
  { c: 'ax', s: 'ə',  len: 'short', h: 'mid',      f: 'central', r: 'unrounded', t: 'lax',   x: 46, y: 58, name: 'the schwa',
    det: ['halfway between high and low', 'central', 'neutral'], head: ['about', 'oppose', 'perhaps'], page: 37,
    mouth: ['relaxed tongue and lips'], note: 'a weak vowel in unstressed syllables',
    spell: [['a', 'away', 'Weak'], ['e', 'paper', 'Weak'], ['o', 'police', 'Weak'], ['u', 'support', 'Weak']] }
];
D.shortOrder = ['ɪ', 'e', 'æ', 'ʌ', 'ɒ', 'ʊ', 'ə'];
D.longOrder = ['iː', 'ɑː', 'ɔː', 'uː', 'ɜː'];

/* ---------- 8 diphthongs (start → end on the same chart) ---------- */
D.diphthongs = [
  { c: 'ia', s: 'ɪə', g: 'centring', from: [22, 17], to: [41, 46], head: ['beard', 'weird', 'fierce'], more: ['here', 'beer', 'ear', 'clear', 'fear', 'near'], page: 7, r0: 0, r1: 0 },
  { c: 'ea', s: 'eə', g: 'centring', from: [4, 71], to: [41, 54], head: ['aired', 'cairn', 'scare'], more: ['hair', 'bare', 'air', 'care', 'pear', 'bear'], page: 7, r0: 0, r1: 0 },
  { c: 'ua', s: 'ʊə', g: 'centring', from: [70, 29], to: [57, 43], head: ['moored', 'tour', 'lure'], more: ['pure', 'cure', 'sure'], page: 7, r0: 0.7, r1: 0 },
  { c: 'ey', s: 'eɪ', g: 'closing-i', from: [5, 58], to: [34, 26], head: ['paid', 'pain', 'face'], more: ['mate', 'say', 'grey', 'wait', 'great', 'play', 'aim', 'age'], page: 10, r0: 0, r1: 0,
    spell: [['a-e', 'mate'], ['ay', 'say'], ['ey', 'grey'], ['ai', 'wait'], ['ea', 'great']] },
  { c: 'ay', s: 'aɪ', g: 'closing-i', from: [35, 96], to: [41, 26], head: ['tide', 'time', 'nice'], more: ['smile', 'die', 'cry', 'why', 'wide', 'buy', 'fly'], page: 10, r0: 0, r1: 0,
    spell: [['i-e', 'smile'], ['ie', 'die'], ['y', 'cry']] },
  { c: 'oy', s: 'ɔɪ', g: 'closing-i', from: [88, 59], to: [45, 27], head: ['void', 'loin', 'voice'], more: ['boy', 'coin', 'toy', 'boil', 'choice', 'employ', 'enjoy'], page: 10, r0: 0.8, r1: 0,
    spell: [['oy', 'boy'], ['oi', 'coin']] },
  { c: 'ow', s: 'əʊ', g: 'closing-u', from: [52, 57], to: [60, 25], head: ['load', 'home', 'most'], more: ['old', 'stone', 'show', 'coat', 'toe', 'toast', 'comb', 'code'], page: 15, r0: 0, r1: 0.7,
    spell: [['o', 'old'], ['o-e', 'stone'], ['ow', 'show'], ['oa', 'coat'], ['oe', 'toe']] },
  { c: 'aw', s: 'aʊ', g: 'closing-u', from: [61, 96], to: [65, 28], head: ['loud', 'gown', 'house'], more: ['cow', 'how', 'sound', 'south', 'town', 'count'], page: 15, r0: 0, r1: 0.7,
    spell: [['ow', 'cow'], ['ou', 'loud']] }
];
D.groups = {
  'centring':  { ar: 'المتجهة للوسط', en: 'Centring diphthongs', end: 'ə', endAr: 'آخرها ' + ipa('ə') },
  'closing-i': { ar: 'الصاعدة إلى ɪ', en: 'Closing, ending in /ɪ/', end: 'ɪ', endAr: 'آخرها ' + ipa('ɪ') },
  'closing-u': { ar: 'الصاعدة إلى ʊ', en: 'Closing, ending in /ʊ/', end: 'ʊ', endAr: 'آخرها ' + ipa('ʊ') }
};
D.triphthongs = [
  { s: 'eɪə', base: 'eɪ', head: ['layer', 'player'] },
  { s: 'aɪə', base: 'aɪ', head: ['liar', 'fire', 'higher'] },
  { s: 'ɔɪə', base: 'ɔɪ', head: ['loyal', 'royal', 'lawyer'] },
  { s: 'əʊə', base: 'əʊ', head: ['lower', 'mower', 'slower'] },
  { s: 'aʊə', base: 'aʊ', head: ['power', 'hour', 'tower', 'flower'] }
];

/* ---------- Lexicon ----------
   word  transcription(target vowel in [ ])  spelling(vowel letters in [ ])  [! = not for word→vowel drills]
   Lecture lines keep the lecturer's notation (/e/, /eə/, /əʊ/, final ɪ). */
D.lexText = [
'@L3',
'beat b[iː]t b[ea]t', 'mean m[iː]n m[ea]n', 'peace p[iː]s p[ea]ce', 'feet f[iː]t f[ee]t', 'eat [iː]t [ea]t', 'scene s[iː]n sc[e]n[e]',
'me m[iː] m[e]', 'piece p[iː]s p[ie]ce', 'key k[iː] k[ey]', 'keys k[iː]z k[ey]s', 'keeps k[iː]ps k[ee]ps', 'pea p[iː] p[ea]', 'peas p[iː]z p[ea]s',
'seas s[iː]z s[ea]s', 'seat s[iː]t s[ea]t', 'bead b[iː]d b[ea]d', 'bean b[iː]n b[ea]n', 'beef b[iː]f b[ee]f', 'need n[iː]d n[ee]d',
'feel f[iː]l f[ee]l', 'queen kw[iː]n qu[ee]n', 'team t[iː]m t[ea]m', 'peak p[iː]k p[ea]k', 'geese g[iː]s g[ee]se', 'meat m[iː]t m[ea]t',
'dean d[iː]n d[ea]n', 'zeal z[iː]l z[ea]l', 'deal d[iː]l d[ea]l', 'meet m[iː]t m[ee]t', 'he h[iː] h[e]', 'see s[iː] s[ee]',
'bit b[ɪ]t b[i]t', 'fin f[ɪ]n f[i]n', 'fish f[ɪ]ʃ f[i]sh', 'pin p[ɪ]n p[i]n', 'king k[ɪ]ŋ k[i]ng', 'kid k[ɪ]d k[i]d', 'kit k[ɪ]t k[i]t',
'pink p[ɪ]ŋk p[i]nk', 'pig p[ɪ]g p[i]g', 'pick p[ɪ]k p[i]ck', 'fill f[ɪ]l f[i]ll', 'fit f[ɪ]t f[i]t', 'gym dʒ[ɪ]m g[y]m', 'bid b[ɪ]d b[i]d',
'hymn h[ɪ]m h[y]mn', 'miss m[ɪ]s m[i]ss', 'mid m[ɪ]d m[i]d', 'bill b[ɪ]l b[i]ll', 'dish d[ɪ]ʃ d[i]sh', 'zip z[ɪ]p z[i]p', 'give g[ɪ]v g[i]ve',
'chin tʃ[ɪ]n ch[i]n', 'win w[ɪ]n w[i]n', 'milk m[ɪ]lk m[i]lk', 'tip t[ɪ]p t[i]p', 'lip l[ɪ]p l[i]p', 'pit p[ɪ]t p[i]t',
'symbol s[ɪ]mbl s[y]mbol !', 'pretty prɪt[ɪ] prett[y] !', 'busy b[ɪ]zɪ b[u]sy !',
'orange ˈɒr[ɪ]ndʒ or[a]nge !', 'cabbage ˈkæb[ɪ]dʒ cabb[a]ge !', 'private ˈpraɪv[ɪ]t priv[a]te !', 'dances ˈdɑːns[ɪ]z danc[e]s !',
'wanted ˈwɒnt[ɪ]d want[e]d !', 'begin b[ɪ]ˈgɪn b[e]gin !', 'music ˈmjuːz[ɪ]k mus[i]c !', 'minute ˈmɪn[ɪ]t min[u]te !',
'bet b[e]t b[e]t', 'men m[e]n m[e]n', 'yes j[e]s y[e]s', 'pen p[e]n p[e]n', 'death d[e]θ d[ea]th', 'friend fr[e]nd fr[ie]nd',
'many m[e]nɪ m[a]ny !', 'said s[e]d s[ai]d', 'test t[e]st t[e]st', 'red r[e]d r[e]d', 'check tʃ[e]k ch[e]ck', 'shelf ʃ[e]lf sh[e]lf',
'leg l[e]g l[e]g', 'bed b[e]d b[e]d', 'hen h[e]n h[e]n', 'mess m[e]s m[e]ss', 'led l[e]d l[e]d', 'sell s[e]l s[e]ll', 'kept k[e]pt k[e]pt',
'zest z[e]st z[e]st', 'get g[e]t g[e]t', 'gem dʒ[e]m g[e]m', 'text t[e]kst t[e]xt', 'deaf d[e]f d[ea]f', 'pet p[e]t p[e]t',
'bat b[æ]t b[a]t', 'man m[æ]n m[a]n', 'gas g[æ]s g[a]s', 'mad m[æ]d m[a]d', 'bank b[æ]ŋk b[a]nk', 'bag b[æ]g b[a]g', 'back b[æ]k b[a]ck',
'can k[æ]n c[a]n', 'cash k[æ]ʃ c[a]sh', 'catch k[æ]tʃ c[a]tch', 'ham h[æ]m h[a]m', 'has h[æ]z h[a]s', 'hat h[æ]t h[a]t', 'bad b[æ]d b[a]d',
'mass m[æ]s m[a]ss', 'ban b[æ]n b[a]n', 'pat p[æ]t p[a]t', 'tax t[æ]ks t[a]x', 'cat k[æ]t c[a]t', 'chat tʃ[æ]t ch[a]t', 'jam dʒ[æ]m j[a]m',
'nap n[æ]p n[a]p', 'fat f[æ]t f[a]t',
'card k[ɑː]d c[ar]d', 'half h[ɑː]f h[al]f', 'pass p[ɑː]s p[a]ss', 'car k[ɑː] c[ar]', 'heart h[ɑː]t h[ear]t', 'calm k[ɑː]m c[al]m',
'cart k[ɑː]t c[ar]t', 'star st[ɑː] st[ar]', 'starve st[ɑː]v st[ar]ve', 'start st[ɑː]t st[ar]t', 'harm h[ɑː]m h[ar]m', 'halves h[ɑː]vz h[al]ves',
'ask [ɑː]sk [a]sk', 'after [ɑː]ftə [a]fter !', 'bath b[ɑː]θ b[a]th', 'dance d[ɑː]ns d[a]nce', 'hard h[ɑː]d h[ar]d', 'part p[ɑː]t p[ar]t',
'hearth h[ɑː]θ h[ear]th', 'dark d[ɑː]k d[ar]k', 'park p[ɑː]k p[ar]k', 'shark ʃ[ɑː]k sh[ar]k', 'barks b[ɑː]ks b[ar]ks', 'lark l[ɑː]k l[ar]k',
'pot p[ɒ]t p[o]t', 'gone g[ɒ]n g[o]ne', 'cross kr[ɒ]s cr[o]ss', 'dog d[ɒ]g d[o]g', 'wrong r[ɒ]ŋ wr[o]ng', 'rob r[ɒ]b r[o]b', 'rock r[ɒ]k r[o]ck',
'god g[ɒ]d g[o]d', 'got g[ɒ]t g[o]t', 'doll d[ɒ]l d[o]ll', 'dock d[ɒ]k d[o]ck', 'wash w[ɒ]ʃ w[a]sh', 'cod k[ɒ]d c[o]d', 'Tom t[ɒ]m T[o]m',
'loss l[ɒ]s l[o]ss', 'moss m[ɒ]s m[o]ss', 'bomb b[ɒ]m b[o]mb', 'shock ʃ[ɒ]k sh[o]ck', 'box b[ɒ]ks b[o]x', 'lock l[ɒ]k l[o]ck',
'want w[ɒ]nt w[a]nt', 'hot h[ɒ]t h[o]t',
'board b[ɔː]d b[oar]d', 'torn t[ɔː]n t[or]n', 'horse h[ɔː]s h[or]se', 'form f[ɔː]m f[or]m', 'call k[ɔː]l c[a]ll', 'war w[ɔː] w[ar]',
'cause k[ɔː]z c[au]se', 'saw s[ɔː] s[aw]', 'walk w[ɔː]k w[al]k', 'taught t[ɔː]t t[augh]t', 'thought θ[ɔː]t th[ough]t', 'four f[ɔː] f[our]',
'bore b[ɔː] b[ore]', 'bored b[ɔː]d b[ore]d', 'bought b[ɔː]t b[ough]t', 'caught k[ɔː]t c[augh]t', 'wall w[ɔː]l w[a]ll', 'cord k[ɔː]d c[or]d',
'corn k[ɔː]n c[or]n', 'course k[ɔː]s c[our]se', 'fought f[ɔː]t f[ough]t', 'source s[ɔː]s s[our]ce', 'talk t[ɔː]k t[al]k', 'worn w[ɔː]n w[or]n',
'raw r[ɔː] r[aw]', 'core k[ɔː] c[ore]',
'put p[ʊ]t p[u]t', 'pull p[ʊ]l p[u]ll', 'push p[ʊ]ʃ p[u]sh', 'full f[ʊ]l f[u]ll', 'good g[ʊ]d g[oo]d', 'foot f[ʊ]t f[oo]t', 'wolf w[ʊ]lf w[o]lf',
'would w[ʊ]d w[ou]ld', 'wood w[ʊ]d w[oo]d', 'took t[ʊ]k t[oo]k', 'could k[ʊ]d c[ou]ld', 'look l[ʊ]k l[oo]k', 'book b[ʊ]k b[oo]k',
'food f[uː]d f[oo]d', 'soon s[uː]n s[oo]n', 'loose l[uː]s l[oo]se', 'shoe ʃ[uː] sh[oe]', 'shoes ʃ[uː]z sh[oe]s', 'shoot ʃ[uː]t sh[oo]t',
'new nj[uː] n[ew]', 'lose l[uː]z l[o]se', 'soup s[uː]p s[ou]p', 'root r[uː]t r[oo]t', 'rude r[uː]d r[u]d[e]', 'room r[uː]m r[oo]m',
'roof r[uː]f r[oo]f', 'you j[uː] y[ou]', 'pool p[uː]l p[oo]l', 'noon n[uː]n n[oo]n', 'few fj[uː] f[ew]', 'boot b[uː]t b[oo]t',
'cool k[uː]l c[oo]l', 'rule r[uː]l r[u]l[e]', 'view vj[uː] v[iew]', 'June dʒ[uː]n J[u]n[e]', 'dew dj[uː] d[ew]', 'too t[uː] t[oo]', 'coo k[uː] c[oo]',
'but b[ʌ]t b[u]t', 'some s[ʌ]m s[o]me', 'rush r[ʌ]ʃ r[u]sh', 'come k[ʌ]m c[o]me', 'blood bl[ʌ]d bl[oo]d', 'cut k[ʌ]t c[u]t',
'young j[ʌ]ŋ y[ou]ng', 'does d[ʌ]z d[oe]s', 'must m[ʌ]st m[u]st', 'bud b[ʌ]d b[u]d', 'bun b[ʌ]n b[u]n', 'bus b[ʌ]s b[u]s', 'hub h[ʌ]b h[u]b',
'shut ʃ[ʌ]t sh[u]t', 'luck l[ʌ]k l[u]ck', 'thus ð[ʌ]s th[u]s', 'judge dʒ[ʌ]dʒ j[u]dge', 'gun g[ʌ]n g[u]n', 'fuss f[ʌ]s f[u]ss', 'putt p[ʌ]t p[u]tt',
'bird b[ɜː]d b[ir]d', 'fern f[ɜː]n f[er]n', 'purse p[ɜː]s p[ur]se', 'girl g[ɜː]l g[ir]l', 'her h[ɜː] h[er]', 'hurt h[ɜː]t h[ur]t',
'word w[ɜː]d w[or]d', 'heard h[ɜː]d h[ear]d', 'were w[ɜː] w[ere]', 'worst w[ɜː]st w[or]st', 'burn b[ɜː]n b[ur]n', 'birth b[ɜː]θ b[ir]th',
'earn [ɜː]n [ear]n', 'earth [ɜː]θ [ear]th', 'curt k[ɜː]t c[ur]t', 'turn t[ɜː]n t[ur]n', 'nurse n[ɜː]s n[ur]se', 'pearl p[ɜː]l p[ear]l',
'learn l[ɜː]n l[ear]n', 'shirt ʃ[ɜː]t sh[ir]t', 'cur k[ɜː] c[ur]',
'about [ə]ˈbaʊt [a]bout !', 'oppose [ə]ˈpəʊz [o]ppose !', 'perhaps p[ə]ˈhæps p[e]rhaps !', 'away [ə]ˈweɪ [a]way !', 'sugar ˈʃʊg[ə] sug[a]r !',
'garden ˈgɑːd[ə]n gard[e]n !', 'paper ˈpeɪp[ə] pap[e]r !', 'under ˈʌnd[ə] und[e]r !', 'police p[ə]ˈliːs p[o]lice !', 'doctor ˈdɒkt[ə] doct[o]r !',
'correct k[ə]ˈrekt c[o]rrect !', 'support s[ə]ˈpɔːt s[u]pport !', 'figure ˈfɪg[ə] fig[u]re !', 'color ˈkʌl[ə] col[o]r !', 'upper ˈʌp[ə] upp[e]r !',
'@L4',
'beard b[ɪə]d b[ear]d', 'weird w[ɪə]d w[eir]d', 'fierce f[ɪə]s f[ier]ce', 'here h[ɪə] h[ere]', 'beer b[ɪə] b[eer]', 'ear [ɪə] [ear]',
'clear kl[ɪə] cl[ear]', 'fear f[ɪə] f[ear]', 'near n[ɪə] n[ear]', 'Ian [ɪə]n [Ia]n', 'peer p[ɪə] p[eer]',
'aired [eə]d [air]ed', 'cairn k[eə]n c[air]n', 'scare sk[eə] sc[are]', 'hair h[eə] h[air]', 'bare b[eə] b[are]', 'air [eə] [air]',
'care k[eə] c[are]', 'pear p[eə] p[ear]', 'bear b[eə] b[ear]',
'moored m[ʊə]d m[oor]ed', 'tour t[ʊə] t[our]', 'lure l[ʊə] l[ure]', 'pure pj[ʊə] p[ure]', 'cure kj[ʊə] c[ure]', 'sure ʃ[ʊə] s[ure]', 'poor p[ʊə] p[oor]',
'paid p[eɪ]d p[ai]d', 'pain p[eɪ]n p[ai]n', 'face f[eɪ]s f[a]c[e]', 'mate m[eɪ]t m[a]t[e]', 'say s[eɪ] s[ay]', 'grey gr[eɪ] gr[ey]',
'wait w[eɪ]t w[ai]t', 'great gr[eɪ]t gr[ea]t', 'play pl[eɪ] pl[ay]', 'played pl[eɪ]d pl[ay]ed', 'grade gr[eɪ]d gr[a]d[e]', 'aim [eɪ]m [ai]m',
'age [eɪ]dʒ [a]g[e]', 'bay b[eɪ] b[ay]', 'late l[eɪ]t l[a]t[e]', 'raise r[eɪ]z r[ai]se', 'lake l[eɪ]k l[a]k[e]', 'eight [eɪ]t [eigh]t',
'plate pl[eɪ]t pl[a]t[e]', 'way w[eɪ] w[ay]', 'they ð[eɪ] th[ey]',
'tide t[aɪ]d t[i]d[e]', 'time t[aɪ]m t[i]m[e]', 'nice n[aɪ]s n[i]c[e]', 'smile sm[aɪ]l sm[i]l[e]', 'die d[aɪ] d[ie]', 'cry kr[aɪ] cr[y]',
'why w[aɪ] wh[y]', 'wide w[aɪ]d w[i]d[e]', 'buy b[aɪ] b[uy]', 'buys b[aɪ]z b[uy]s', 'fly fl[aɪ] fl[y]', 'flies fl[aɪ]z fl[ie]s',
'light l[aɪ]t l[igh]t', 'white w[aɪ]t wh[i]t[e]', 'rise r[aɪ]z r[i]s[e]', 'file f[aɪ]l f[i]l[e]', 'like l[aɪ]k l[i]k[e]', 'bike b[aɪ]k b[i]k[e]',
'might m[aɪ]t m[igh]t', 'type t[aɪ]p t[y]p[e]', 'quite kw[aɪ]t qu[i]t[e]', 'style st[aɪ]l st[y]l[e]', 'hi h[aɪ] h[i]',
'void v[ɔɪ]d v[oi]d', 'loin l[ɔɪ]n l[oi]n', 'voice v[ɔɪ]s v[oi]ce', 'boy b[ɔɪ] b[oy]', 'coin k[ɔɪ]n c[oi]n', 'toy t[ɔɪ] t[oy]',
'boil b[ɔɪ]l b[oi]l', 'choice tʃ[ɔɪ]s ch[oi]ce', 'employ ɪmpl[ɔɪ] empl[oy] !', 'enjoy ɪndʒ[ɔɪ] enj[oy] !', 'oil [ɔɪ]l [oi]l', 'join dʒ[ɔɪ]n j[oi]n',
'noise n[ɔɪ]z n[oi]se', 'point p[ɔɪ]nt p[oi]nt', 'coil k[ɔɪ]l c[oi]l',
'load l[əʊ]d l[oa]d', 'home h[əʊ]m h[o]m[e]', 'most m[əʊ]st m[o]st', 'old [əʊ]ld [o]ld', 'stone st[əʊ]n st[o]n[e]', 'show ʃ[əʊ] sh[ow]',
'coat k[əʊ]t c[oa]t', 'toe t[əʊ] t[oe]', 'toast t[əʊ]st t[oa]st', 'comb k[əʊ]m c[o]mb', 'code k[əʊ]d c[o]d[e]', 'roll r[əʊ]l r[o]ll',
'rose r[əʊ]z r[o]s[e]', 'rope r[əʊ]p r[o]p[e]', 'know n[əʊ] kn[ow]', 'phone f[əʊ]n ph[o]n[e]', 'boat b[əʊ]t b[oa]t', 'coast k[əʊ]st c[oa]st',
'toes t[əʊ]z t[oe]s', 'blows bl[əʊ]z bl[ow]s', 'bowl b[əʊ]l b[ow]l', 'tone t[əʊ]n t[o]n[e]', 'phoned f[əʊ]nd ph[o]n[e]d', 'go g[əʊ] g[o]',
'loud l[aʊ]d l[ou]d', 'gown g[aʊ]n g[ow]n', 'house h[aʊ]s h[ou]se', 'cow k[aʊ] c[ow]', 'how h[aʊ] h[ow]', 'sound s[aʊ]nd s[ou]nd',
'south s[aʊ]θ s[ou]th', 'town t[aʊ]n t[ow]n', 'count k[aʊ]nt c[ou]nt', 'now n[aʊ] n[ow]', 'found f[aʊ]nd f[ou]nd',
'houses ˈh[aʊ]zɪz h[ou]ses !', 'ground gr[aʊ]nd gr[ou]nd', 'out [aʊ]t [ou]t',
'layer l[eɪə] l[aye]r', 'player pl[eɪə] pl[aye]r', 'liar l[aɪə] l[ia]r', 'fire f[aɪə] f[ire]', 'higher h[aɪə] h[igh]er', 'flyer fl[aɪə] fl[ye]r',
'loyal l[ɔɪə]l l[oya]l', 'royal r[ɔɪə]l r[oya]l', 'lawyer l[ɔɪə] l[awye]r', 'soya s[ɔɪə] s[oya]', 'lower l[əʊə] l[owe]r', 'mower m[əʊə] m[owe]r',
'slower sl[əʊə] sl[owe]r', 'power p[aʊə] p[owe]r', 'hour [aʊə] h[our]', 'tower t[aʊə] t[owe]r', 'our [aʊə] [our]', 'flower fl[aʊə] fl[owe]r'
];

/* Corrections the lecturer's slides need (user decision: correct + note). */
D.slideNotes = {
  death: 'الشريحة كتبتها /deɵ/، والصحيح /deθ/.',
  bath: 'الشريحة كتبتها /bɑːɵ/، والصحيح /bɑːθ/.',
  birth: 'الشريحة كتبتها /bɜːɵ/، والصحيح /bɜːθ/.',
  south: 'الشريحة كتبتها /saʊɵ/، والصحيح /saʊθ/.',
  flyer: 'الشريحة كتبتها /faɪə/ بدون /l/، والصحيح /flaɪə/.'
};

/* ---------- Assignment 2 (exam pattern) ---------- */
D.assignment = {
  part1: [
    ['mid, front, unrounded, lax', 'e'], ['mid, central, unrounded, tense', 'ɜː'], ['low, back, unrounded, tense', 'ɑː'],
    ['low, back, rounded, lax', 'ɒ'], ['mid-high, back, rounded, tense', 'ɔː'], ['high, back, rounded, lax', 'ʊ'],
    ['high, back, rounded, tense', 'uː'], ['mid-low, central, unrounded, lax', 'ʌ'], ['high, front, unrounded, tense', 'iː'],
    ['high, front, unrounded, lax', 'ɪ'], ['mid, central, unrounded, lax', 'ə'], ['low, front, unrounded, lax', 'æ']
  ],
  part2: ['ban', 'hub', 'fill', 'moss', 'led', 'seat', 'dark', 'bird', 'fought', 'part', 'put', 'come', 'mid', 'bomb', 'sell', 'food', 'curt', 'park', 'need', 'horse'],
  part3: ['tone', 'style', 'out', 'way', 'beer', 'coil', 'hair', 'why', 'they', 'here', 'cure', 'wait', 'white', 'point', 'found', 'phoned']
};

/* ---------- Mouth articulators (L2 p7, p13) ---------- */
D.articulators = {
  nose:    ['الأنف', 'nose'],
  nasal:   ['تجويف الأنف', 'nasal cavity'],
  ulip:    ['الشفة العليا', 'upper lip'],
  llip:    ['الشفة السفلى', 'lower lip'],
  uteeth:  ['الأسنان العليا', 'upper teeth'],
  lteeth:  ['الأسنان السفلى', 'lower teeth'],
  ridge:   ['اللثة', 'alveolar ridge'],
  hard:    ['الحنك الصلب', 'hard palate'],
  velum:   ['الحنك اللين', 'soft palate (velum)'],
  uvula:   ['اللهاة', 'uvula'],
  tip:     ['طرف اللسان', 'tongue tip'],
  blade:   ['نصل اللسان', 'blade'],
  tfront:  ['مقدّم اللسان', 'front of the tongue'],
  tback:   ['مؤخّر اللسان', 'back of the tongue'],
  root:    ['جذر اللسان', 'root'],
  pharynx: ['البلعوم', 'pharynx'],
  larynx:  ['الحنجرة', 'larynx']
};

/* ---------- Lessons ----------
   Block keys: h (heading), p, def, list, table, compare, words, spell, chart, glide, mouth, note, more, tree, vtable */
D.lessons = [
/* ===== L3 ===== */
{ id: 'l3-intro', lec: 'L3', ar: 'الحروف الصوتية الأحادية', en: 'Monophthongs', min: 6, blocks: [
  { p: 'الحروف الصوتية ' + en('(vowels)') + ' في الإنجليزية ثلاثة أنواع. اسمعي الصوت داخل المقطع: هل يبقى كما هو، أم يتغيّر؟' },
  { tree: { root: ['English vowels', 'الحروف الصوتية'], kids: [
    ['Monophthong (Pure vowel)', 'أحادي (نقي)', 'صوت واحد ثابت داخل المقطع', 'he /hiː/'],
    ['Diphthong', 'مزدوج', 'ينتقل من صوت إلى صوت آخر داخل المقطع', 'hi /haɪ/'],
    ['Triphthong', 'ثلاثي', 'يمرّ بثلاثة أصوات متتالية داخل المقطع', 'higher /haɪə/'] ] }, src: pg('L3', 2) },
  { h: 'القصيرة والطويلة', en: 'Short / Long' },
  { compare: [
    { t: 'Short vowels', ar: 'القصيرة مرتخية', en: 'lax', items: ['تشدّين العضلات أقل وتبذلين جهدًا أقل', en('less muscular tension'), '7 حروف: ' + ipa('ɪ, e, æ, ʌ, ɒ, ʊ, ə')] },
    { t: 'Long vowels', ar: 'الطويلة مشدودة', en: 'tense', items: ['تشدّين العضلات أكثر وتبذلين جهدًا أكبر', en('greater muscular tension'), '5 حروف: ' + ipa('iː, ɜː, ɑː, ɔː, uː')] }
  ], src: pg('L3', 4) },
  { p: 'المجموع 12 حرفًا ' + en('(12 pure vowels)') + '. ورمز الحرف الطويل فيه علامة الطول ' + ipa('ː') + '.' },
  { h: 'ما الفرق بين القصير والطويل؟', en: 'Quantity & Quality' },
  { def: ['Quantity (length)', 'الطول', 'Long vowels tend to be longer than the short vowels "in similar contexts".', 'الحرف الطويل أطول من القصير إذا جاءا في كلمات متشابهة.'], src: pg('L3', 5) },
  { def: ['Quality', 'نوع الصوت', 'resulting from the difference in tongue shape, tongue position, and lip rounding.', 'يتغيّر الصوت عندما يتغيّر شكل اللسان أو مكانه أو شكل الشفتين.'], src: pg('L3', 5) },
  { more: 'الحرف نفسه يطول ويقصر حسب موقعه', blocks: [
    { p: 'يطول صوت الحرف في مقطع عليه ضغط ' + en('(stressed)') + ' مقارنة بمقطع بلا ضغط.' },
    { p: 'مثال: ' + en('busy') + '، والضغط فيها على المقطع الأول.' },
    { p: 'في الكلمة ذات المقطع الواحد، يطول الحرف في المقطع المفتوح أكثر من المغلق. ينتهي المفتوح بحرف صوتي. ينتهي المغلق بحرف ساكن.' },
    { words: ['me', 'mean', 'may', 'main'] },
    { p: 'في المقطع المغلق، يطول الحرف إذا جاء بعده حرف ساكن ' + en('voiced') + '. يعني أن الأحبال الصوتية تهتز معه.' },
    { p: 'مثال على الساكن الذي يهتز: ' + en('ad') + '.' },
    { p: 'ومثال على الساكن الذي لا يهتز: ' + en('at') + '.' },
    { words: ['ad', 'at', 'bead', 'beat'], src: pg('L3', 6) }
  ] },
  { h: 'كيف نصف الحرف؟', en: 'Tongue height · position · lips · tenseness' },
  { p: 'نصف كل حرف بأربع صفات، وبهذا الترتيب جاءت في ' + en('Assignment 2') + ':' },
  { vdesc: true },
  { note: 'للارتفاع تستخدم الدكتورة ' + en('high / mid-high / mid / mid-low / low') + '، وليس ' + en('close / open') + '. اكتبيها في الاختبار بكلماتها نفسها.' }
] },
{ id: 'l3-short', lec: 'L3', ar: 'الحروف القصيرة', en: 'Short vowels · lax', min: 9, blocks: [
  { p: 'سبعة حروف قصيرة، وكلها مرتخية ' + en('(lax)') + '. <span class="dim">المسي أي حرف في المخطط لتسمعي كلمته، وانظري إلى مكانه.</span>' },
  { chart: 'short' },
  { h: 'كيف تُكتب في الكلمات؟', en: 'Transcription and spelling' },
  { spell: ['ih', 'eh', 'ae', 'oh', 'uh', 'ah', 'ax'] }
] },
{ id: 'l3-long', lec: 'L3', ar: 'الحروف الطويلة', en: 'Long vowels · tense', min: 8, blocks: [
  { p: 'خمسة حروف طويلة، وكلها مشدودة ' + en('(tense)') + '. <span class="dim">قارنيها بالحروف القصيرة القريبة منها على المخطط.</span>' },
  { chart: 'long' },
  { h: 'كيف تُكتب في الكلمات؟', en: 'Transcription and spelling' },
  { spell: ['iy', 'aa', 'ao', 'uw', 'er'] },
  { note: 'في جنوب شرق إنجلترا، يُنطق الحرف المكتوب ' + en('a') + ' بصوت طويل.' },
  { p: 'رمز هذا الصوت هو ' + ipa('ɑː') + '.' },
  { p: 'يحدث ذلك إذا جاء بعده أحد هذه الحروف.' },
  { words: ['s', 'f', 'th', 'n'] },
  { words: ['ask', 'pass', 'after', 'bath', 'dance'], src: pg('L3', 21) }
] },
{ id: 'l3-pairs', lec: 'L3', ar: 'أزواج متشابهة', en: 'Pairs that look alike', min: 6, blocks: [
  { p: 'بعض الحروف في أوصاف الدكتورة تتشابه كثيرًا. كل زوج يختلف في صفة أو صفتين فقط. قارنيهما لتري الفرق.' },
  { table: { head: ['الزوج', 'الفرق', 'مثال'], rows: [
    [ipa('iː') + ' ' + ipa('ɪ'), 'tense / lax', en('seat · fill')],
    [ipa('uː') + ' ' + ipa('ʊ'), 'tense / lax', en('food · put')],
    [ipa('ɜː') + ' ' + ipa('ə'), 'tense / lax', en('bird · about')],
    [ipa('ɑː') + ' ' + ipa('ɒ'), 'unrounded tense / rounded lax', en('dark · moss')],
    [ipa('ɑː') + ' ' + ipa('ʌ'), 'low back / mid-low central', en('part · come')],
    [ipa('ɒ') + ' ' + ipa('ɔː'), 'low lax / mid-high tense', en('bomb · horse')],
    [ipa('e') + ' ' + ipa('æ'), 'mid / low', en('sell · ban')]
  ] } },
  { chart: 'all' }
] },
/* ===== L4 ===== */
{ id: 'l4-intro', lec: 'L4', ar: 'الحروف المزدوجة', en: 'Diphthongs', min: 6, blocks: [
  { def: ['Diphthongs', 'الحروف المزدوجة', 'sounds that consist of a movement or a glide from one vowel to another.', 'تسمعين الصوت ينتقل بسلاسة ' + en('(glide)') + ' من حرف صوتي إلى حرف صوتي آخر.'], src: pg('L4', 5) },
  { p: 'طولها مثل طول الحروف الطويلة.' },
  { p: 'ابدئي بجزء أطول وأقوى بكثير من الثاني.' },
  { p: 'مثال: ' + en('hi') + '.' },
  { p: 'في النطق ' + ipa('haɪ') + '، الجزء الأول أطول وأقوى، والثاني أقصر وأهدأ.', src: pg('L4', 5) },
  { h: 'ثلاث مجموعات', en: 'Classification' },
  { tree: { root: ['Diphthongs (8)', 'الحروف المزدوجة'], kids: [
    ['Centring', 'تتجه للوسط', 'تنتهي بالصوت /ə/ في وسط المخطط', 'ɪə · eə · ʊə'],
    ['Closing → ɪ', 'صاعدة إلى ɪ', 'تنتهي بالصوت /ɪ/', 'eɪ · aɪ · ɔɪ'],
    ['Closing → ʊ', 'صاعدة إلى ʊ', 'تنتهي بالصوت /ʊ/', 'əʊ · aʊ'] ] }, src: pg('L4', 6) },
  { glide: 'all' },
  { note: 'انظري إلى الرمز في النهاية لتعرفي المجموعة.' },
  { table: { head: ['الرمز في النهاية', 'المجموعة'], rows: [
    [ipa('ə'), en('centring')],
    [ipa('ɪ'), en('closing')],
    [ipa('ʊ'), en('closing')]
  ] } }
] },
{ id: 'l4-centring', lec: 'L4', ar: 'المزدوجة المتجهة للوسط', en: 'Centring diphthongs', min: 6, blocks: [
  { def: ['Centring diphthongs', 'المتجهة للوسط', 'diphthongs that glide towards the ə (schwa) vowel.', 'يبدأ الصوت بحرف صوتي ثم ينتهي عند ' + ipa('ə') + '. تجدين هذا الرمز في وسط المخطط. لذلك اسمها ' + en('centring') + '.'], src: pg('L4', 7) },
  { glide: 'centring' },
  { p: 'تحتوي أمثلتها كلها على الحرف ' + en('r') + ' الذي لا يُنطق.' },
  { words: ['beard', 'aired', 'tour'] },
  { rsheet: true }
] },
{ id: 'l4-closing-i', lec: 'L4', ar: 'الصاعدة إلى ɪ', en: 'Closing diphthongs ending in /ɪ/', min: 7, blocks: [
  { def: ['Closing diphthongs', 'المزدوجة الصاعدة', 'characterized by a glide from a relatively more open vowel towards a relatively closer vowel.', 'يبدأ الصوت بحرف أوسع، وينتهي بحرف أضيق. لذلك اسمها ' + en('closing') + '.'], src: pg('L4', 9) },
  { glide: 'closing-i' },
  { h: 'ثلاث كلمات متشابهة', en: 'buy · boy · bay' },
  { table: { head: ['الكلمة', 'النطق', 'الحرف المزدوج'], rows: [[en('buy'), ipa('baɪ'), ipa('aɪ')], [en('boy'), ipa('bɔɪ'), ipa('ɔɪ')], [en('bay'), ipa('beɪ'), ipa('eɪ')]] }, src: pg('L4', 13) }
] },
{ id: 'l4-closing-u', lec: 'L4', ar: 'الصاعدة إلى ʊ', en: 'Closing diphthongs ending in /ʊ/', min: 6, blocks: [
  { glide: 'closing-u' },
  { h: 'ثلاثة أزواج متشابهة', en: 'found · phoned' },
  { table: { head: ['الكلمة', 'النطق', 'الحرف المزدوج'], rows: [[en('found'), ipa('faʊnd'), ipa('aʊ')], [en('phoned'), ipa('fəʊnd'), ipa('əʊ')], [en('now'), ipa('naʊ'), ipa('aʊ')], [en('know'), ipa('nəʊ'), ipa('əʊ')], [en('loud'), ipa('laʊd'), ipa('aʊ')], [en('load'), ipa('ləʊd'), ipa('əʊ')]] }, src: pg('L4', 17) }
] },
{ id: 'l4-tri', lec: 'L4', ar: 'الحروف الثلاثية', en: 'Triphthongs', min: 6, blocks: [
  { def: ['Triphthongs', 'الحروف الثلاثية', 'a glide from one vowel to another and then to a third, produced rapidly and without interruption.', 'تسمعين ثلاثة أصوات تتتابع بسرعة، دون توقف بينها.'], src: pg('L4', 20) },
  { p: 'القاعدة في المحاضرة: ' + en('the five closing diphthongs with /ə/ added on the end') + '. اختاري واحدًا من الحروف المزدوجة الصاعدة الخمسة. ثم أضيفي ' + ipa('ə') + ' في آخره.' },
  { glide: 'tri' },
  { note: 'هذه الحروف أعقد نوع من الحروف الصوتية. يصعب نطقها وتمييزها إذا لم تنطقيها بعناية. ' + pg('L4', 20) }
] },
{ id: 'l4-rpga', lec: 'L4', ar: 'اللهجة البريطانية والأمريكية', en: 'RP / GA vowels', min: 4, blocks: [
  { p: 'تقارن الدكتورة اللهجة البريطانية ' + en('(RP)') + ' بالأمريكية في الحروف الصوتية.' },
  { p: 'اسم الأمريكية في المحاضرة ' + en('(GA)') + '.' },
  { table: { head: ['', 'RP', 'GA'], rows: [
    ['الحروف القصيرة', '7، وفيها ' + ipa('ɒ'), '7، وفيها ' + ipa('ɑ') + ' بدلًا منه'],
    ['مثال', en('hot') + ' ' + ipa('hɒt'), en('hot') + ' ' + ipa('hɑt')],
    ['الحروف الطويلة', '5', '5، الحروف نفسها'],
    ['الحروف المزدوجة', '8: centring + closing', '5: closing فقط']
  ] }, src: pg('L4', 24) + ' ' + pg('L4', 26) },
  { note: 'يعني أن اللهجة الأمريكية ' + en('(GA)') + ' لا تحتوي على هذه الحروف المزدوجة.' },
  { list: [ipa('ɪə'), ipa('eə'), ipa('ʊə')] },
] },
/* ===== L1 ===== */
{ id: 'l1-ling', lec: 'L1', ar: 'علم اللغة وفروعه', en: 'Linguistics', min: 5, blocks: [
  { def: ['Linguistics', 'علم اللغة', 'the scientific study of human language.', 'يدرس لغة البشر بطريقة علمية.'], src: pg('L1', 3) },
  { tree: { root: ['Theoretical linguistics', 'علم اللغة النظري'], kids: [
    ['Sound', 'الصوت', 'Phonetics · Phonology', ''],
    ['Structure', 'البنية', 'Morphology · Syntax', ''],
    ['Meaning', 'المعنى', 'Semantics · Pragmatics', ''] ] }, src: pg('L1', 4) },
  { table: { head: ['الفرع', 'ماذا يدرس'], rows: [
    [en('Phonetics'), 'خصائص أصوات الكلام'], [en('Phonology'), 'نظام الأصوات وأنماطها في لغة معيّنة'], [en('Morphology'), 'كيف تتكوّن الكلمات'],
    [en('Syntax'), 'كيف تتكوّن العبارات والجمل'], [en('Semantics'), 'معنى الكلمات والعبارات والجمل'], [en('Pragmatics'), 'ما يقصده المتكلم، وكيف نفهم منه أكثر مما يقول']
  ] }, src: pg('L1', 4) },
  { def: ['Applied linguistics', 'علم اللغة التطبيقي', 'the application of linguistic theories, methods, and findings to solve the language problems which have arisen in other areas of experience.', 'نستخدم نظريات علم اللغة وطرقه ونتائجه لحل مشكلات اللغة في مجالات أخرى.'], src: pg('L1', 5) },
  { more: 'فروع علم اللغة التطبيقي', blocks: [
    { p: 'له ثمانية فروع في المحاضرة:' },
    { list: [en('Psycholinguistics'), en('Sociolinguistics'), en('Anthropological linguistics'), en('Stylistics'), en('Computational linguistics'), en('TESL and TEFL'), en('CALL'), en('Language acquisition and learning')] }
  ] },
  { def: ['RP', 'النطق البريطاني المعياري', 'the accent normally chosen as the standard for people learning the English spoken in England.', 'يتعلمها عادةً من يدرسون إنجليزية إنجلترا. يتحدث بها أغلب مذيعي ' + en('BBC') + '. الاسم المفضّل لها: ' + en('BBC pronunciation') + '.'], src: pg('L1', 6) }
] },
{ id: 'l1-phon', lec: 'L1', ar: 'علم الأصوات والنظام الصوتي', en: 'Phonetics vs Phonology', min: 5, blocks: [
  { compare: [
    { t: 'Phonetics', ar: 'علم الأصوات', items: ['يدرس كيف ننطق الأصوات وكيف تنتقل وكيف نسمعها', 'يهتم بالأصوات التي ننطقها ونسمعها', '3 فروع'] },
    { t: 'Phonology', ar: 'علم النظام الصوتي', items: ['نظام الأصوات وأنماطها في لغة معيّنة', 'يهتم بنظام الأصوات في الذهن', 'فرعان'] }
  ], src: pg('L1', 7) + ' ' + pg('L1', 9) },
  { h: 'فروع علم الأصوات', en: 'Three branches' },
  { table: { head: ['الفرع', 'يدرس'], rows: [[en('Articulatory'), 'كيف ننطق الأصوات'], [en('Acoustic'), 'كيف تنتقل الأصوات في الهواء على شكل موجات'], [en('Auditory / perceptual'), 'كيف نسمع الأصوات ونفهمها']] }, src: pg('L1', 7) },
  { h: 'فروع علم النظام الصوتي', en: 'Two branches' },
  { table: { head: ['الفرع', 'يدرس'], rows: [[en('Segmental'), 'يقسم الكلام إلى وحدات منفصلة. من موضوعاته: ' + en('phoneme, allophone, syllable')], [en('Suprasegmental'), 'صفات تمتد على أكثر من صوت، مثل الضغط والتنغيم ' + en('(stress, intonation)')]] }, src: pg('L1', 9) }
] },
{ id: 'l1-phoneme', lec: 'L1', ar: 'الفونيم والألوفون', en: 'Phoneme · Allophone · IPA', min: 6, blocks: [
  { def: ['Phoneme', 'الفونيم', 'the meaning-distinguishing sound unit in a language.', 'صوت يغيّر معنى الكلمة إذا استبدلتِه بصوت آخر.'], src: pg('L1', 11) },
  { p: 'انظري إلى هذه الكلمات.' },
  { words: ['pit', 'pat', 'pot', 'pet', 'put'] },
  { p: 'تختلف في صوت واحد، لذلك هذه الأصوات فونيمات. وفي نظام ' + en('RP') + ' <b>44</b> فونيمًا.' },
  { def: ['Allophone', 'الألوفون', 'the different realizations of a phoneme according to its context.', 'قد تنطقين الفونيم نفسه بطرق مختلفة حسب موقعه في الكلام. هذه الطرق تتشابه جدًا ولا تغيّر المعنى. كل طريقة تأتي في موقع مختلف.'], src: pg('L1', 15) },
  { def: ['IPA', 'الأبجدية الصوتية الدولية', 'special symbols used in phonemic transcription to represent speech sounds.', 'رموز خاصة نكتب بها الأصوات، ونضعها بين خطين مائلين ' + ipa(' ') + '.'], src: pg('L1', 12) },
  { h: 'الكتابة لا تطابق النطق', en: 'Spelling ≠ sound' },
  { table: { head: ['الكلمات', 'الصوت'], rows: [[en('Cat = kitchen'), ipa('k')], [en('Phone = Floor = laugh'), ipa('f')], [en('Sea ≠ Sure'), ipa('s') + ' ≠ ' + ipa('ʃ')], [en('Green ≠ Garage'), ipa('g') + ' ≠ ' + ipa('dʒ')]] }, src: pg('L1', 12) },
  { more: 'جدول رموز RP (44)', blocks: [{ rptable: true }] }
] },
{ id: 'l1-supra', lec: 'L1', ar: 'المقطع والضغط والتنغيم', en: 'Syllable · Stress · Intonation', min: 5, blocks: [
  { def: ['Syllable', 'المقطع', 'a unit of pronunciation consisting of a basic vowel sound and optional consonants before or after the vowel.', 'جزء من الكلمة فيه حرف صوتي أساسي. قد تأتي حروف ساكنة قبله أو بعده. لعدّ المقاطع، عدّي أصوات الحروف الصوتية التي تسمعينها، لا الحروف المكتوبة.'], src: pg('L1', 16) },
  { table: { head: ['الكلمة', 'التقطيع', 'عدد المقاطع'], rows: [[en('Dog'), ipa('dɒg'), '1'], [en('Busy'), ipa('ˈbɪz.i'), '2'], [en('Hungry'), ipa('ˈhʌŋ.gri'), '2'], [en('Adorable'), ipa('əˈdɔː.rə.bəl'), '4'], [en('University'), ipa('ˌjuː.nɪˈvɜː.sə.ti'), '5'], [en('College'), ipa('ˈkɒl.ɪdʒ'), '2']] }, src: pg('L1', 18) },
  { def: ['Stress', 'الضغط', 'the relative strength in the pronunciation of a syllable, making it louder and longer.', 'تنطقين المقطع الذي عليه ضغط ' + en('(stressed)') + ' بصوت أعلى ووقت أطول. أمثلة: ' + en('ba-NA-na, BEAU-ti-ful, in-for-MA-tion') + '.'], src: pg('L1', 20) },
  { def: ['Intonation', 'التنغيم', 'the use of the pitch of the voice to convey meaning.', 'نغمة الصوت ' + en('(pitch)') + ' ترتفع أو تنخفض، فيتغيّر المعنى.'], src: pg('L1', 22) },
  { table: { head: ['النغمة', 'المعنى', 'مثال'], rows: [['هابطة ↘', 'جملة خبرية، أو ملل', en('The glass is on the table.')], ['صاعدة ↗', 'سؤال جوابه نعم أو لا، أو استغراب', en('The glass is on the table?')]] }, src: pg('L1', 22) }
] },
/* ===== L2 ===== */
{ id: 'l2-organs', lec: 'L2', ar: 'أعضاء النطق', en: 'The articulators', min: 6, blocks: [
  { p: 'يخرج الهواء من الرئتين ← القصبة الهوائية ← الحنجرة ← البلعوم ← الفم أو الأنف. <span class="dim">المسي أي جزء في الرسم ليظهر اسمه.</span>' },
  { mouth: 'label' },
  { def: ['Articulators', 'أعضاء النطق', 'The parts of the vocal tract used to form sounds.', 'أجزاء ممر الهواء فوق الحنجرة ' + en('(vocal tract)') + '، ونكوّن بها الأصوات.'], src: pg('L2', 6) },
  { table: { head: ['العضو', 'وصفه في المحاضرة'], rows: [
    [en('Alveolar ridge'), 'اللثة: بين الأسنان الأمامية العليا والحنك الصلب، وسطحها فيه نتوءات صغيرة'],
    [en('Hard palate'), 'الحنك الصلب: سقف الفم، وسطحه أملس وصلب'],
    [en('Soft palate (velum)'), 'الحنك اللين: الجزء اللين في آخر سقف الفم. إذا ارتفع خرج الهواء من الفم، وإذا نزل خرج من الأنف'],
    [en('Pharynx'), 'البلعوم أنبوب من عضلات يشبه القمع. يبدأ فوق الحنجرة'],
    [en('Larynx'), 'تتكوّن الحنجرة من غضروفين كبيرين فيهما فراغ. تقع فوق القصبة الهوائية، وفيها الأحبال الصوتية'],
    [en('Tongue'), 'اللسان: خمسة أجزاء، هي ' + en('tip, blade, front, back, root')]
  ] }, src: pg('L2', 8) + ' ' + pg('L2', 13) }
] },
{ id: 'l2-voicing', lec: 'L2', ar: 'اهتزاز الأحبال الصوتية', en: 'Voicing', min: 5, blocks: [
  { def: ['Voicing', 'اهتزاز الأحبال الصوتية', 'if vocal folds vibrate or not.', 'هل تهتز الأحبال الصوتية ' + en('(vocal folds)') + ' مع الحرف أو لا؟'], src: pg('L2', 20) },
  { compare: [
    { t: 'Voiceless', ar: 'بلا اهتزاز', items: ['تبتعد الأحبال الصوتية عن بعضها', 'الهواء يمرّ بحرية'] },
    { t: 'Voiced', ar: 'مع اهتزاز', items: ['تقترب الأحبال الصوتية من بعضها', 'الهواء يجعلها تهتز'] }
  ], src: pg('L2', 21) },
  { table: { head: ['الاهتزاز', 'أمثلة'], rows: [
    ['بلا اهتزاز', en('p, t, k, f, θ, s, ʃ, tʃ, h')],
    ['مع اهتزاز', en('b, d, g, v, ð, z, ʒ, dʒ, m, n, ŋ, l, r, w, j')]
  ] }, src: pg('L2', 21) },
  { p: 'جرّبي: ضعي يدك على حلقك. انطقي ' + ipa('s') + '. ثم انطقي ' + ipa('z') + '. ستحسّين بالاهتزاز مع ' + ipa('z') + ' فقط.' },
  { table: { head: ['وضع الأحبال الصوتية', 'الصوت'], rows: [['Wide apart', 'متباعدة: تنفّس عادي، وحروف بلا اهتزاز مثل ' + ipa('p, f, s')], ['Narrow glottis', 'فتحة ضيقة: ' + ipa('h')], ['Vibration', 'تهتز: حروف ' + en('voiced') + '. أمثلتها ' + ipa('b, d, g')], ['Tightly closed', 'تنغلق تمامًا: ' + ipa('ʔ') + '، واسمه ' + en('glottal stop')]] }, src: pg('L2', 9) },
  { note: 'تهتز الأحبال الصوتية مع كل الحروف الصوتية ' + en('voiced') + '. يخرج هواؤها من الفم ' + en('(oral)') + '. يحدث ذلك لأن الحنك اللين يرتفع. ' + pg('L2', 49) },
  { more: 'الحروف القوية والضعيفة ' + en('(fortis / lenis)'), blocks: [
    { p: 'في المحاضرة اسم آخر للحروف التي بلا اهتزاز: ' + en('fortis') + '.' },
    { p: 'يعني قوية. الحروف في الجدول أدناه.' },
    { p: 'وأما التي فيها اهتزاز فاسمها ' + en('lenis') + '.' },
    { p: 'يعني ضعيفة. الحروف في الجدول أدناه.' },
    { table: { head: ['الاسم', 'الحروف'], rows: [
      [en('fortis'), en('p, t, k, f, θ, s, ʃ')],
      [en('lenis'), en('b, d, g, v, ð, z, ʒ')]
    ] }, src: pg('L2', 39) }
  ] }
] },
{ id: 'l2-place', lec: 'L2', ar: 'مكان وطريقة النطق', en: 'Place & manner', min: 7, blocks: [
  { table: { head: ['المكان', 'العضوان', 'الأصوات'], rows: [
    [en('Bilabial'), 'الشفتان', ipa('p, b, m')], [en('Labiodental'), 'الشفة السفلى + الأسنان العليا', ipa('f, v')], [en('Dental'), 'طرف اللسان + الأسنان العليا', ipa('θ, ð')],
    [en('Alveolar'), 'طرف اللسان أو نصله + اللثة', ipa('t, d, s, z, l, r, n')], [en('Post-alveolar'), 'نصل اللسان + آخر اللثة', ipa('ʃ, ʒ, tʃ, dʒ')], [en('Palatal'), 'مقدّم اللسان + الحنك الصلب', ipa('j')],
    [en('Velar'), 'مؤخّر اللسان + الحنك اللين', ipa('k, g, ŋ, w')], [en('Uvular'), 'مؤخّر اللسان + اللهاة', 'من العربية: ' + ipa('q')], [en('Pharyngeal'), 'جذر اللسان + جدار البلعوم', 'من العربية: ' + ipa('ʕ, ħ')],
    [en('Glottal'), 'فتحة الأحبال الصوتية ' + en('(glottis)'), ipa('ʔ, h')]
  ] }, src: pg('L2', 23) },
  { note: 'تنبيه: الشريحة 57 وصفت هذين الصوتين وصفًا مختلفًا.' },
  { p: 'الوصف في الشريحة: ' + en('labiodental') + '.' },
  { p: 'لكن باقي المحاضرة تقول ' + en('dental') + '، وهو الصحيح.' },
  { h: 'طريقة النطق', en: 'Manner of articulation' },
  { table: { head: ['الطريقة', 'الأصوات'], rows: [[en('Stops / plosives'), ipa('p, b, t, d, k, g')], [en('Fricatives'), ipa('f, v, θ, ð, s, z, ʃ, ʒ, h')], [en('Affricates'), ipa('tʃ, dʒ')], [en('Approximants'), ipa('w, j') + ' glides · ' + ipa('l, r') + ' liquids'], [en('Nasals'), ipa('m, n, ŋ')]] }, src: pg('L2', 36) },
  { p: 'نصف الحرف الساكن بثلاث صفات بهذا الترتيب:' },
  { list: [en('voicing'), en('place'), en('manner')] },
  { p: 'مثال: ' + ipa('k') + '.' },
  { table: { head: ['الصوت', 'الوصف'], rows: [
    [ipa('k'), en('voiceless, velar, stop')],
    [ipa('m'), en('voiced, bilabial, nasal')]
  ] } }
] },
{ id: 'l2-vc', lec: 'L2', ar: 'الحروف الصوتية والساكنة', en: 'Vowels vs consonants', min: 5, blocks: [
  { compare: [
    { t: 'Consonants', ar: 'الحروف الساكنة', items: ['ينغلق ممر الهواء أو يضيق', 'تأتي في أطراف المقطع ' + en('(onset / coda)')] },
    { t: 'Vowels', ar: 'الحروف الصوتية', items: ['يمرّ الهواء دون أن يسدّ طريقه شيء تقريبًا', 'تسمعينها أوضح وأعلى وأطول ' + en('(more sonorous)'), 'تكون الجزء الأساسي في المقطع، أي قلبه ' + en('(nucleus)')] }
  ], src: pg('L2', 16) },
  { list: ['يختلفان في النطق ' + en('(Obstruction)') + ': الحرف الساكن يسدّ الهواء أو يضيّقه، والحرف الصوتي لا يعترضه تقريبًا.', 'وفي قوة الصوت ' + en('(Prominence)') + ': الحرف الصوتي أوضح، فنسمعه أعلى وأطول.', 'نقارن أيضًا مكانهما داخل المقطع ' + en('(Syllabic distribution)') + ': الحرف الصوتي هو الجزء الأساسي في المقطع، أي قلبه. وهذا هو الفرق الأهم.'], src: pg('L2', 17) },
  { note: 'الصوت ' + ipa('h') + ' لا يعترض الهواء، لكنه حرف ساكن. وينطبق ذلك على الصوت ' + ipa('w') + '. وينطبق أيضًا على الصوت ' + ipa('j') + '. السبب: هذه الأصوات الثلاثة لا تكون قلب المقطع أبدًا.' },
  { h: 'بماذا تختلف الحروف الصوتية؟', en: 'Height · position · lip rounding' },
  { table: { head: ['الصفة', 'الشرح'], rows: [[en('Tongue height'), 'المسافة بين سطح اللسان وسقف الفم'], [en('Tongue position'), 'أي جزء من اللسان هو الأعلى: الأمامي أو الخلفي'], [en('Lip rounding'), 'شكل الشفتين: ' + en('rounded, spread, neutral')]] }, src: pg('L2', 51) }
] }
];

/* ---------- 7-day plan (Tue 20 → Mon 26 Oct) ---------- */
D.plan = [
  { id: 'd1', lec: 'L3', ar: 'الحروف القصيرة', en: 'Short vowels', lessons: ['l3-intro', 'l3-short'], topics: ['short', 'l3'], split: [15, 20, 10] },
  { id: 'd2', lec: 'L3', ar: 'الحروف الطويلة', en: 'Long vowels', lessons: ['l3-long'], topics: ['long', 'l3'], split: [15, 20, 10] },
  { id: 'd3', lec: 'L3', ar: 'تدريب بنمط الاختبار', en: 'Description · word → vowel', lessons: ['l3-pairs'], topics: ['short', 'long', 'l3'], types: ['desc', 'word'], split: [5, 30, 10] },
  { id: 'd4', lec: 'L4', ar: 'المزدوجة: آخرها ə أو ɪ', en: 'Centring · closing to /ɪ/', lessons: ['l4-intro', 'l4-centring', 'l4-closing-i'], topics: ['centring', 'closing-i', 'l4'], split: [15, 20, 10] },
  { id: 'd5', lec: 'L4', ar: 'المزدوجة: آخرها ʊ، والثلاثية', en: 'Closing to /ʊ/ · triphthongs · RP/GA', lessons: ['l4-closing-u', 'l4-tri', 'l4-rpga'], topics: ['closing-u', 'tri', 'rpga', 'l4'], split: [15, 20, 10] },
  { id: 'd6', lec: 'L2', ar: 'مراجعة المحاضرتين 1 و 2', en: 'Review L1 · L2', lessons: ['l2-organs', 'l2-voicing', 'l2-place', 'l1-phoneme'], topics: ['l1', 'l2'], split: [15, 20, 10] },
  { id: 'd7', lec: 'L4', ar: 'اختبار تجريبي', en: 'Mock midterm · night-before summary', lessons: [], topics: ['mock'], split: [5, 30, 10], mock: true }
];

/* ---------- Authored questions (generated ones are built in app.js) ----------
   type: mcq | tf | match | sort        */
D.questions = [
/* L1 */
{ id: 'q1-1', lec: 'L1', type: 'mcq', topic: 'l1', q: 'Linguistics is:', o: ['the scientific study of human language', 'the study of speech sounds only', 'the analysis of the structure of words', 'the study of meaning'], a: 0, why: 'يدرس هذا العلم لغة الإنسان. تعريف الشريحة: ' + en('the scientific study of human language') + '.', src: 'L1 · ص3' },
{ id: 'q1-2', lec: 'L1', type: 'mcq', topic: 'l1', q: 'Which branch is "the analysis of the structure of phrases and sentences"?', o: ['Morphology', 'Semantics', 'Syntax', 'Phonology'], a: 2, why: 'الجواب ' + en('Syntax') + ': يحلل كيف تتكوّن العبارات والجمل. أما ' + en('Morphology') + ' فيحلل كيف تتكوّن الكلمات.', src: 'L1 · ص4' },
{ id: 'q1-3', lec: 'L1', type: 'mcq', topic: 'l1', q: 'Phonetics and Phonology are grouped under:', o: ['Sound', 'Structure', 'Meaning', 'Applied linguistics'], a: 0, why: 'يدرس هذان الفرعان أصوات الكلام. في مخطط الشريحة، تحت ' + en('Sound') + ' فرعان. الأول ' + en('Phonetics') + '. والثاني ' + en('Phonology') + '.', src: 'L1 · ص4' },
{ id: 'q1-4', lec: 'L1', type: 'mcq', topic: 'l1', q: 'Which is a branch of applied linguistics?', o: ['Pragmatics', 'Morphology', 'Sociolinguistics', 'Phonetics'], a: 2, why: 'الجواب ' + en('Sociolinguistics') + '، وهو من فروع علم اللغة التطبيقي. الخيارات الأخرى فروع نظرية.', src: 'L1 · ص5' },
{ id: 'q1-5', lec: 'L1', type: 'mcq', topic: 'l1', q: 'The branch of phonetics that studies how sounds are transmitted as sound waves in the air:', o: ['Articulatory', 'Acoustic', 'Auditory / perceptual', 'Segmental'], a: 1, why: 'الجواب ' + en('Acoustic') + ': يدرس انتقال الصوت في الهواء على شكل موجات.', src: 'L1 · ص7' },
{ id: 'q1-6', lec: 'L1', type: 'mcq', topic: 'l1', q: 'The phonemic system of RP consists of:', o: ['26 phonemes', '40 phonemes', '44 phonemes', '48 phonemes'], a: 2, why: 'في نظام ' + en('RP') + ' 44 فونيمًا.', src: 'L1 · ص11' },
{ id: 'q1-7', lec: 'L1', type: 'mcq', topic: 'l1', q: 'A preferable name for RP is:', o: ['Standard English', 'BBC pronunciation', 'General American', 'IPA'], a: 1, why: 'الاسم المفضّل لهذه اللهجة في الشريحة: ' + en('a preferable name is BBC pronunciation') + '.', src: 'L1 · ص6' },
{ id: 'q1-8', lec: 'L1', type: 'mcq', topic: 'l1', q: 'How do we count the syllables of a word?', o: ['by counting letters', 'by counting consonants', 'by counting vowel sounds', 'by counting stressed syllables'], a: 2, why: 'المقياس هو الأصوات المنطوقة. في الشريحة: ' + en('By counting the vowel sounds (Not letters).') + ' يعني نعدّ الحروف الصوتية المنطوقة، لا الحروف المكتوبة.', src: 'L1 · ص16' },
{ id: 'q1-9', lec: 'L1', type: 'mcq', topic: 'l1', q: '"Oh, really." with a falling tone conveys:', o: ['surprise', 'boredom', 'a yes/no question', 'a statement of fact'], a: 1, why: 'مع ' + en('Oh, really.') + ' النغمة الهابطة تعني الملل، والصاعدة تعني الاستغراب.', src: 'L1 · ص22' },
{ id: 'q1-10', lec: 'L1', type: 'mcq', topic: 'l1', q: 'Which pair shows the same letter for two different phonemes?', o: ['Cat – kitchen', 'Phone – Floor', 'Sea – Sure', 'Floor – laugh'], a: 2, why: 'الحرف المكتوب ' + en('S') + ' له صوتان.' + ' الصوت الأول هو ' + ipa('s') + '. يظهر في كلمة ' + en('Sea') + '. الصوت الثاني هو ' + ipa('ʃ') + '. يظهر في كلمة ' + en('Sure') + '.', src: 'L1 · ص12' },
{ id: 'q1-11', lec: 'L1', type: 'tf', topic: 'l1', q: 'Allophones of a phoneme change the meaning of a word.', a: false, why: 'الألوفونات لا تغيّر المعنى: ' + en('do not change the meaning') + '.', src: 'L1 · ص15' },
{ id: 'q1-12', lec: 'L1', type: 'tf', topic: 'l1', q: 'Phonology is concerned with the abstract mental aspect of sounds.', a: true, why: 'يدرس نظام الأصوات في الذهن. هكذا عرّفت الدكتورة ' + en('Phonology') + '.', src: 'L1 · ص9' },
{ id: 'q1-13', lec: 'L1', type: 'tf', topic: 'l1', q: 'English words can begin with /rt/.', a: false, why: 'الكلمة الإنجليزية قد تبدأ بالصوتين ' + ipa('tr') + '، لكن ليس بالصوتين ' + ipa('rt') + '.', src: 'L1 · ص3' },
{ id: 'q1-14', lec: 'L1', type: 'tf', topic: 'l1', q: 'Stress and intonation are studied in suprasegmental phonology.', a: true, why: 'يمتد الضغط والتنغيم على أكثر من صوت. من تعريف ' + en('suprasegmental') + ' في الشريحة: ' + en('features which extend over the segment, such as stress and intonation') + '.', src: 'L1 · ص9' },
{ id: 'q1-15', lec: 'L1', type: 'tf', topic: 'l1', q: 'pit, pat, pot, pet, put differ in a single sound, so these sounds are phonemes.', a: true, why: 'تختلف الكلمات في صوت واحد. عندما يتغيّر هذا الصوت يتغيّر المعنى. لذلك هذه الأصوات فونيمات.', src: 'L1 · ص11' },
{ id: 'q1-16', lec: 'L1', type: 'match', topic: 'l1', q: 'Match each term with its meaning', pairs: [['Phoneme', 'the meaning-distinguishing sound unit'], ['Allophone', 'a realization of a phoneme in context'], ['Stress', 'strength that makes a syllable louder and longer'], ['Intonation', 'use of pitch to convey meaning']], why: 'التعريفات من الشرائح 11، 15، 20، 22.', src: 'L1' },
{ id: 'q1-17', lec: 'L1', type: 'match', topic: 'l1', q: 'Match each branch with what it studies', pairs: [['Morphology', 'structure of words'], ['Semantics', 'meaning'], ['Articulatory phonetics', 'how sounds are produced'], ['Auditory phonetics', 'how sounds are perceived']], why: 'من الشريحة 4 والشريحة 7.', src: 'L1' },
/* L2 */
{ id: 'q2-1', lec: 'L2', type: 'mcq', topic: 'l2', q: 'The opening between the vocal folds is called the:', o: ['pharynx', 'glottis', 'velum', 'larynx'], a: 1, why: 'الجواب ' + en('glottis') + ': الفتحة بين الأحبال الصوتية.', src: 'L2 · ص8' },
{ id: 'q2-2', lec: 'L2', type: 'mcq', topic: 'l2', q: 'The vocal folds position for /h/ is:', o: ['wide apart', 'narrow glottis', 'vibration', 'tightly closed'], a: 1, why: 'مع ' + ipa('h') + ' تكون فتحة الأحبال الصوتية ضيقة، فيمرّ الهواء منها باحتكاك، وبلا اهتزاز.', src: 'L2 · ص9' },
{ id: 'q2-3', lec: 'L2', type: 'mcq', topic: 'l2', q: 'Vocal folds tightly closed so no air passes produce:', o: ['/h/', '/ʔ/', '/g/', '/ŋ/'], a: 1, why: 'تنغلق الأحبال الصوتية تمامًا، فلا يمرّ الهواء. نكتب هذا الصوت ' + ipa('ʔ') + '. اسمه ' + en('glottal stop') + '.', src: 'L2 · ص9' },
{ id: 'q2-4', lec: 'L2', type: 'mcq', topic: 'l2', q: 'When the velum is lowered, the air goes out through the nose, as in:', o: ['/k/', '/g/', '/ŋ/', '/t/'], a: 2, why: 'الجواب ' + ipa('ŋ') + '، لأنه حرف أنفي ' + en('(nasal)') + '. أما الباقي فيخرج هواؤه من الفم.', src: 'L2 · ص11' },
{ id: 'q2-5', lec: 'L2', type: 'mcq', topic: 'l2', q: '/f/ and /v/ are:', o: ['bilabial', 'labiodental', 'dental', 'alveolar'], a: 1, why: 'تُنطق بالشفة السفلى مع الأسنان العليا.', src: 'L2 · ص25' },
{ id: 'q2-6', lec: 'L2', type: 'mcq', topic: 'l2', q: '/θ/ and /ð/ are:', o: ['labiodental', 'dental', 'alveolar', 'palatal'], a: 1, why: 'تُنطق بطرف اللسان مع الأسنان العليا. تنبيه: الشريحة 57 وصفتها بأنها ' + en('labiodental') + '، وهذا خطأ.', src: 'L2 · ص26' },
{ id: 'q2-7', lec: 'L2', type: 'mcq', topic: 'l2', q: '/j/ as in "yes" is:', o: ['palatal', 'velar', 'alveolar', 'glottal'], a: 0, why: 'يُنطق بمقدّم اللسان مع الحنك الصلب.', src: 'L2 · ص30' },
{ id: 'q2-8', lec: 'L2', type: 'mcq', topic: 'l2', q: 'Which of these is NOT alveolar?', o: ['/t/', '/n/', '/l/', '/k/'], a: 3, why: 'الجواب ' + ipa('k') + '، لأنه ' + en('velar') + ': يُنطق بمؤخّر اللسان مع الحنك اللين.', src: 'L2 · ص27، 31' },
{ id: 'q2-9', lec: 'L2', type: 'mcq', topic: 'l2', q: 'The active articulator for /p, b, m/ is the:', o: ['upper lip', 'lower lip', 'upper teeth', 'tongue tip'], a: 1, why: 'الشفة السفلى هي التي تتحرك ' + en('(active)') + '، والعليا ثابتة.', src: 'L2 · ص24' },
{ id: 'q2-10', lec: 'L2', type: 'mcq', topic: 'l2', q: 'Vowels form the syllable:', o: ['onset', 'coda', 'nucleus', 'margins'], a: 2, why: 'الحروف الصوتية قلب المقطع ' + en('(nucleus)') + '، والحروف الساكنة في أطرافه.', src: 'L2 · ص17' },
{ id: 'q2-11', lec: 'L2', type: 'mcq', topic: 'l2', q: 'The acoustic distinction between vowels and consonants is called:', o: ['Obstruction', 'Prominence', 'Distribution', 'Aspiration'], a: 1, why: 'الجواب ' + en('Prominence') + ': الحروف الصوتية أوضح ' + en('(more sonorous)') + '، فنسمعها أعلى وأطول.', src: 'L2 · ص16' },
{ id: 'q2-12', lec: 'L2', type: 'mcq', topic: 'l2', q: '/k/ is:', o: ['voiced, velar, stop', 'voiceless, velar, stop', 'voiceless, alveolar, stop', 'voiced, velar, nasal'], a: 1, why: 'لا تهتز الأحبال الصوتية. يلامس مؤخّر اللسان الحنك اللين، فيتوقف الهواء ثم يخرج فجأة. هذا مثال الشريحة نفسه: ' + en('voiceless, velar, stop') + '.', src: 'L2 · ص46' },
{ id: 'q2-13', lec: 'L2', type: 'mcq', topic: 'l2', q: 'voiced, labiodental, fricative =', o: ['/f/', '/v/', '/ð/', '/b/'], a: 1, why: 'الصوتان متشابهان في مكان النطق.' + ' الأول هو ' + ipa('f') + '. الثاني هو ' + ipa('v') + '. الفرق بينهما في الاهتزاز فقط. مع ' + ipa('v') + ' تهتز الأحبال الصوتية. هذا هو معنى ' + en('(voiced)') + '.', src: 'L2 · ص47' },
{ id: 'q2-14', lec: 'L2', type: 'mcq', topic: 'l2', q: 'Which word has an unaspirated stop?', o: ['tea', 'pea', 'spy', 'key'], a: 2, why: 'الجواب ' + en('spy') + '. إذا جاء الحرف بعد ' + ipa('s') + ' لا تخرج معه نفخة الهواء. هذا هو معنى ' + en('(aspiration)') + '.', src: 'L2 · ص38' },
{ id: 'q2-15', lec: 'L2', type: 'mcq', topic: 'l2', q: 'The lips for /iː/ in "see" are:', o: ['rounded', 'spread', 'neutral'], a: 1, why: 'الشفتان مفرودتان ' + en('(spread)') + ' كأنكِ تبتسمين.', src: 'L2 · ص55' },
{ id: 'q2-16', lec: 'L2', type: 'tf', topic: 'l2', q: 'All vowels are voiced.', a: true, why: 'الأحبال الصوتية تهتز مع كل الحروف الصوتية.', src: 'L2 · ص49' },
{ id: 'q2-17', lec: 'L2', type: 'tf', topic: 'l2', q: 'Some English vowels are nasal.', a: false, why: 'يخرج هواء كل الحروف الصوتية من الفم ' + en('(oral)') + '. يحدث ذلك لأن الحنك اللين يرتفع.', src: 'L2 · ص49' },
{ id: 'q2-18', lec: 'L2', type: 'tf', topic: 'l2', q: '/h/, /w/ and /j/ are vowels because they do not obstruct the air.', a: false, why: 'هي حروف ساكنة، لأنها لا تكون الجزء الأساسي في المقطع، أي قلبه أبدًا ' + en('(syllabic distribution)') + '.', src: 'L2 · ص17' },
{ id: 'q2-19', lec: 'L2', type: 'tf', topic: 'l2', q: '/b, d, g/ are voiced.', a: true, why: 'الأحبال الصوتية تهتز معها.', src: 'L2 · ص9' },
{ id: 'q2-20', lec: 'L2', type: 'match', topic: 'l2', q: 'Match each place with its sounds', pairs: [['Bilabial', '/p, b, m/'], ['Velar', '/k, g, ŋ/'], ['Post-alveolar', '/ʃ, ʒ/'], ['Glottal', '/ʔ, h/']], why: 'من شرائح مكان النطق.', src: 'L2 · ص24–34' },
{ id: 'q2-21', lec: 'L2', type: 'match', topic: 'l2', q: 'Match each articulator', pairs: [['alveolar ridge', 'between the top front teeth and the hard palate'], ['velum', 'soft back part of the roof of the mouth'], ['pharynx', 'funnel-shaped tube above the larynx'], ['glottis', 'opening between the vocal folds']], why: 'من الشرائح 8، 10، 11، 12.', src: 'L2' },
{ id: 'q2-22', lec: 'L2', type: 'sort', topic: 'l2', q: 'Voiced or voiceless?', buckets: ['voiceless', 'voiced'], items: [['p', 0], ['b', 1], ['s', 0], ['z', 1], ['f', 0], ['v', 1], ['m', 1], ['h', 0]], why: 'تبتعد الأحبال الصوتية عن بعضها مع ' + en('voiceless') + '. وتهتز مع ' + en('voiced') + '.', src: 'L2 · ص9، 21' },
/* L3 */
{ id: 'q3-1', lec: 'L3', type: 'tf', topic: 'l3', q: 'English has seven short vowels and five long vowels.', a: true, why: 'المجموع: 7 قصيرة + 5 طويلة = 12 حرفًا ' + en('(12 pure vowels)') + '.', src: 'L3 · ص5' },
{ id: 'q3-2', lec: 'L3', type: 'tf', topic: 'l3', q: 'Short vowels are tense and require greater muscular tension.', a: false, why: 'القصيرة مرتخية ' + en('(lax)') + ' وجهدها أقل. والطويلة هي المشدودة ' + en('(tense)') + '.', src: 'L3 · ص4' },
{ id: 'q3-3', lec: 'L3', type: 'tf', topic: 'l3', q: 'In a closed syllable, a vowel is longer when followed by a voiceless consonant.', a: false, why: 'يطول الحرف إذا جاء بعده حرف ساكن تهتز معه الأحبال الصوتية. هذا معنى <b>' + en('voiced') + '</b>. مثال: ' + en('bead') + '. الحرف فيه أطول من نظيره في كلمة ' + en('beat') + '.', src: 'L3 · ص6' },
{ id: 'q3-4', lec: 'L3', type: 'mcq', topic: 'l3', q: 'Which vowel is known as the hesitation sound?', o: ['/ə/', '/ɜː/', '/ʌ/', '/ɑː/'], a: 1, why: 'يُستخدم عند التردّد في الكلام. تقول الشريحة عن ' + ipa('ɜː') + ': ' + en('known as the hesitation sound') + '، يعني صوت التردّد.', src: 'L3 · ص35' },
{ id: 'q3-5', lec: 'L3', type: 'mcq', topic: 'l3', q: 'A vowel whose quality doesn\'t change within the same syllable is a:', o: ['Diphthong', 'Triphthong', 'Monophthong', 'Schwa'], a: 2, why: 'الجواب ' + en('Monophthong') + '، أي حرف أحادي صوته ثابت، مثل ' + en('he') + '.', src: 'L3 · ص2' },
{ id: 'q3-6', lec: 'L3', type: 'mcq', topic: 'l3', q: 'Which word has a longer vowel?', o: ['me', 'mean'], a: 0, why: 'تنتهي ' + en('me') + ' بحرف صوتي، فمقطعها مفتوح. وتنتهي ' + en('mean') + ' بحرف ساكن، فمقطعها مغلق. يطول الحرف أكثر في المقطع المفتوح.', src: 'L3 · ص6' },
{ id: 'q3-7', lec: 'L3', type: 'tf', topic: 'l3', q: '/ʌ/ is a back vowel.', a: false, why: 'تصنّفه الدكتورة ' + en('central') + '. وليس من الحروف الخلفية ' + en('(back)') + '. وصفه في الشريحة: ' + en('mid-low, central, unrounded, lax') + '.', src: 'L3 · ص33' },
{ id: 'q3-8', lec: 'L3', type: 'mcq', topic: 'l3', q: 'Short and long vowels differ in quantity and in:', o: ['voicing', 'quality', 'place of articulation', 'aspiration'], a: 1, why: 'الجواب ' + en('quality') + '، أي نوع الصوت: يأتي من شكل اللسان ومكانه وتدوير الشفتين.', src: 'L3 · ص5' },
{ id: 'q3-9', lec: 'L3', type: 'mcq', topic: 'l3', q: 'The name of the symbol /æ/ is:', o: ['the schwa', 'the caret', 'the ash', 'the hook'], a: 2, why: 'في المحاضرة ثلاثة رموز لها أسماء. الأول ' + ipa('æ') + '. اسمه ' + en('the ash') + '. الثاني ' + ipa('ʌ') + '. اسمه ' + en('the caret') + '. الثالث ' + ipa('ə') + '. اسمه ' + en('the schwa') + '.', src: 'L3 · ص16' },
{ id: 'q3-10', lec: 'L3', type: 'tf', topic: 'l3', q: 'In South East England, "a" followed by s, f, th or n is pronounced /ɑː/.', a: true, why: 'أمثلة المحاضرة: ' + en('ask, pass, after, bath, dance') + '.', src: 'L3 · ص21' },
{ id: 'q3-11', lec: 'L3', type: 'sort', topic: 'l3', q: 'Short or long?', buckets: ['short', 'long'], items: [['ɪ', 0], ['iː', 1], ['ʊ', 0], ['uː', 1], ['ɜː', 1], ['ə', 0], ['ɒ', 0], ['ɔː', 1]], why: 'رمز الحرف الطويل فيه علامة الطول ' + ipa('ː') + '.', src: 'L3 · ص5' },
/* L4 */
{ id: 'q4-1', lec: 'L4', type: 'tf', topic: 'l4', q: 'In diphthongs, the second part is longer and stronger than the first.', a: false, why: 'ابدئي بالجزء الأول بصوت أطول وأقوى. انطقي الجزء الثاني بصوت أقصر وأهدأ.', src: 'L4 · ص5' },
{ id: 'q4-2', lec: 'L4', type: 'tf', topic: 'l4', q: 'In terms of length, diphthongs are similar to the long vowels.', a: true, why: 'في الشريحة 5: طول الحروف المزدوجة مثل طول الحروف الطويلة.', src: 'L4 · ص5' },
{ id: 'q4-3', lec: 'L4', type: 'tf', topic: 'tri', q: 'English triphthongs are the three centring diphthongs + /ə/.', a: false, why: 'اختاري من الحروف المزدوجة الصاعدة الخمسة. ثم أضيفي ' + ipa('ə') + ' بعدها ليصبح الصوت ثلاثيًا. لا نستخدم المجموعة المتجهة للوسط ' + en('(centring)') + '.', src: 'L4 · ص20' },
{ id: 'q4-4', lec: 'L4', type: 'tf', topic: 'rpga', q: 'GA has the centring diphthongs /ɪə/, /eə/, /ʊə/.', a: false, why: 'في الشريحة: ' + en('GA (5) only closing') + '. في الأمريكية خمسة حروف مزدوجة، وكلها صاعدة. ولا توجد فيها حروف المجموعة المتجهة للوسط.', src: 'L4 · ص26' },
{ id: 'q4-5', lec: 'L4', type: 'mcq', topic: 'rpga', q: '"hot" in RP and GA:', o: ['RP /hɒt/, GA /hɑt/', 'RP /hɑt/, GA /hɒt/', 'both /hɒt/', 'both /hɔːt/'], a: 0, why: 'الصوت ' + ipa('ɒ') + ' موجود في البريطانية. اسمها في المحاضرة ' + en('RP') + '. وفي الأمريكية يقابله صوت آخر. هذا الصوت هو ' + ipa('ɑ') + '. اسم الأمريكية في المحاضرة ' + en('GA') + '.', src: 'L4 · ص24' },
{ id: 'q4-6', lec: 'L4', type: 'mcq', topic: 'rpga', q: 'How many diphthongs in RP and in GA?', o: ['RP 8, GA 5', 'RP 5, GA 8', 'both 8', 'RP 8, GA 3'], a: 0, why: 'في البريطانية 8 حروف مزدوجة، منها صاعدة ومنها متجهة للوسط. وفي الأمريكية 5 فقط، وكلها صاعدة. في الشريحة: ' + en('RP (8) centering and closing · GA (5) only closing') + '.', src: 'L4 · ص26' },
{ id: 'q4-7', lec: 'L4', type: 'mcq', topic: 'l4', q: 'Closing diphthongs glide from:', o: ['a closer vowel to a more open vowel', 'a more open vowel to a closer vowel', 'any vowel to /ə/', 'a front vowel to a back vowel'], a: 1, why: 'يبدأ الصوت بحرف أوسع، وينتهي بحرف أضيق. التعريف: ' + en('from a relatively more open vowel towards a relatively closer vowel') + '.', src: 'L4 · ص9' },
{ id: 'q4-8', lec: 'L4', type: 'mcq', topic: 'tri', q: 'Which triphthong is in "power" and "hour"?', o: ['/aʊə/', '/əʊə/', '/aɪə/', '/ɔɪə/'], a: 0, why: 'ابدئي بالصوت ' + ipa('aʊ') + '. ثم أضيفي ' + ipa('ə') + '.', src: 'L4 · ص20' },
{ id: 'q4-9', lec: 'L4', type: 'mcq', topic: 'tri', q: 'Transcribe "lawyer":', o: ['/lɔɪə/', '/lɔːjə/', '/laɪə/', '/ləʊə/'], a: 0, why: 'من التمرين المحلول في المحاضرة كلمة ' + en('lawyer') + '. نطقها هو ' + ipa('lɔɪə') + '.', src: 'L4 · ص21' },
{ id: 'q4-10', lec: 'L4', type: 'sort', topic: 'l4', q: 'Which group?', buckets: ['centring', 'closing → ɪ', 'closing → ʊ'], items: [['ɪə', 0], ['eɪ', 1], ['əʊ', 2], ['eə', 0], ['aɪ', 1], ['aʊ', 2], ['ʊə', 0], ['ɔɪ', 1]], why: 'انظري إلى الرمز في النهاية لتعرفي مجموعة الحرف المزدوج.', src: 'L4 · ص6' },
{ id: 'q4-11', lec: 'L4', type: 'match', topic: 'l4', q: 'Match the word with its diphthong', pairs: [['buy', '/aɪ/'], ['boy', '/ɔɪ/'], ['bay', '/eɪ/'], ['bare', '/eə/']], why: 'كتبت الدكتورة على الشريحة ثلاث كلمات. الأولى ' + en('buy') + '. نطقها ' + ipa('baɪ') + '. الثانية ' + en('boy') + '. نطقها ' + ipa('bɔɪ') + '. الثالثة ' + en('bay') + '. نطقها ' + ipa('beɪ') + '.', src: 'L4 · ص13' },
{ id: 'q4-12', lec: 'L4', type: 'match', topic: 'l4', q: 'Match the word with its diphthong', pairs: [['found', '/aʊ/'], ['phoned', '/əʊ/'], ['here', '/ɪə/'], ['hair', '/eə/']], why: 'أزواج من ' + en('Assignment 2') + ' متقاربة في النطق، فانتبهي للفرق في كل زوج.', src: 'L4 · ص8، 17' },
{ id: 'q4-13', lec: 'L4', type: 'mcq', topic: 'l4', q: 'In "hi" /haɪ/, which part is longer and stronger?', o: ['/a/', '/ɪ/', 'both equal'], a: 0, why: 'الجزء الأول ' + ipa('a') + ' أطول وأقوى من الثاني.', src: 'L4 · ص5' }
];

/* ---------- Authored flashcards (generated ones in app.js) ---------- */
function card(id, lec, topic, f, b, ar) { return { id: id, lec: lec, topic: topic, kind: 'term', f: f, b: b, ar: ar }; }
D.cards = [
  card('c1-1', 'L1', 'l1', 'Linguistics', 'the scientific study of human language', 'علم اللغة'),
  card('c1-2', 'L1', 'l1', 'Phonetics', 'the characteristics of speech sounds: how they are produced, transmitted and perceived', 'علم الأصوات'),
  card('c1-3', 'L1', 'l1', 'Phonology', 'the system and patterns of speech sounds in a language; the abstract mental aspect', 'علم النظام الصوتي'),
  card('c1-4', 'L1', 'l1', 'Morphology', 'the analysis of the structure of words', 'علم الصرف'),
  card('c1-5', 'L1', 'l1', 'Syntax', 'the analysis of the structure of phrases and sentences', 'علم النحو'),
  card('c1-6', 'L1', 'l1', 'Semantics', 'the study of the meaning of words, phrases and sentences', 'علم المعنى'),
  card('c1-7', 'L1', 'l1', 'Pragmatics', 'the speaker\'s meaning and how more is communicated than is said', 'معنى المتكلّم'),
  card('c1-8', 'L1', 'l1', 'Articulatory phonetics', 'how sounds are articulated / produced', 'كيف ننطق الأصوات'),
  card('c1-9', 'L1', 'l1', 'Acoustic phonetics', 'how sounds are transmitted as sound waves in the air', 'كيف ينتقل الصوت في الهواء'),
  card('c1-10', 'L1', 'l1', 'Auditory phonetics', 'how sounds are perceived', 'كيف نسمع الأصوات'),
  card('c1-11', 'L1', 'l1', 'Segmental phonology', 'analyses speech into discrete segments', 'تقسيم الكلام إلى وحدات'),
  card('c1-12', 'L1', 'l1', 'Suprasegmental phonology', 'features which extend over the segment, such as stress and intonation', 'صفات تشمل أكثر من صوت، مثل الضغط والتنغيم'),
  card('c1-13', 'L1', 'l1', 'Phoneme', 'the meaning-distinguishing sound unit in a language (RP: 44)', 'الفونيم'),
  card('c1-14', 'L1', 'l1', 'Allophone', 'a different realization of a phoneme according to its context', 'الألوفون'),
  card('c1-15', 'L1', 'l1', 'IPA', 'International Phonetic Alphabet: symbols for phonemic transcription', 'الأبجدية الصوتية الدولية'),
  card('c1-16', 'L1', 'l1', 'RP', 'Received Pronunciation; preferable name: BBC pronunciation', 'النطق البريطاني المعياري'),
  card('c1-17', 'L1', 'l1', 'Syllable', 'a basic vowel sound with optional consonants before or after it', 'المقطع'),
  card('c1-18', 'L1', 'l1', 'Stress', 'the relative strength of a syllable, making it louder and longer', 'الضغط على المقطع'),
  card('c1-19', 'L1', 'l1', 'Intonation', 'the use of the pitch of the voice to convey meaning', 'التنغيم'),
  card('c1-20', 'L1', 'l1', 'Applied linguistics', 'applying linguistic theories and findings to solve language problems', 'علم اللغة التطبيقي'),
  card('c2-1', 'L2', 'l2', 'Vocal tract', 'the air passage above the larynx, ending at the mouth and nostrils', 'ممر الهواء فوق الحنجرة'),
  card('c2-2', 'L2', 'l2', 'Articulators', 'the parts of the vocal tract used to form sounds', 'أعضاء النطق'),
  card('c2-3', 'L2', 'l2', 'Larynx', 'two large hollow cartilages on top of the trachea; contains the vocal folds', 'الحنجرة'),
  card('c2-4', 'L2', 'l2', 'Glottis', 'the opening between the vocal folds', 'فتحة الأحبال الصوتية'),
  card('c2-5', 'L2', 'l2', 'Pharynx', 'a funnel-shaped muscular tube just above the larynx', 'البلعوم'),
  card('c2-6', 'L2', 'l2', 'Velum (soft palate)', 'the soft back part of the roof of the mouth; raised = oral, lowered = nasal', 'الحنك اللين'),
  card('c2-7', 'L2', 'l2', 'Hard palate', 'the "roof of the mouth"; smooth, hard surface', 'الحنك الصلب'),
  card('c2-8', 'L2', 'l2', 'Alveolar ridge', 'between the top front teeth and the hard palate; covered with little ridges', 'اللثة'),
  card('c2-9', 'L2', 'l2', 'Tongue parts', 'tip · blade · front · back · root', 'أجزاء اللسان'),
  card('c2-10', 'L2', 'l2', 'Voiced', 'vocal folds drawn together and vibrating', 'تهتز معه الأحبال الصوتية'),
  card('c2-11', 'L2', 'l2', 'Voiceless', 'vocal folds apart; air passes freely', 'بلا اهتزاز'),
  card('c2-12', 'L2', 'l2', 'Place of articulation', 'where the airstream is obstructed', 'مكان النطق'),
  card('c2-13', 'L2', 'l2', 'Manner of articulation', 'how the airstream is obstructed', 'طريقة النطق'),
  card('c2-14', 'L2', 'l2', 'Bilabial', 'lower lip + upper lip: /p, b, m/', 'بالشفتين'),
  card('c2-15', 'L2', 'l2', 'Labiodental', 'lower lip + upper teeth: /f, v/', 'بالشفة السفلى والأسنان العليا'),
  card('c2-16', 'L2', 'l2', 'Dental', 'tongue tip + upper front teeth: /θ, ð/', 'بطرف اللسان والأسنان العليا'),
  card('c2-17', 'L2', 'l2', 'Alveolar', 'tongue tip or blade + alveolar ridge: /t, d, s, z, l, r, n/', 'باللسان واللثة'),
  card('c2-18', 'L2', 'l2', 'Post-alveolar', 'tongue blade + back of the alveolar ridge: /ʃ, ʒ/', 'بنصل اللسان وآخر اللثة'),
  card('c2-19', 'L2', 'l2', 'Palatal', 'front of the tongue + hard palate: /j/', 'بمقدّم اللسان والحنك الصلب'),
  card('c2-20', 'L2', 'l2', 'Velar', 'back of the tongue + velum: /k, g, ŋ, w/', 'بمؤخّر اللسان والحنك اللين'),
  card('c2-21', 'L2', 'l2', 'Glottal', 'produced at the glottis: /ʔ, h/', 'من فتحة الأحبال الصوتية'),
  card('c2-22', 'L2', 'l2', 'Stops / plosives', 'total obstruction, then release with a slight plosion: /p, b, t, d, k, g/', 'انفجارية'),
  card('c2-23', 'L2', 'l2', 'Fricatives', 'air through a narrow opening → friction: /f, v, θ, ð, s, z, ʃ, ʒ, h/', 'احتكاكية'),
  card('c2-24', 'L2', 'l2', 'Affricates', 'a stop followed immediately by a fricative: /tʃ, dʒ/', 'مركّبة: انفجار ثم احتكاك'),
  card('c2-25', 'L2', 'l2', 'Nasals', 'velum lowered, air out through the nose: /m, n, ŋ/', 'أنفية'),
  card('c2-26', 'L2', 'l2', 'Syllabic distribution', 'vowels = nucleus; consonants = margins (onset / coda)', 'مكان الحرف في المقطع'),
  card('c3-1', 'L3', 'l3', 'Monophthong', 'a vowel whose quality doesn\'t change within the same syllable: he /hiː/', 'حرف أحادي'),
  card('c3-2', 'L3', 'l3', 'Short vowels', 'lax: less muscular tension · /ɪ, e, æ, ʌ, ɒ, ʊ, ə/', 'الحروف القصيرة'),
  card('c3-3', 'L3', 'l3', 'Long vowels', 'tense: greater muscular tension · /iː, ɜː, ɑː, ɔː, uː/', 'الحروف الطويلة'),
  card('c3-4', 'L3', 'l3', 'Quantity', 'length: long vowels are longer than short vowels in similar contexts', 'الطول'),
  card('c3-5', 'L3', 'l3', 'Quality', 'from tongue shape, tongue position and lip rounding', 'نوع الصوت'),
  card('c3-6', 'L3', 'l3', 'The hesitation sound', '/ɜː/', 'صوت التردّد'),
  card('c4-1', 'L4', 'l4', 'Diphthong', 'a glide from one vowel to another within the same syllable: hi /haɪ/', 'حرف مزدوج'),
  card('c4-2', 'L4', 'centring', 'Centring diphthongs', 'glide towards /ə/: /ɪə, eə, ʊə/', 'المزدوجة المتجهة للوسط'),
  card('c4-3', 'L4', 'closing-i', 'Closing diphthongs', 'from a more open vowel towards a closer vowel: /eɪ, aɪ, ɔɪ, əʊ, aʊ/', 'المزدوجة الصاعدة'),
  card('c4-4', 'L4', 'tri', 'Triphthong', 'the five closing diphthongs + /ə/: /eɪə, aɪə, ɔɪə, əʊə, aʊə/', 'حرف ثلاثي'),
  card('c4-5', 'L4', 'rpga', 'RP vs GA diphthongs', 'RP 8 (centring + closing) · GA 5 (only closing)', 'البريطانية والأمريكية'),
  card('c4-6', 'L4', 'rpga', 'hot', 'RP /hɒt/ · GA /hɑt/', 'البريطانية والأمريكية')
];

/* Confusable pairs (cards) */
D.pairs = [
  ['iː', 'ɪ', 'seat', 'fill', 'tense / lax'], ['uː', 'ʊ', 'food', 'put', 'tense / lax'], ['ɜː', 'ə', 'bird', 'about', 'tense / lax'],
  ['ɑː', 'ʌ', 'part', 'come', 'low back / mid-low central'], ['ɑː', 'ɒ', 'dark', 'moss', 'unrounded tense / rounded lax'],
  ['ɒ', 'ɔː', 'bomb', 'horse', 'low lax / mid-high tense'], ['e', 'æ', 'sell', 'ban', 'mid / low'],
  ['eɪ', 'aɪ', 'wait', 'white', 'closing → ɪ'], ['əʊ', 'aʊ', 'phoned', 'found', 'closing → ʊ'], ['ɪə', 'eə', 'here', 'hair', 'centring'],
  ['əʊ', 'aʊ', 'load', 'loud', 'closing → ʊ'], ['əʊ', 'aʊ', 'know', 'now', 'closing → ʊ']
];

D.helpers = { en: en, ipa: ipa, pg: pg };
window.PH = D;
})();
