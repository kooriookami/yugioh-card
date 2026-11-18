import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBreakText, splitBreakWord, splitBreakWordWithBracket } from '../breaking/split-break-word.js';
import { graphemeBoundaries, mergeGraphemeTokens } from '../breaking/text-graphemes.js';

const separatorCharList = [
  ' ',
  '\u00A0',
  String.fromCodePoint(0x1361),
  String.fromCodePoint(0x10100),
  String.fromCodePoint(0x10101),
  String.fromCodePoint(0x1039F),
  String.fromCodePoint(0x1091F),
];

const curatedBracketCaseList = [
  '',
  '[自(じ)]',
  '[自(じ)][分(ぶん)]',
  '[自(じ)][自(じ)]１',
  'abc[自(じ)]',
  '[自(じ)]abc',
  'abc[自(じ)][分(ぶん)]def',
  '【[永(えい)][続(ぞく)][魔(ま)][法(ほう)]】',
  '[戦(せん)][闘(とう)]・[効(こう)][果(か)]では',
  '●[相(あい)][手(て)]フィールド',
  '①[自(じ)][分(ぶん)]',
  '[自(じ)] [分(ぶん)]',
  '[自(じ)]　[分(ぶん)]',
  '[自(じ)]\n[分(ぶん)]',
  '[魔(ま)][法(ほう)]カード',
  'カード[魔(ま)][法(ほう)]',
  '[攻(こう)][撃(げき)]／[守(しゅ)][備(び)]',
  '[上(うえ)]・[下(した)]・[左(ひだり)]・[右(みぎ)]',
  '[発(はつ)][動(どう)]！',
  '（[相(あい)][手(て)]）',
  '「[魔(ま)][法(ほう)]」',
  '[A(a)]BC',
  'ABC[自(じ)]DEF',
  '[自(じ)]ABC[分(ぶん)]',
  '[永(えい)][続(ぞく)][魔(ま)][法(ほう)]',
  '[一(いち)][二(に)][三(さん)][四(し)]',
];

const malformedBracketCaseList = [
  '[その]カードを[破(は)]',
  '[条件未闭合]のまま[破(は)][壊(かい)]する',
  '前置き[その]カードを[破(は)]して[終(お)]える',
];

test('splitBreakWord splits CJK and Latin text into expected segments', () => {
  assert.deepEqual(splitBreakWord('abc游戏王'), ['abc', '游', '戏', '王']);
  assert.deepEqual(splitBreakWord('フィールドのカード'), ['フィー', 'ル', 'ド', 'の', 'カー', 'ド']);
});

test('splitBreakWord keeps spaces as standalone tokens', () => {
  assert.deepEqual(splitBreakWord('abc def'), ['abc', ' ', 'def']);
});

test('splitBreakWord preserves configured separator characters and round-trips text', () => {
  separatorCharList.forEach(separator => {
    const text = `甲${separator}乙`;
    const result = splitBreakWord(text);

    assert.equal(result.join(''), text);
    assert.ok(parseBreakText(text).flat().some(item => item.text === separator));
  });
});

test('splitBreakWord handles consecutive separators and mixed scripts', () => {
  assert.deepEqual(splitBreakWord('A  B'), ['A', ' ', ' ', 'B']);
  assert.deepEqual(splitBreakWord('游戏王ABC１２３'), ['游', '戏', '王', 'ABC', '１', '２', '３']);
  assert.deepEqual(splitBreakWord('カードA・B'), ['カー', 'ド', 'A・', 'B']);
  assert.deepEqual(splitBreakWord('汉字longlonglong汉字'), ['汉', '字', 'longlonglong', '汉', '字']);
});

test('splitBreakWordWithBracket falls back to plain splitting when no ruby token exists', () => {
  const text = 'abc游戏王';

  assert.deepEqual(splitBreakWordWithBracket(text), splitBreakWord(text));
});

test('splitBreakWordWithBracket preserves adjacent ruby tokens as independent items', () => {
  assert.deepEqual(
    splitBreakWordWithBracket('[自(じ)][分(ぶん)]フィールド'),
    ['[自(じ)]', '[分(ぶん)]', 'フィー', 'ル', 'ド'],
  );

  assert.deepEqual(
    splitBreakWordWithBracket('[永(えい)][続(ぞく)][魔(ま)][法(ほう)]'),
    ['[永(えい)]', '[続(ぞく)]', '[魔(ま)]', '[法(ほう)]'],
  );
});

test('splitBreakWordWithBracket keeps plain text around ruby tokens in order', () => {
  assert.deepEqual(
    splitBreakWordWithBracket('abc[自(じ)][分(ぶん)]def'),
    ['abc', '[自(じ)]', '[分(ぶん)]', 'def'],
  );

  assert.deepEqual(
    splitBreakWordWithBracket('●[相(あい)][手(て)]フィールドのカード１枚'),
    ['●', '[相(あい)]', '[手(て)]', 'フィー', 'ル', 'ド', 'の', 'カー', 'ド', '１', '枚'],
  );
});

