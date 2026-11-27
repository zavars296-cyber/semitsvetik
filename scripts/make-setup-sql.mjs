// Builds compact paste-friendly files for Supabase → SQL Editor:
//   supabase/setup-1-schema.sql  (migrations, comments stripped)
//   supabase/setup-2-content.sql (initial content)
import { readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
const dir = new URL('../supabase/migrations/', import.meta.url);
const strip = (sql) => sql.split('\n').filter((l) => !/^\s*--/.test(l) && l.trim() !== '').map((l) => l.replace(/\s+--\s.*$/, '')).join('\n');
const schema = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => strip(readFileSync(new URL(f, dir), 'utf8'))).join('\n');
writeFileSync(new URL('../supabase/setup-1-schema.sql', import.meta.url), schema + '\nselect \'STEP 1 OK\' as result;\n');
const seed = strip(readFileSync(new URL('../supabase/seed.sql', import.meta.url), 'utf8'));
writeFileSync(new URL('../supabase/setup-2-content.sql', import.meta.url), seed + '\nselect \'STEP 2 OK\' as result;\n');
try { rmSync(new URL('../supabase/setup.sql', import.meta.url)); } catch {}
console.log('setup files written');
