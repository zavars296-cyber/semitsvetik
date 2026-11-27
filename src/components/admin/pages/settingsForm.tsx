'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { getSettings, saveSettings } from '@/lib/admin/db';
import { useAuth } from '@/lib/admin/auth';
import { Empty, PageTitle, Spinner, useUi } from '../ui';

/** Loads site settings, lets a page edit a subset, saves with merge. */
export function SettingsPage({ title, text, children }: { title: string; text?: string; children: (s: any, set: (patch: any) => void) => ReactNode }) {
  const { canEdit } = useAuth();
  const { toast } = useUi();
  const [s, setS] = useState<any | null>(null);
  const [dirty, setDirty] = useState<any>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { getSettings().then(setS).catch((e) => toast(e.message, 'error')); }, [toast]);
  if (!canEdit('settings')) return <Empty text="Редагувати налаштування може власник або адміністратор із дозволом." />;
  if (!s) return <Spinner />;
  const set = (patch: any) => { setS({ ...s, ...patch }); setDirty({ ...dirty, ...patch }); };
  async function save() {
    setBusy(true);
    try { await saveSettings(dirty); setDirty({}); toast('Збережено. Зміни вже на сайті.'); } catch (e: any) { toast(e.message, 'error'); } finally { setBusy(false); }
  }
  return (
    <div className="max-w-3xl">
      <PageTitle title={title} text={text} />
      <div className="card space-y-5 p-5 sm:p-7">{children(s, set)}</div>
      <div className="sticky bottom-4 mt-5 flex justify-end">
        <button className="btn-primary !px-7 !py-3.5 shadow-lift" disabled={busy || !Object.keys(dirty).length} onClick={save}>{busy ? 'Збереження…' : Object.keys(dirty).length ? 'Зберегти зміни' : 'Збережено'}</button>
      </div>
    </div>
  );
}

export function TextField({ label, value, onChange, rows, placeholder, help }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; help?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {rows ? <textarea className="input" rows={rows} value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input className="input" value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
      {help && <p className="mt-1.5 text-xs text-ink-mute">{help}</p>}
    </div>
  );
}

export function ListEditor<T extends Record<string, string>>({ label, items, onChange, fields, empty }: { label: string; items: T[]; onChange: (v: T[]) => void; fields: { key: keyof T; label: string; rows?: number; placeholder?: string }[]; empty: T }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2 rounded-2xl bg-paper-cool p-3">
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              {fields.map((f) => f.rows
                ? <textarea key={String(f.key)} className="input sm:col-span-2" rows={f.rows} placeholder={f.label} value={it[f.key]} onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, [f.key]: e.target.value } : x)))} />
                : <input key={String(f.key)} className="input" placeholder={f.placeholder || f.label} value={it[f.key]} onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, [f.key]: e.target.value } : x)))} />)}
            </div>
            <button type="button" aria-label="Видалити рядок" className="h-10 w-10 shrink-0 rounded-full text-red hover:bg-red-soft" onClick={() => onChange(items.filter((_, k) => k !== i))}>✕</button>
          </div>
        ))}
        <button type="button" className="btn-ghost !py-2" onClick={() => onChange([...items, { ...empty }])}>+ Додати</button>
      </div>
    </div>
  );
}
