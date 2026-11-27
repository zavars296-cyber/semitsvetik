'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { insert, list, remove, update } from '@/lib/admin/db';
import { useAuth } from '@/lib/admin/auth';
import { formatDate } from '@/lib/format';
import { Badge, Empty, Modal, PageTitle, Spinner, useUi } from '../ui';
import { EntityForm, normalize } from '../EntityManager';
import { configsByTable } from '../configs';

const statusLabel: Record<string, string> = { pending: 'На розгляді', approved: 'Схвалено', rejected: 'Відхилено', published: 'Опубліковано' };
const statusTone: Record<string, 'yellow' | 'green' | 'red' | 'blue'> = { pending: 'yellow', approved: 'blue', rejected: 'red', published: 'green' };

export function Requests() {
  const auth = useAuth();
  const { toast, confirm } = useUi();
  const reviewer = auth.isOwner || (auth.isEditor && auth.can('requests_review'));
  const [rows, setRows] = useState<any[] | null>(null);
  const [filter, setFilter] = useState('pending');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ title: '', message: '' });
  const [reviewing, setReviewing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => list('change_requests', { order: [['created_at', false]] }).then(setRows).catch((e) => { toast(e.message, 'error'); setRows([]); }), [toast]);
  useEffect(() => { load(); }, [load]);
  const mine = (r: any) => r.author_id === auth.profile?.id;
  const shown = useMemo(() => (rows || []).filter((r) => (reviewer || mine(r)) && (filter === 'all' || r.status === filter)), [rows, filter, reviewer]); // eslint-disable-line react-hooks/exhaustive-deps

  async function create() {
    if (draft.title.trim().length < 2) { toast('Вкажіть коротко, що потрібно зробити', 'error'); return; }
    setBusy(true);
    try { await insert('change_requests', { title: draft.title.trim(), message: draft.message.trim() }); toast('Надіслано власнику'); setCreating(false); setDraft({ title: '', message: '' }); load(); }
    catch (e: any) { toast(e.message, 'error'); } finally { setBusy(false); }
  }

  function openReview(r: any) { setReviewing(r); setForm(r.payload ? { ...r.payload } : {}); setNote(r.reviewer_note || ''); }

  async function decide(status: 'approved' | 'rejected' | 'published') {
    const r = reviewing;
    setBusy(true);
    try {
      if (status === 'published' && r.payload && r.target_table) {
        const cfg = configsByTable[r.target_table];
        const data = cfg ? normalize(cfg.fields, form) : form;
        if ('is_published' in (cfg?.defaults || {})) data.is_published = true;
        if (r.target_table === 'posts' && !data.published_at) data.published_at = new Date().toISOString();
        if (r.target_id) await update(r.target_table, r.target_id, data); else await insert(r.target_table, data);
      }
      await update('change_requests', r.id, { status, reviewer_note: note });
      toast(status === 'published' ? 'Опубліковано на сайті' : status === 'approved' ? 'Схвалено' : 'Відхилено');
      setReviewing(null); load();
    } catch (e: any) { toast(e.message, 'error'); } finally { setBusy(false); }
  }

  async function del(r: any) {
    if (!(await confirm('Видалити цю пропозицію?', { danger: true, ok: 'Видалити' }))) return;
    try { await remove('change_requests', r.id); load(); } catch (e: any) { toast(e.message, 'error'); }
  }

  const cfg = reviewing?.target_table ? configsByTable[reviewing.target_table] : null;

  return (
    <div>
      <PageTitle title="Пропозиції працівників"
        text={reviewer ? 'Працівники пропонують зміни — ви схвалюєте, редагуєте, публікуєте або відхиляєте.' : 'Напишіть власнику, що варто змінити на сайті. Тут видно статус ваших пропозицій.'}
        action={<button className="btn-primary" onClick={() => setCreating(true)}>+ Нова пропозиція</button>} />
      <div className="mb-5 flex flex-wrap gap-2">
        {['pending', 'approved', 'published', 'rejected', 'all'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ${filter === s ? 'bg-ink text-white ring-ink' : 'bg-white text-ink-soft ring-line'}`}>{s === 'all' ? 'Усі' : statusLabel[s]}</button>
        ))}
      </div>
      {!rows ? <Spinner /> : !shown.length ? <Empty text="Пропозицій немає." /> : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={r.id} className="card p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{r.title}</p><Badge tone={statusTone[r.status]}>{statusLabel[r.status]}</Badge>{r.payload && <Badge tone="violet">з готовими змінами</Badge>}</div>
                  <p className="mt-1 text-sm text-ink-mute">{r.author_name || 'Працівник'} · {formatDate(r.created_at)}</p>
                  {r.message && <p className="mt-3 whitespace-pre-line text-sm text-ink-soft">{r.message}</p>}
                  {r.reviewer_note && <p className="mt-3 rounded-xl bg-paper-cool p-3 text-sm"><span className="font-medium">Відповідь: </span>{r.reviewer_note}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {reviewer && r.status === 'pending' && <button className="btn-primary !py-2" onClick={() => openReview(r)}>Розглянути</button>}
                  {(auth.isOwner || (mine(r) && r.status === 'pending')) && <button className="btn !py-2 text-red hover:bg-red-soft" onClick={() => del(r)}>Видалити</button>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Нова пропозиція">
        <div className="space-y-4">
          <div><label className="label" htmlFor="cr-t">Що потрібно зробити *</label><input id="cr-t" className="input" placeholder="Напр.: Додати нову групу розвитку з грудня" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
          <div><label className="label" htmlFor="cr-m">Подробиці</label><textarea id="cr-m" className="input" rows={5} value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} /></div>
          <p className="text-xs text-ink-mute">Порада: щоб одразу запропонувати готовий текст програми чи новини, відкрийте відповідний розділ і натисніть «Запропонувати».</p>
          <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={() => setCreating(false)}>Скасувати</button><button className="btn-primary" disabled={busy} onClick={create}>Надіслати</button></div>
        </div>
      </Modal>

      <Modal open={!!reviewing} onClose={() => setReviewing(null)} title={reviewing?.title || ''}>
        {reviewing?.message && <p className="mb-4 whitespace-pre-line rounded-2xl bg-paper-cool p-4 text-sm">{reviewing.message}</p>}
        {reviewing?.payload && cfg && (
          <div className="mb-5">
            <p className="mb-3 text-sm font-semibold">Запропоновані зміни ({cfg.title.toLowerCase()}) — можна відредагувати перед публікацією:</p>
            <EntityForm fields={cfg.fields} value={form} onChange={setForm} />
          </div>
        )}
        <label className="label" htmlFor="rv-n">Відповідь працівнику</label>
        <textarea id="rv-n" className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="btn !text-red hover:bg-red-soft" disabled={busy} onClick={() => decide('rejected')}>Відхилити</button>
          <button className="btn-ghost" disabled={busy} onClick={() => decide('approved')}>{reviewing?.payload ? 'Схвалити без публікації' : 'Схвалити'}</button>
          {reviewing?.payload && <button className="btn-primary" disabled={busy} onClick={() => decide('published')}>Опублікувати на сайті</button>}
          {!reviewing?.payload && <button className="btn-primary" disabled={busy} onClick={() => decide('published')}>Виконано</button>}
        </div>
      </Modal>
    </div>
  );
}
