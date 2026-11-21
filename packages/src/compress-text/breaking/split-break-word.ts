import { LineBreaker } from 'css-line-break';
import { graphemeBoundaries } from './text-graphemes.ts';

// 划分 word-spacing 的测量项，合法断点由断行规则另行确定。
const wordSeparators = new Set([0x0020, 0x00A0, 0x1361, 0x10100, 0x10101, 0x1039F, 0x1091F]);
const rubySource = '\\[([^\\[\\]()\\r\\n\\f\\v\\u0085\\u2028\\u2029]+)\\(([^\\[\\]()\\r\\n\\f\\v\\u0085\\u2028\\u2029]*)\\)\\]';
const hardBreakPattern = /\r\n|[\r\n\f\v\u0085\u2028\u2029]/g;
interface TextPart {
  text: string;
  rt: string;
  raw: string;
  atomic: boolean;
  bold: boolean;
}

interface TextAtom extends TextPart {
  start: number;
  end: number;
}

export const emergencyBreakOffsets = (text: string) => {
  // 简单 ASCII 单词的所有字素边界都可应急断行，null 避免重复建立断点表。
  if (/^[A-Za-z0-9_]+$/.test(text)) return null;
  const result = new Set<number>();
  const boundaries = graphemeBoundaries(text);
  const breaker = LineBreaker(text, { lineBreak: 'strict', wordBreak: 'break-all' });
  let offset = 0;
  for (let part = breaker.next(); !part.done; part = breaker.next()) {
    offset += part.value.slice().length;
    if (boundaries.has(offset)) result.add(offset);
  }
  return result;
};

/** 纯文本超宽时允许在字素之间回退，但仍保留标点和不可断字符的约束。 */
export const emergencyBreaks = (graphemes: readonly string[]) => {
  const offsets = emergencyBreakOffsets(graphemes.join(''));
  if (!offsets) return null;
  const result = new Set<number>();
  let offset = 0;
  for (let index = 0; index < graphemes.length; index++) {
    offset += graphemes[index].length;
    if (offsets.has(offset)) result.add(index + 1);
  }
  return result;
};

/** 保留可见正文、注音与样式的关系，不在输入中插入替代字符。 */
const readAtoms = (text: string, ruby: boolean, richText: boolean) => {
  const atoms: TextAtom[] = [];
  const pattern = ruby ? new RegExp(rubySource + (richText ? '|(<b>|</b>)' : ''), 'g') : null;
  let sourceOffset = 0, offset = 0, bold = false;
  const add = (body: string, rt = '', raw = body, atomic = false) => {
    if (!body) return;
    atoms.push({ text: body, rt, raw, atomic, bold, start: offset, end: offset + body.length });
    offset += body.length;
  };
  if (pattern) for (const match of text.matchAll(pattern)) {
    add(text.slice(sourceOffset, match.index));
    if (match[3]) bold = match[3] === '<b>';
    else add(match[1], match[2], match[0], true);
    sourceOffset = match.index + match[0].length;
  }
  add(text.slice(sourceOffset));
  return atoms;
};

const cutOffsets = (text: string, atoms: readonly TextAtom[], boundaries: ReadonlySet<number>, fixed: ReadonlySet<string>) => {
  const cuts = new Set([text.length]);
  const breaker = LineBreaker(text, { lineBreak: 'strict', wordBreak: 'normal' });
  let offset = 0;
  for (let part = breaker.next(); !part.done; part = breaker.next()) {
    // LineBreaker 的 start/end 是码点索引；通过切片长度转换为 UTF-16 坐标。
    offset += part.value.slice().length;
    cuts.add(offset);
    // 行尾普通空格单独测量、清理；禁止据此拆开“空格 + 收尾标点”。
    let space = offset;
    while (space && text[space - 1] === ' ') cuts.add(--space);
  }
  for (const match of text.matchAll(hardBreakPattern)) {
    cuts.add(match.index);
    cuts.add(match.index + match[0].length);
  }
  let emergency: Set<number> | null | undefined;
  for (const atom of atoms) {
    if (atom.atomic) continue;
    let offset = atom.start;
    for (const char of atom.text) {
      if (fixed.has(char)) {
        emergency ??= emergencyBreakOffsets(text);
        for (const cut of [offset, offset + char.length]) if (!emergency || emergency.has(cut)) cuts.add(cut);
      }
      offset += char.length;
    }
  }
  const rubyAtoms = atoms.filter(atom => atom.atomic);
  let rubyIndex = 0;
  return [...cuts].sort((a, b) => a - b).filter(cut => {
    while (rubyIndex < rubyAtoms.length && rubyAtoms[rubyIndex].end <= cut) rubyIndex++;
    const atom = rubyAtoms[rubyIndex];
    return cut > 0 && boundaries.has(cut) && !(atom && atom.start < cut && cut < atom.end);
  });
};

/** 将绘制所需的独立空格、固定字符留在同一个断行单元里。 */
const splitPlain = (atom: TextAtom, start: number, end: number, boundaries: ReadonlySet<number>, fixed: ReadonlySet<string>) => {
  const parts: TextPart[] = [];
  let from = start, offset = start;
  const add = (to: number) => {
    if (to > from) {
      const text = atom.text.slice(from - atom.start, to - atom.start);
      parts.push({ text, raw: text, rt: '', bold: atom.bold, atomic: false });
    }
    from = to;
  };
  for (const char of atom.text.slice(start - atom.start, end - atom.start)) {
    const next = offset + char.length;
    if ((wordSeparators.has(char.codePointAt(0)!) || fixed.has(char) || char === '\u200B' || char === '\u2060') && boundaries.has(offset) && boundaries.has(next)) {
      add(offset); add(next);
    }
    offset = next;
  }
  add(end);
  return parts;
};

const segmentText = (text: string, ruby: boolean, richText: boolean, fixedText: string) => {
  const atoms = readAtoms(text, ruby, richText);
  const visible = atoms.map(atom => atom.text).join('');
  const boundaries = graphemeBoundaries(visible);
  const fixed = new Set(fixedText);
  const cuts = cutOffsets(visible, atoms, boundaries, fixed);
  const groups: TextPart[][] = [];
  let start = 0, atomIndex = 0;
  for (const end of cuts) {
    const group: TextPart[] = [];
    while (atomIndex < atoms.length && atoms[atomIndex].start < end) {
      const atom = atoms[atomIndex];
      if (atom.atomic) group.push(atom);
      else group.push(...splitPlain(atom, Math.max(start, atom.start), Math.min(end, atom.end), boundaries, fixed));
      if (atom.end > end) break;
      atomIndex++;
    }
    if (group.length) groups.push(group);
    start = end;
  }
  return groups;
};

/** 断行单元仅以真实正文的规则划分；输出拼接后保持原文。 */
export const splitBreakWord = (text: string) => segmentText(text, false, false, '').map(group => group.map(item => item.raw).join(''));

export const splitBreakWordWithBracket = (text: string) => segmentText(text, true, false, '').map(group => group.map(item => item.raw).join(''));

/** CompressText 内部入口：统一换行符，解析粗体、ruby 和合法断点。 */
export const parseBreakText = (text: string, fixedText = '') => {
  return segmentText(text.replace(hardBreakPattern, '\n').trimEnd(), true, true, fixedText);
};
