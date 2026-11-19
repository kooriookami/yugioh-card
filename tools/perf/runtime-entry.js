import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const moduleLoader = entry => {
  const extension = existsSync(path.join(entry, 'index.ts')) ? '.ts' : '.js';
  return module => import(pathToFileURL(path.join(entry, module + extension)));
};
