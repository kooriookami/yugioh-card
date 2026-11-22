import { fontFamilies, fontFamilyKey, getLoadedFontEntry, type FontEntry } from '../utils/font-loader.ts';
import { getFontInfo } from '../utils/font-info.ts';

interface GlyphMeasurement {
  advance: number;
  left: number;
  right: number;
}

export interface GlyphMetric {
  width: number;
  offset: number;
}

export type GlyphResolver = (character: string) => GlyphMetric | null;
export type SideBearingMode = 'native' | 'legacy';

const scripts = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]$/u;
const letter = /^\p{Letter}$/u;
const ideographs = /^[\p{Unified_Ideograph}\uF900-\uFAFF\u{2F800}-\u{2FA1F}]$/u;
const extras = new Set(Array.from('々〆゛゜ゝゞー'));
const fullWidthSamples = ['日', 'あ'];
const caches = new WeakMap<FontEntry, Map<string, GlyphMeasurement | null>>();

export const isSpacingCharacter = (character: string) => {
  if (Array.from(character).length !== 1 || (!extras.has(character) && !(scripts.test(character) && letter.test(character)))) return false;
  return true;
};

/** 只读取实际字体的 Regular 度量，消除 Canvas 后端边界差异及绘制样式的影响。 */
const measure = (codePoint: number, font: NonNullable<ReturnType<typeof getFontInfo>>) => {
  const glyph = font.glyphForCodePoint(codePoint);
  const advance = glyph.advanceWidth;
  const { minX, maxX } = glyph.bbox;
  const values = [advance, minX, advance - maxX, maxX - minX];
  if (!values.every(Number.isFinite)) return null;
  const [width, left, right, ink] = values.map(value => Math.abs(value - Math.round(value)) <= 0.01 ? Math.round(value) : value);
  return width > 0 && ink > 0 ? { advance: width, left, right, ink } : null;
};

/** 每个字体加载实例共享一份原始度量；字号、留白模式、后端和卡片版本不重复解析。 */
export const getGlyphMeasurements = (fontFamily: string, fonts?: ReadonlyMap<string, FontEntry>) => {
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
  const getMeasurement = (character: string) => {
    if (!cache.has(character)) {
      let metric: GlyphMeasurement | null = null;
      try {
        const codePoint = character.codePointAt(0)!;
        if (font.hasGlyphForCodePoint(codePoint)) metric = measure(codePoint, font);
      } catch { /* 无法确认字形覆盖时保留原生路径。 */ }
      cache.set(character, metric);
    }
    return cache.get(character);
  };
  return { units, getMeasurement };
};

export const getGlyphMetrics = (fontFamily: string, mode: SideBearingMode = 'native', fonts?: ReadonlyMap<string, FontEntry>): GlyphResolver | null => {
  if (mode !== 'legacy') return null;
  const measurements = getGlyphMeasurements(fontFamily, fonts);
  if (!measurements) return null;
  const { units, getMeasurement } = measurements;
  // 旧资源本身已有比例度量。按加载实例检查基准字，避免重复处理。
  if (fullWidthSamples.some(character => {
    const metric = getMeasurement(character);
    return metric && metric.advance !== units;
  })) return null;

  const hanPadding = 30 * units / 1024;
  return character => {
    if (!isSpacingCharacter(character)) return null;
    const metric = getMeasurement(character);
    if (!metric) return null;
    const { advance, left, right } = metric;
    const padding = ideographs.test(character) ? hanPadding : 0;
    const newLeft = Math.ceil(left * 0.5 + padding);
    const newRight = Math.ceil(right * 0.5 + padding);
    const width = advance + newLeft - left + newRight - right;
    if (width <= 0) return null;
    return { width: width / units, offset: (newLeft - left) / units };
  };
};
