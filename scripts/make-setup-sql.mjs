// Concatenates migrations + seed into one file to paste into Supabase SQL Editor.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const dir = new URL('../supabase/migrations/', import.meta.url);
const parts = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => `-- >>> ${f}\n` + readFileSync(new URL(f, dir), 'utf8'));
parts.push('-- >>> seed.sql\n' + readFileSync(new URL('../supabase/seed.sql', import.meta.url), 'utf8'));
writeFileSync(new URL('../supabase/setup.sql', import.meta.url), '-- «Семицвіт»: full database setup. Paste everything into Supabase → SQL Editor → Run.\n\n' + parts.join('\n\n'));
console.log('supabase/setup.sql written');
