'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { list, remove, update } from '@/lib/admin/db';
import { useAuth } from '@/lib/admin/auth';
import { formatDate, telHref } from '@/lib/format';
import { Icon } from '@/components/site/Icon';
import { Badge, Empty, PageTitle, Spinner, useUi } from '../ui';

const statusLabel: Record<string, string> = { new: 'Нова', in_progress: 'В роботі', done: 'Оброблено', spam: 'Спам' };
const statusTone: Record<string, 'red' | 'blue' | 'green' | 'gray'> = { new: 'red', in_progress: 'blue', done: 'green', spam: 'gray' };
const kindLabel: Record<string, string> = { registration: 'Запис', question: 'Питання', birthday: 'День народження' };
const methodLabel: Record<string, string> = { phone: 'Дзвінок', viber: 'Viber', telegram: 'Telegram', whatsapp: 'WhatsApp', instagram: 'Instagram' };

function messengerLink(method: string, phone: string): string | null {
  const d = phone.replace(/[^\d]/g, '');
  if (method === 'viber') return `viber://chat?number=%2B${d}`;
  if (method === 'telegram') return `https://t.me/+${d}`;
  if (method === 'whatsapp') return `https://wa.me/${d}`;
  return null;
}

export function Registrations() {
  const { can, canEdit, isOwner } = useAuth();
  const { toast, confirm } = useUi();
  const [rows, setRows] = useState<any[] | null>(null);
  const [filter, setFilter] = useState('new');
  const editable = canEdit('registrations');

  const load = useCallback(() => list('registrations', { order: [['created_at', false]], limit: 500 }).then(setRows).catch((e) => { toast(e.message, 'error'); setRows([]); }), [toast]);
  useEffect(() => { load(); }, [load]);
  const shown = useMemo(() => (rows || []).filter((r) => filter === 'all' || r.status === filter), [rows, filter]);

  if (!can('registrations')) return <Empty text="У вас немає доступу до заявок." />;

  async function setStatus(r: any, status: string) {
    try { await update('registrations', r.id, { status, processed_at: new Date().toISOString() }); load(); } catch (e: any) { toast(e.message, 'error'); }
  }
  async function saveNote(r: any, admin_note: string) {
    if (admin_note === r.admin_note) return;
    try { await update('registrations', r.id, { admin_note }); toast('Нотатку збережено'); load(); } catch (e: any) { toast(e.message, 'error'); }
  }
  async function del(r: any) {
    if (!(await confirm(`Видалити заявку від ${r.parent_name}? Дані буде стерто остаточно.`, { danger: true, ok: 'Видалити' }))) return;
    try { await remove('registrations', r.id); load(); } catch (e: any) { toast(e.message, 'error'); }
  }
  function exportCsv() {
    const cols = ['created_at', 'kind', 'status', 'parent_name', 'phone', 'child_age', 'program', 'contact_method', 'message', 'admin_note'];
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = '﻿' + [cols.join(';'), ...shown.map((r) => cols.map((c) => esc(r[c])).join(';'))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `zaiavky-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }

  const counts = (s: string) => (rows || []).filter((r) => s === 'all' || r.status === s).length;

  return (
    <div>
      <PageTitle title="Заявки батьків" text="Заявки з форм запису, питань і днів народження. Дані бачать лише працівники з доступом."
        action={<button className="btn-ghost" onClick={exportCsv} disabled={!shown.length}>Завантажити CSV</button>} />
      <div className="mb-5 flex flex-wrap gap-2">
        {['new', 'in_progress', 'done', 'spam', 'all'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ${filter === s ? 'bg-ink text-white ring-ink' : 'bg-white text-ink-soft ring-line'}`}>
            {s === 'all' ? 'Усі' : statusLabel[s]} <span className="opacity-60">{counts(s)}</span>
          </button>
        ))}
      </div>
      {!rows ? <Spinner /> : !shown.length ? <Empty text="Немає заявок у цьому розділі." /> : (
        <ul className="space-y-3">
          {shown.map((r) => {
            const m = messengerLink(r.contact_method, r.phone);
            return (
              <li key={r.id} className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold">{r.parent_name}</p>
                      <Badge tone={statusTone[r.status]}>{statusLabel[r.status]}</Badge>
                      <Badge tone="violet">{kindLabel[r.kind] || r.kind}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-mute">{formatDate(r.created_at)}, {new Date(r.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' })}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={telHref(r.phone)} className="btn-accent !py-2"><Icon name="phone" className="h-4 w-4" /> {r.phone}</a>
                    {m && <a href={m} target="_blank" rel="noopener" className="btn-ghost !py-2"><Icon name="chat" className="h-4 w-4" /> {methodLabel[r.contact_method]}</a>}
                  </div>
                </div>
                <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                  {r.child_age && <div><dt className="text-ink-mute">Вік дитини</dt><dd className="font-medium">{r.child_age}</dd></div>}
                  {r.program && <div><dt className="text-ink-mute">Програма</dt><dd className="font-medium">{r.program}</dd></div>}
                  <div><dt className="text-ink-mute">Зв’язок</dt><dd className="font-medium">{methodLabel[r.contact_method] || r.contact_method}</dd></div>
                </dl>
                {r.message && <p className="mt-3 rounded-2xl bg-paper-cool p-3 text-sm">{r.message}</p>}
                {editable && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 lg:flex-row lg:items-center">
                    <input className="input !py-2 lg:flex-1" placeholder="Нотатка адміністратора (бачать лише працівники)" defaultValue={r.admin_note} onBlur={(e) => saveNote(r, e.target.value)} />
                    <div className="flex flex-wrap gap-2">
                      {r.status !== 'in_progress' && <button className="btn-ghost !py-2" onClick={() => setStatus(r, 'in_progress')}>В роботу</button>}
                      {r.status !== 'done' && <button className="btn !py-2 bg-green text-white hover:bg-green-deep" onClick={() => setStatus(r, 'done')}><Icon name="check" className="h-4 w-4" /> Оброблено</button>}
                      {r.status !== 'spam' && <button className="btn-ghost !py-2" onClick={() => setStatus(r, 'spam')}>Спам</button>}
                      {isOwner && <button className="btn !py-2 text-red hover:bg-red-soft" onClick={() => del(r)}>Видалити</button>}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
