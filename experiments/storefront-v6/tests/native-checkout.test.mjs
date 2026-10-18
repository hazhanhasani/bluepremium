import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const source=await readFile(new URL('../src/lib/native-checkout.ts',import.meta.url),'utf8');
const stub=source.replace(/import\s+\{[\s\S]*?\}\s+from\s+'\.\/bluepremium-api';/,