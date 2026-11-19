import { create, registerFormat } from 'fontkit/core';
import { TTFFont } from 'fontkit/formats/TTFFont';
import { WOFFFont } from 'fontkit/formats/WOFFFont';
import { WOFF2Font } from 'fontkit/formats/WOFF2Font';
import type { FontEntry } from './font-loader.ts';

registerFormat(TTFFont);
registerFormat(WOFFFont);
registerFormat(WOFF2Font);

export interface FontInfo {
  unitsPerEm: number;
  glyphForCodePoint(codePoint: number): { advanceWidth: number; bbox: { minX: number; maxX: number } };
  hasGlyphForCodePoint(codePoint: number): boolean;
}

const parsedFonts = new WeakMap<FontEntry, FontInfo | null>();

/** 复用实际加载的字节，按需解析一次；不依赖字体名、预写覆盖表或文件指纹。 */
export const getFontInfo = (entry: FontEntry | null | undefined) => {
  if (!entry?.fontData) return null;
  if (!parsedFonts.has(entry)) {
    try {
      const font = create(entry.fontData);
      if (!Number.isFinite(font.unitsPerEm) || font.unitsPerEm <= 0) throw new Error('Invalid font units');
      parsedFonts.set(entry, font);
    } catch {
      // 不能解析的字体仍可原生显示，不能让可选的留白调整破坏预览和 ready。
      parsedFonts.set(entry, null);
    }
  }
  return parsedFonts.get(entry);
};
