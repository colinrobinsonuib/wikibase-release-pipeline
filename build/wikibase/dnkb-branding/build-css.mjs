import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Reuse DNKB's installed Tailwind compiler and palette rather than duplicating colors.
if (!process.argv[2]) throw new Error('Usage: node build-css.mjs /path/to/dnkb/app');
const app = resolve(process.argv[2]);
const { compile } = await import(pathToFileURL(resolve(app, 'node_modules/@tailwindcss/node/dist/index.mjs')));
const source = (await readFile(new URL('login.tailwind.css', import.meta.url), 'utf8'))
    .replace('../../app/node_modules/tailwindcss/theme.css', resolve(app, 'node_modules/tailwindcss/theme.css').replaceAll('\\', '/'))
    .replace('../../app/tailwind.config.ts', resolve(app, 'tailwind.config.ts').replaceAll('\\', '/'));
const result = await compile(source, { base: app, onDependency() {} });
await writeFile(new URL('DNKBBranding/login.css', import.meta.url), result.build([]));