/* «خريطة الحفظ»: spelling families for the 7 hard vowels. Words come from D.lexText only. */
window.PH = window.PH || {};
window.PH.families = [
  { spell: 'oo', families: [
    { chunk: 'ook', sym: 'ʊ', words: ['book', 'look', 'took'], watch: [] },
    { chunk: 'ood', sym: 'ʊ', words: ['good', 'wood'], watch: [{ w: 'food', sym: 'uː' }, { w: 'blood', sym: 'ʌ' }] },
    { chunk: 'oot', sym: 'uː', words: ['root', 'boot', 'shoot'], watch: [{ w: 'foot', sym: 'ʊ' }] },
    { chunk: 'oo', sym: 'uː', words: ['food', 'soon', 'room', 'roof', 'pool', 'cool'], tag: 'الغالب', watch: [{ w: 'book', sym: 'ʊ' }, { w: 'good', sym: 'ʊ' }, { w: 'foot', sym: 'ʊ' }, { w: 'blood', sym: 'ʌ' }] }
  ] },
  { spell: 'ar', families: [
    { chunk: 'ar', sym: 'ɑː', words: ['car', 'star', 'card', 'park', 'start', 'part'], watch: [{ w: 'war', sym: 'ɔː' }, { w: 'sugar', sym: 'ə' }] }
  ] },
  { spell: 'or', families: [
    { chunk: 'or', sym: 'ɔː', words: ['torn', 'horse', 'form', 'cord', 'corn'], watch: [{ w: 'word', sym: 'ɜː' }, { w: 'worst', sym: 'ɜː' }, { w: 'doctor', sym: 'ə' }] },
    { chunk: 'our', sym: 'ɔː', words: ['four', 'course', 'source'], watch: [{ w: 'tour', sym: 'ʊə' }, { w: 'hour', sym: 'aʊə' }] },
    { chunk: 'wor', sym: 'ɜː', words: ['word', 'worst'], tag: 'بعد w', watch: [{ w: 'worn', sym: 'ɔː' }] }
  ] },
  { spell: 'ir · ur', families: [
    { chunk: 'ir', sym: 'ɜː', words: ['bird', 'girl', 'birth', 'shirt'], watch: [{ w: 'weird', sym: 'ɪə' }] },
    { chunk: 'ur', sym: 'ɜː', words: ['purse', 'hurt', 'burn', 'turn', 'nurse', 'curt'], watch: [{ w: 'pure', sym: 'ʊə' }, { w: 'cure', sym: 'ʊə' }, { w: 'sure', sym: 'ʊə' }, { w: 'figure', sym: 'ə' }] }
  ] },
  { spell: 'er · ear', families: [
    { chunk: 'er', sym: 'ɜː', words: ['fern', 'her', 'were'], tag: 'في مقطع عليه ضغط', watch: [{ w: 'paper', sym: 'ə' }, { w: 'under', sym: 'ə' }, { w: 'upper', sym: 'ə' }, { w: 'here', sym: 'ɪə' }] },
    { chunk: 'ear', sym: 'ɜː', words: ['learn', 'earn', 'earth', 'pearl', 'heard'], watch: [{ w: 'heart', sym: 'ɑː' }, { w: 'hearth', sym: 'ɑː' }, { w: 'bear', sym: 'eə' }, { w: 'near', sym: 'ɪə' }] }
  ] },
  { spell: 'o', families: [
    { chunk: 'o', sym: 'ɒ', words: ['pot', 'got', 'hot', 'rock', 'lock', 'loss'], tag: 'في مقطع مغلق', watch: [{ w: 'come', sym: 'ʌ' }, { w: 'some', sym: 'ʌ' }, { w: 'home', sym: 'əʊ' }] }
  ] },
  { spell: 'a', families: [
    { chunk: 'a', sym: 'ɑː', words: ['ask', 'pass', 'bath', 'dance'], tag: 'لهجة جنوب شرق إنجلترا', watch: [{ w: 'mass', sym: 'æ' }, { w: 'man', sym: 'æ' }] },
    { chunk: 'wa', sym: 'ɒ', words: ['wash', 'want'], tag: 'بعد w', watch: [{ w: 'war', sym: 'ɔː' }, { w: 'wall', sym: 'ɔː' }, { w: 'walk', sym: 'ɔː' }, { w: 'wait', sym: 'eɪ' }] }
  ] },
  { spell: 'al', families: [
    { chunk: 'al', sym: 'ɔː', words: ['call', 'wall', 'walk', 'talk'], watch: [{ w: 'half', sym: 'ɑː' }, { w: 'calm', sym: 'ɑː' }] },
    { chunk: 'al', sym: 'ɑː', words: ['half', 'calm', 'halves'], tag: 'لا يُنطق حرف l', watch: [{ w: 'call', sym: 'ɔː' }, { w: 'walk', sym: 'ɔː' }] }
  ] },
  { spell: 'u · ew', families: [
    { chunk: 'u', sym: 'ʊ', words: ['put', 'push', 'pull', 'full'], watch: [{ w: 'but', sym: 'ʌ' }, { w: 'bus', sym: 'ʌ' }, { w: 'cut', sym: 'ʌ' }, { w: 'rush', sym: 'ʌ' }] },
    { chunk: 'u_e', sym: 'uː', words: ['rude', 'rule', 'June'], tag: 'الحرف الأخير لا يُنطق', watch: [] },
    { chunk: 'ew', sym: 'uː', words: ['new', 'few', 'dew'], watch: [] }
  ] },
  { spell: 'aw · augh · ough', families: [
    { chunk: 'aw', sym: 'ɔː', words: ['saw', 'raw'], watch: [] },
    { chunk: 'aught', sym: 'ɔː', words: ['taught', 'caught'], watch: [] },
    { chunk: 'ought', sym: 'ɔː', words: ['thought', 'bought', 'fought'], watch: [] }
  ] },
  { spell: 'er · a', families: [
    { chunk: 'er', sym: 'ə', words: ['paper', 'under', 'upper'], tag: 'في آخر الكلمة', watch: [{ w: 'her', sym: 'ɜː' }, { w: 'fern', sym: 'ɜː' }] },
    { chunk: 'a', sym: 'ə', words: ['about', 'away'], tag: 'مقطع بلا ضغط', watch: [] }
  ] }
];