test('splitBreakWordWithBracket preserves spaces and punctuation around ruby tokens', () => {
  assert.deepEqual(
    splitBreakWordWithBracket('发动 [魔(ま)][法(ほう)] 卡。'),
    ['发', '动', ' ', '[魔(ま)]', '[法(ほう)]', ' ', '卡。'],
  );

  assert.deepEqual(
    splitBreakWordWithBracket('【[永(えい)][続(ぞく)][魔(ま)][法(ほう)]】'),
    ['【[永(えい)]', '[続(ぞく)]', '[魔(ま)]', '[法(ほう)]】'],
  );

  assert.deepEqual(
    splitBreakWordWithBracket('[戦(せん)][闘(とう)]・[効(こう)][果(か)]では'),
    ['[戦(せん)]', '[闘(とう)]・', '[効(こう)]', '[果(か)]', 'で', 'は'],
  );
});

test('splitBreakWordWithBracket keeps malformed brackets as plain text while preserving valid ruby', () => {
  malformedBracketCaseList.forEach(text => {
    const result = splitBreakWordWithBracket(text);

    assert.equal(result.join(''), text);
    assert.ok(result.some(token => token.includes('[破(は)]')) || result.some(token => token.includes('[壊(かい)]')));
  });
});

test('splitBreakWordWithBracket round-trips curated edge cases', () => {
  curatedBracketCaseList.forEach(text => {
    assert.equal(splitBreakWordWithBracket(text).join(''), text);
  });
});

test('splitBreakWordWithBracket round-trips malformed bracket edge cases', () => {
  malformedBracketCaseList.forEach(text => {
    assert.equal(splitBreakWordWithBracket(text).join(''), text);
  });
});

test('ruby parsing preserves literal former placeholders and original zero width spaces', () => {
  for (const text of ['__RB0__ [日(にち)]', '[日(にち)] __RB1__ [月(つき)]', '甲\u200B乙[日(にち)]']) {
    assert.equal(splitBreakWordWithBracket(text).join(''), text);
  }
});

test('breaks follow visible text while keeping ruby atomic', () => {
  assert.deepEqual(splitBreakWordWithBracket('A[日(x)]B'), ['A', '[日(x)]', 'B']);
  assert.deepEqual(splitBreakWordWithBracket('[A(a)][B(b)]C'), ['[A(a)][B(b)]C']);
  assert.deepEqual(splitBreakWordWithBracket('[長い長い長い正文(ruby)]。'), ['[長い長い長い正文(ruby)]。']);
  assert.deepEqual(splitBreakWordWithBracket('[長い正文()]。'), ['[長い正文()]。']);
  const ruby = parseBreakText('[①甲(いち)]', '①').flat();
  assert.equal(ruby.length, 1);
  assert.equal(ruby[0].text, '①甲');
  assert.equal(ruby[0].atomic, true);
});

test('spacing units do not introduce forbidden punctuation or NBSP breaks', () => {
  assert.deepEqual(splitBreakWord('前甲 ，乙'), ['前', '甲 ，', '乙']);
  assert.deepEqual(splitBreakWord('X 100\u00A0ATK'), ['X', ' ', '100\u00A0ATK']);
  assert.deepEqual(splitBreakWord('甲（乙）丙'), ['甲', '（乙）', '丙']);
  assert.deepEqual(splitBreakWordWithBracket('[甲(こう)]。乙'), ['[甲(こう)]。', '乙']);
});

test('hard break forms normalize only at the layout parsing boundary', () => {
  for (const separator of ['\n', '\r\n', '\r', '\u0085', '\u2028', '\u2029']) {
    const source = `甲${separator}乙`;
    assert.equal(splitBreakWordWithBracket(source).join(''), source);
    assert.deepEqual(parseBreakText(source).map(group => group.map(item => item.text).join('')), ['甲', '\n', '乙']);
  }
});

test('grapheme protection preserves IVS, newer emoji and combining characters', () => {
  for (const cluster of ['か\u3099', '葛\u{E0100}', '🫶🏽', '👨‍👩‍👧‍👦', '甲\u1039']) {
    assert.deepEqual(splitBreakWord(cluster), [cluster]);
    assert.deepEqual(mergeGraphemeTokens(cluster, Array.from(cluster)), [cluster]);
    assert.deepEqual(splitBreakWordWithBracket(`[${cluster}(x)]`), [`[${cluster}(x)]`]);
  }
  assert.deepEqual(splitBreakWord('A𱍐𱍑B'), ['A', '𱍐', '𱍑', 'B']);
});

test('bold tags change style without inserting word boundaries', () => {
  const groups = parseBreakText('hel<b>lo</b> world');
  assert.deepEqual(groups.map(group => group.map(item => item.text).join('')), ['hello', ' ', 'world']);
  assert.deepEqual(groups[0].map(item => item.bold), [false, true]);
});

test('mixed markup round-trips and every emitted break falls on a visible grapheme boundary', () => {
  const parts = ['甲', 'A', '__RB0__', '[日(にち)]', '[長い正文()]', '<b>', '</b>', 'か\u3099', '葛\u{E0100}', '🫶🏽', '𱍐', '。', '（', ' ', '\u00A0', '\u200B', '\r\n', '[未完('];
  let seed = 0x3236;
  for (let sample = 0; sample < 300; sample++) {
    let source = '';
    for (let index = 0; index < 10; index++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      source += parts[seed % parts.length];
    }
    assert.equal(splitBreakWordWithBracket(source).join(''), source);
    const groups = parseBreakText(source);
    const visible = groups.flat().map(item => item.text).join('');
    const boundaries = graphemeBoundaries(visible);
    let offset = 0;
    for (const group of groups) {
      offset += group.reduce((sum, item) => sum + item.text.length, 0);
      assert.ok(boundaries.has(offset), source);
    }
  }
});
