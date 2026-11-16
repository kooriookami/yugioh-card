import { fontFamilies, fontFamilyKey, getLoadedFontEntry } from '../utils/font-loader.js';
import { getFontInfo } from '../utils/font-info.js';
export { textGraphemes } from './text-graphemes.js';

const scripts = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]$/u;
const letter = /^\p{Letter}$/u;
const extras = new Set(Array.from('々〆゛゜ゝゞー'));
const caches = new WeakMap();

export const isSpacingCharacter = character => {
  if (Array.from(character).length !== 1 || (!extras.has(character) && !(scripts.test(character) && letter.test(character)))) return false;
  return true;
};

/** 只读取实际字体的 Regular 度量，消除 Canvas 后端边界差异及绘制样式的影响。 */
const measure = (character, font) => {
  const glyph = font.glyphForCodePoint(character.codePointAt(0));
  const advance = glyph.advanceWidth;
  const { minX, maxX } = glyph.bbox;
  const values = [advance, minX, advance - maxX, maxX - minX];
  if (!values.every(Number.isFinite)) return null;
  const [width, left, right, ink] = values.map(value => Math.abs(value - Math.round(value)) <= 0.01 ? Math.round(value) : value);
  return width > 0 && ink > 0 ? { advance: width, left, right, ink } : null;
};

/** 每个字体加载实例共享一份原始度量；字号、比例、后端和卡片版本不重复解析。 */
export const getGlyphMetrics = (fontFamily, ratio, fonts) => {
  if (!Number.isFinite(ratio) || ratio >= 1) return null;
  const family = fontFamilies(fontFamily)[0];
  const entry = fonts === undefined ? getLoadedFontEntry(family) : [...fonts].find(([name]) => fontFamilyKey(name) === fontFamilyKey(family))?.[1];
  if (!entry || entry.status !== 'loaded') return null;
  const font = getFontInfo(entry);
  if (!font) return null;
  const units = font.unitsPerEm;
  let cache = caches.get(entry);
  if (!cache) {
    cache = new Map();
    caches.set(entry, cache);
  }
  const r = Math.max(0, ratio);
  return character => {
    if (!isSpacingCharacter(character)) return null;
    if (!cache.has(character)) {
      let metric = null;
      try {
        if (font.hasGlyphForCodePoint(character.codePointAt(0))) metric = measure(character, font);
      } catch { /* 无法确认字形覆盖时保留原生路径。 */ }
      cache.set(character, metric);
    }
    const metric = cache.get(character);
    if (!metric) return null;
    const { advance, left, right } = metric;
    const newLeft = left > 0 ? Math.min(left, Math.ceil(left * r)) : left;
    const newRight = right > 0 ? Math.min(right, Math.ceil(right * r)) : right;
    const width = advance + newLeft - left + newRight - right;
    if (width <= 0 || width > advance) return null;
    return { width: width / units, offset: (newLeft - left) / units };
  };
};
