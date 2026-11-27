'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Icon } from '@/components/site/Icon';
import { BASE_PATH } from '@/lib/config';
import { insert, list, remove, update, type Table } from '@/lib/admin/db';
import { useAuth } from '@/lib/admin/auth';
import { slugify } from '@/lib/format';
import { Badge, Empty, ImageInput, ImagesInput, Modal, PageTitle, Spinner, Toggle, useUi } from './ui';

export type FieldType = 'text' | 'textarea' | 'number' | 'bool' | 'select' | 'image' | 'images' | 'datetime' | 'date' | 'time' | 'slug';
export interface Field {
  name: string; label: string; type: FieldType; required?: boolean; help?: string;
  options?: { value: string; label: string }[]; rows?: number; placeholder?: string; full?: boolean;
  slugFrom?: string; folder?: string;
}

type Row = Record<string, any>;

export interface EntityConfig {
  table: Table;
  section: string;                 // permission section
  title: string;
  description?: string;
  singular: string;                // e.g. "програму"
  fields: Field[];
  defaults: Row;
  order: [string, boolean?][];
  titleField: string;
  subtitle?: (r: Row) => ReactNode;
  thumb?: (r: Row) => string | null | undefined;
  previewUrl?: (r: Row) => string;
  badges?: (r: Row) => ReactNode;
  extraLookup?: () => Promise<Record<string, { value: string; label: string }[]>>;
}

/** Turns a form row into a DB-safe payload (types and empty values). */
export function normalize(fields: Field[], row: Row): Row {
  const out: Row = {};
  for (const f of fields) {
    let v = row[f.name];
    if (f.type === 'number') v = v === '' || v === null || v === undefined ? 0 : Number(v);
    if (f.type === 'bool') v = !!v;
    if (f.type === 'images') v = Array.isArray(v) ? v : [];
    if ((f.type === 'datetime' || f.type === 'date') && !v) v = null;
    if (f.type === 'datetime' && v) v = new Date(v).toISOString();
    if (f.type === 'time' && !v) v = f.required ? '09:00' : null;
    if (f.type === 'select' && v === '') v = null;
    if (f.type === 'image' && !v) v = null;
    if (f.type === 'slug') v = slugify(v || row[f.slugFrom || 'title'] || '');
    if ((f.type === 'text' || f.type === 'textarea') && v == null) v = '';
    out[f.name] = typeof v === 'string' ? v.trim() : v;
  }
  return out;
}

