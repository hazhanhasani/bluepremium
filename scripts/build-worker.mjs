import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';

const dir = new URL('../src/parts/', import.meta.url);
const files = (await readdir(dir)).filter((name) => name.endsWith('.part')).sort();
const source = (await Promise.all(files.map((name) => readFile(new URL(name, dir), 'utf8')))).join('');
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/worker.js', import.meta.url), source, 'utf8');
console.log(`Built dist/worker.js from ${files.length} source parts.`);
