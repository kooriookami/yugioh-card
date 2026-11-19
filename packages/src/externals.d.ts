// The browser and Node entry points expose the same Leafer API used by the library.
declare module 'leafer-unified' {
  export { Group, Image, ImageEvent, ImageManager, Leafer, LeaferEvent, Rect, Resource, Text, useCanvas } from 'leafer';
}

declare module 'lodash-unified' {
  export function isPlainObject(value: unknown): value is Record<string, unknown>;
}

declare module 'fontkit/core' {
  type FontFormat = abstract new (...args: never[]) => unknown;

  export function create(data: Uint8Array): import('./utils/font-info.ts').FontInfo;
  export function registerFormat(format: FontFormat): void;
}

declare module 'fontkit/formats/TTFFont' {
  import type { FontFormat } from 'fontkit/core';
  export const TTFFont: FontFormat;
}

declare module 'fontkit/formats/WOFFFont' {
  import type { FontFormat } from 'fontkit/core';
  export const WOFFFont: FontFormat;
}

declare module 'fontkit/formats/WOFF2Font' {
  import type { FontFormat } from 'fontkit/core';
  export const WOFF2Font: FontFormat;
}
