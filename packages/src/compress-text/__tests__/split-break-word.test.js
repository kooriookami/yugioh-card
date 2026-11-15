import test from 'node:test';
import assert from 'node:assert/strict';
import { splitBreakWord, splitBreakWordWithBracket } from '../split-break-word.js';

const separatorCharList = [
  ' ',
  '\u00A0',
  String.fromCodePoint(0x1361),
  String.fromCodePoint(0x10100),
  String.fromCodePoint(0x10101),
  String.fromCodePoint(0x1039),
  String.fromCodePoint(0x1091),
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
    assert.ok(result.includes(separator));
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
    ['abc[自(じ)]', '[分(ぶん)]def'],
  );

  assert.deepEqual(
    splitBreakWordWithBracket('●[相(あい)][手(て)]フィールドのカード１枚'),
    ['●[相(あい)]', '[手(て)]', 'フィー', 'ル', 'ド', 'の', 'カー', 'ド', '１', '枚'],
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