function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EntityForm({ fields, value, onChange, lookups }: { fields: Field[]; value: Row; onChange: (v: Row) => void; lookups?: Record<string, { value: string; label: string }[]> }) {
  const set = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const full = f.full || ['textarea', 'image', 'images'].includes(f.type);
        const opts = f.options || lookups?.[f.name] || [];
        const id = `f-${f.name}`;
        return (
          <div key={f.name} className={full ? 'sm:col-span-2' : ''}>
            {f.type === 'bool' ? (
              <div className="pt-2"><Toggle checked={!!value[f.name]} onChange={(v) => set(f.name, v)} label={f.label} /></div>
            ) : f.type === 'image' ? (
              <ImageInput value={value[f.name] || null} onChange={(v) => set(f.name, v)} folder={f.folder || 'misc'} label={f.label} />
            ) : f.type === 'images' ? (
              <ImagesInput value={value[f.name] || []} onChange={(v) => set(f.name, v)} folder={f.folder || 'misc'} />
            ) : (
              <>
                <label className="label" htmlFor={id}>{f.label}{f.required && ' *'}</label>
                {f.type === 'textarea' ? (
                  <textarea id={id} className="input" rows={f.rows || 4} value={value[f.name] ?? ''} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />
                ) : f.type === 'select' ? (
                  <select id={id} className="input" value={value[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)}>
                    {!f.required && <option value="">—</option>}
                    {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === 'datetime' ? (
                  <input id={id} type="datetime-local" className="input" value={toLocalInput(value[f.name])} onChange={(e) => set(f.name, e.target.value ? new Date(e.target.value).toISOString() : null)} />
                ) : (
                  <input id={id} className="input" placeholder={f.placeholder}
                    type={f.type === 'number' ? 'number' : f.type === 'time' ? 'time' : f.type === 'date' ? 'date' : 'text'}
                    value={f.type === 'time' ? String(value[f.name] ?? '').slice(0, 5) : value[f.name] ?? ''}
                    onChange={(e) => set(f.name, e.target.value)} />
                )}
              </>
            )}
            {f.help && <p className="mt-1.5 text-xs text-ink-mute">{f.help}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function EntityManager({ config }: { config: EntityConfig }) {
  const { can, canEdit, profile } = useAuth();
  const { toast, confirm } = useUi();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [lookups, setLookups] = useState<Record<string, { value: string; label: string }[]>>({});
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Row>({});
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');

  const editor = canEdit(config.section);
  const isEmployee = profile?.role === 'employee';
  const mayView = editor || isEmployee || can(config.section);

  const load = useCallback(async () => {
    try {
      setRows(await list(config.table, { order: config.order }));
      if (config.extraLookup) setLookups(await config.extraLookup());
    } catch (e: any) { toast(e.message, 'error'); setRows([]); }
  }, [config, toast]);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => (rows || []).filter((r) => !q || String(r[config.titleField] || '').toLowerCase().includes(q.toLowerCase())), [rows, q, config.titleField]);

  if (!mayView) return <Empty text="У вас немає доступу до цього розділу. Зверніться до власника." />;

  const open = (r: Row | null) => { setEditing(r || {}); setForm(r ? { ...r } : { ...config.defaults }); setNote(''); };
  const isNew = editing && !editing.id;

  async function save(publish?: boolean) {
    const missing = config.fields.filter((f) => f.required && f.type !== 'slug' && !String(form[f.name] ?? '').trim());
    if (missing.length) { toast(`Заповніть: ${missing.map((m) => m.label).join(', ')}`, 'error'); return; }
    const data = normalize(config.fields, form);
    if ('is_published' in config.defaults) data.is_published = publish !== undefined ? publish : !!form.is_published;
    if (config.table === 'posts' && data.is_published && !form.published_at) data.published_at = new Date().toISOString();
    setSaving(true);
    try {
      if (editor) {
        if (isNew) await insert(config.table, data); else await update(config.table, editing!.id, data);
        toast(data.is_published === false ? 'Збережено як чернетку' : 'Збережено');
      } else {
        await insert('change_requests', {
          title: `${isNew ? 'Нове' : 'Зміна'}: ${data[config.titleField] || config.singular}`,
          message: note, target_table: config.table, target_id: isNew ? null : editing!.id, payload: data,
        });
        toast('Пропозицію надіслано власнику на погодження');
      }
      setEditing(null); load();
    } catch (e: any) { toast(e.message, 'error'); } finally { setSaving(false); }
  }

  async function del(r: Row) {
    if (!(await confirm(`Видалити «${r[config.titleField]}»? Цю дію не можна скасувати.`, { danger: true, ok: 'Видалити' }))) return;
    try { await remove(config.table, r.id); toast('Видалено'); load(); } catch (e: any) { toast(e.message, 'error'); }
  }

  async function togglePublish(r: Row) {
    try {
      const patch: Row = { is_published: !r.is_published };
      if (config.table === 'posts' && !r.is_published && !r.published_at) patch.published_at = new Date().toISOString();
      await update(config.table, r.id, patch); load();
      toast(r.is_published ? 'Знято з публікації' : 'Опубліковано');
    } catch (e: any) { toast(e.message, 'error'); }
  }

  return (
    <div>
      <PageTitle title={config.title} text={config.description}
        action={(editor || isEmployee) && (
          <button className="btn-primary" onClick={() => open(null)}><span className="text-lg leading-none">+</span> {editor ? `Додати ${config.singular}` : `Запропонувати ${config.singular}`}</button>
        )} />
      {!editor && isEmployee && (
        <p className="mb-5 rounded-2xl bg-violet-soft p-4 text-sm text-violet">Ви працівник: зміни надсилаються власнику як пропозиції й з’являться на сайті після погодження.</p>
      )}
      {rows && rows.length > 6 && <input className="input mb-4 max-w-sm" placeholder="Пошук…" value={q} onChange={(e) => setQ(e.target.value)} />}
      {!rows ? <Spinner /> : shown.length === 0 ? <Empty text="Тут поки порожньо." /> : (
        <ul className="space-y-3">
          {shown.map((r) => {
            const th = config.thumb?.(r);
            return (
              <li key={r.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                {config.thumb && (
                  <div className="grid h-16 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-paper-cool">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {th ? <img src={th} alt="" className="h-full w-full object-cover" /> : <Icon name="image" className="h-6 w-6 text-ink-mute" />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{r[config.titleField] || '(без назви)'}</p>
                    {'is_published' in r && (r.is_published ? <Badge tone="green">Опубліковано</Badge> : <Badge tone="yellow">Чернетка</Badge>)}
                    {config.badges?.(r)}
                  </div>
                  {config.subtitle && <p className="mt-1 truncate text-sm text-ink-mute">{config.subtitle(r)}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.previewUrl && <a className="btn-ghost !px-3 !py-2" target="_blank" rel="noopener" href={`${BASE_PATH}${config.previewUrl(r)}`} title="Попередній перегляд"><Icon name="external" className="h-4 w-4" /> Перегляд</a>}
                  {editor && 'is_published' in r && <button className="btn-ghost !px-3 !py-2" onClick={() => togglePublish(r)}>{r.is_published ? 'Сховати' : 'Опублікувати'}</button>}
                  {(editor || isEmployee) && <button className="btn-ghost !px-3 !py-2" onClick={() => open(r)}><Icon name="pencil" className="h-4 w-4" /> {editor ? 'Редагувати' : 'Запропонувати зміну'}</button>}
                  {editor && <button className="btn !px-3 !py-2 text-red hover:bg-red-soft" onClick={() => del(r)} aria-label="Видалити">Видалити</button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`${isNew ? 'Нове' : 'Редагування'}: ${config.singular}`}>
        <EntityForm fields={config.fields} value={form} onChange={setForm} lookups={lookups} />
        {!editor && (
          <div className="mt-4">
            <label className="label" htmlFor="cr-note">Коментар для власника</label>
            <textarea id="cr-note" className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="btn-ghost" onClick={() => setEditing(null)}>Скасувати</button>
          {editor && 'is_published' in config.defaults ? (
            <>
              <button className="btn-ghost" disabled={saving} onClick={() => save(false)}>Зберегти чернетку</button>
              <button className="btn-primary" disabled={saving} onClick={() => save(true)}>{saving ? 'Збереження…' : 'Опублікувати'}</button>
            </>
          ) : (
            <button className="btn-primary" disabled={saving} onClick={() => save()}>{saving ? 'Збереження…' : editor ? 'Зберегти' : 'Надіслати на погодження'}</button>
          )}
        </div>
        {editor && 'is_published' in config.defaults && (
          <p className="mt-3 text-xs text-ink-mute">Порада: збережіть чернетку й натисніть «Перегляд», щоб побачити, як це виглядатиме на сайті, перш ніж публікувати.</p>
        )}
      </Modal>
    </div>
  );
}
