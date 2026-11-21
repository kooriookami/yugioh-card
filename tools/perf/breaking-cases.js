import { textCases as existingCases } from './layout-cases.js';

export const breakingCases = [
  ['placeholder collision', '__RB0__ [日(にち)]', 400],
  ['original zero width space', '甲\u200B乙[日(にち)]', 40],
  ['ruby next to Latin', '前前A[日(x)]B', 80],
  ['Latin ruby word', '[A(a)][B(b)]C', 200],
  ['no break space', 'X 100\u00A0ATK', 75, 'ygo-en'],
  ['comma after space', '前甲 ，乙', 48],
  ['punctuation fallback', '甲。乙。', 25],
  ['ruby punctuation fallback', '[甲(こう)]。乙', 25],
  ['long ruby', '[这是一段很长的文本这是一段很长的文本(ruby)]。', 100],
  ['empty annotation', '[这是一段很长的文本()]。', 100],
  ['CRLF', '甲\r\n乙', 200],
  ['line separator', '甲\u2028乙', 200],
  ['combining and IVS', 'か\u3099葛\u{E0100}𠮷[日(にち)]。', 60],
  ['ruby with fixed marker', '[①甲(いち)]乙', 200],
  ['bold boundary', 'hel<b>lo</b> world', 100, 'ygo-en'],
].map(([label, text, width, fontFamily = 'ygo-jp']) => ({ label, data: { text, width, fontFamily, fontSize: 20, rtFontSize: 6, textAlign: 'left', sideBearingMode: 'native' } }));

export const textCases = [...existingCases, ...breakingCases.map(item => item.data)];
