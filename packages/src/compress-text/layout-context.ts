import type { FontEntry } from '../utils/font-loader.ts';

interface TextLayoutContext {
  fontVersion: number;
  loadedFonts: ReadonlyMap<string, FontEntry>;
}

let context: TextLayoutContext | null = null;

export const getTextLayoutContext = () => context;

/** 内置卡片的 draw 是同步的；恢复上下文，避免影响独立使用的 CompressText。 */
export const withTextLayoutContext = <T>(value: TextLayoutContext | null, draw: () => T) => {
  const previous = context;
  context = value;
  try {
    return draw();
  } finally {
    context = previous;
  }
};
