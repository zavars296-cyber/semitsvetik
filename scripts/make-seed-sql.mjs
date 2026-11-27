// Generates supabase/seed.sql from src/content/seed.json (initial verified content).
import { readFileSync, writeFileSync } from 'node:fs';
const seed = JSON.parse(readFileSync(new URL('../src/content/seed.json', import.meta.url)));
const q = (v) => v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`;
const arr = (a) => `array[${a.map(q).join(',')}]::text[]`;
let out = `-- Initial content for «Семицвіт». Run AFTER migrations/0001_init.sql.\n-- Only verified facts are published; unconfirmed programs are inserted as drafts.\n\n`;
out += `update public.site_settings set data = ${q(JSON.stringify(seed.settings))}::jsonb where id = 1 and data = '{}'::jsonb;\n\n`;
for (const p of seed.programs) {
  out += `insert into public.programs (slug,title,short,description,age_group,schedule_text,price_text,color,photos,is_active,is_published,sort_order) values (${[p.slug,p.title,p.short,p.description,p.age_group,p.schedule_text,p.price_text,p.color].map(q).join(',')},${arr(p.photos)},${p.is_active},${p.is_published},${p.sort_order}) on conflict (slug) do nothing;\n`;
}
out += '\n';
for (const p of seed.posts) {
  out += `insert into public.posts (slug,kind,title,excerpt,body,event_date,is_published,published_at) values (${[p.slug,p.kind,p.title,p.excerpt,p.body,p.event_date].map(q).join(',')},${p.is_published},${q(p.published_at)}) on conflict (slug) do nothing;\n`;
}
writeFileSync(new URL('../supabase/seed.sql', import.meta.url), out);
console.log('supabase/seed.sql written');
