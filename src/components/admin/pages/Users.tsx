'use client';

import { useCallback, useEffect, useState } from 'react';
import { list, remove, update } from '@/lib/admin/db';
import { SECTIONS, hasPerm, roleLabel, useAuth } from '@/lib/admin/auth';
import type { Profile, StaffRole } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { Badge, Empty, Modal, PageTitle, Spinner, Toggle, useUi } from '../ui';

const roleTone: Record<StaffRole, 'violet' | 'blue' | 'green' | 'yellow'> = { owner: 'violet', admin: 'blue', employee: 'green', pending: 'yellow' };
const roleHelp: Record<StaffRole, string> = {
  owner: 'Повний доступ: працівники, права, погодження, усі налаштування.',
  admin: 'Керує контентом у дозволених розділах і заявками батьків.',
  employee: 'Надсилає пропозиції змін; може завантажувати фото, якщо дозволено.',
  pending: 'Немає доступу до панелі.',
};

export function Users() {
  const auth = useAuth();
  const { toast, confirm } = useUi();
  const [rows, setRows] = useState<Profile[] | null>(null);
  const [edit, setEdit] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => list<Profile>('profiles', { order: [['created_at']] }).then(setRows).catch((e) => { toast(e.message, 'error'); setRows([]); }), [toast]);
  useEffect(() => { load(); }, [load]);

  if (!auth.isOwner) return <Empty text="Керувати користувачами може лише власник." />;

  async function save() {
    if (!edit) return;
    const original = rows?.find((r) => r.id === edit.id);
    if (original?.role !== 'owner' && edit.role === 'owner' && !(await confirm(`Зробити ${edit.full_name || edit.email} власником? Ця людина отримає повний доступ, включно з керуванням вами.`, { ok: 'Так, зробити власником' }))) return;
    setBusy(true);
    try {
      await update('profiles', edit.id, { role: edit.role, permissions: edit.permissions, is_active: edit.is_active, full_name: edit.full_name });
      toast('Права збережено'); setEdit(null); load(); if (edit.id === auth.profile?.id) auth.refresh();
    } catch (e: any) { toast(e.message, 'error'); } finally { setBusy(false); }
  }

  async function del(p: Profile) {
    if (!(await confirm(`Видалити доступ для ${p.full_name || p.email}? Обліковий запис залишиться, але без жодних прав.`, { danger: true, ok: 'Видалити' }))) return;
    try { await remove('profiles', p.id); toast('Доступ видалено'); load(); } catch (e: any) { toast(e.message, 'error'); }
  }

  const permsFor = (p: Profile) => SECTIONS.filter((s) => hasPerm(p, s.key)).map((s) => s.label);

  return (
    <div>
      <PageTitle title="Користувачі та права" text="Нові працівники реєструються на сторінці входу кнопкою «Я новий працівник» і з’являються тут зі статусом «Очікує доступу»." />
      {!rows ? <Spinner /> : (
        <ul className="space-y-3">
          {rows.map((p) => (
            <li key={p.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{p.full_name || '(без імені)'}</p>
                  <Badge tone={roleTone[p.role]}>{roleLabel[p.role]}</Badge>
                  {!p.is_active && <Badge tone="red">Вимкнено</Badge>}
                  {p.id === auth.profile?.id && <Badge>Це ви</Badge>}
                </div>
                <p className="mt-1 text-sm text-ink-mute">{p.email} · з {formatDate(p.created_at)}</p>
                {p.role !== 'owner' && p.role !== 'pending' && <p className="mt-1 text-xs text-ink-mute">Доступ: {permsFor(p).join(', ') || 'лише пропозиції'}</p>}
              </div>
              <div className="flex gap-2">
                <button className="btn-primary !py-2" onClick={() => setEdit({ ...p, permissions: { ...(p.permissions || {}) } })}>{p.role === 'pending' ? 'Надати доступ' : 'Змінити'}</button>
                {p.id !== auth.profile?.id && <button className="btn !py-2 text-red hover:bg-red-soft" onClick={() => del(p)}>Видалити</button>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.full_name || edit?.email || ''}>
        {edit && (
          <div className="space-y-5">
            <div><label className="label">Ім’я</label><input className="input" value={edit.full_name} onChange={(e) => setEdit({ ...edit, full_name: e.target.value })} /></div>
            <div>
              <p className="label">Роль</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(['employee', 'admin', 'owner', 'pending'] as StaffRole[]).map((r) => (
                  <button key={r} type="button" onClick={() => setEdit({ ...edit, role: r })} className={`rounded-2xl p-3 text-left ring-1 transition ${edit.role === r ? 'bg-ink text-white ring-ink' : 'ring-line'}`}>
                    <p className="font-semibold">{roleLabel[r]}</p><p className={`text-xs ${edit.role === r ? 'text-white/70' : 'text-ink-mute'}`}>{roleHelp[r]}</p>
                  </button>
                ))}
              </div>
            </div>
            {(edit.role === 'admin' || edit.role === 'employee') && (
              <div>
                <p className="label">Доступ до розділів</p>
                <p className="mb-3 text-xs text-ink-mute">{edit.role === 'employee' ? 'Працівник не змінює сайт напряму. «Фотогалерея» дозволяє завантажувати фото (публікує адміністратор), «Заявки» — переглядати заявки батьків.' : 'Адміністратор змінює сайт напряму в позначених розділах.'}</p>
                <div className="space-y-2.5">
                  {SECTIONS.filter((s) => edit.role === 'admin' || ['gallery', 'registrations'].includes(s.key)).map((s) => (
                    <div key={s.key}><Toggle checked={hasPerm(edit, s.key)} onChange={(v) => setEdit({ ...edit, permissions: { ...edit.permissions, [s.key]: v } })} label={s.label} /></div>
                  ))}
                </div>
              </div>
            )}
            <Toggle checked={edit.is_active} onChange={(v) => setEdit({ ...edit, is_active: v })} label="Обліковий запис активний" disabled={edit.id === auth.profile?.id} />
            <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={() => setEdit(null)}>Скасувати</button><button className="btn-primary" disabled={busy} onClick={save}>Зберегти</button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
