'use client';

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { DEMO, update } from '@/lib/admin/db';
import { roleLabel, useAuth } from '@/lib/admin/auth';
import { PageTitle, useUi } from '../ui';

export function Account() {
  const auth = useAuth();
  const { toast } = useUi();
  const [name, setName] = useState(auth.profile?.full_name || '');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [mustSet] = useState(() => { try { return sessionStorage.getItem('semitsvit-set-password') === '1'; } catch { return false; } });

  async function saveName() {
    try { await update('profiles', auth.profile!.id, { full_name: name.trim() }); toast('Збережено'); auth.refresh(); } catch (e: any) { toast(e.message, 'error'); }
  }
  async function changePw() {
    if (pw.length < 10) { toast('Пароль має містити щонайменше 10 символів', 'error'); return; }
    if (pw !== pw2) { toast('Паролі не збігаються', 'error'); return; }
    if (DEMO) { toast('У демо-режимі паролів немає'); return; }
    setBusy(true);
    const { error } = await getSupabase()!.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) toast(error.message, 'error'); else { toast('Пароль змінено'); setPw(''); setPw2(''); }
  }

  return (
    <div className="max-w-xl">
      <PageTitle title="Мій профіль" text={`${auth.email || ''} · ${roleLabel[auth.profile!.role]}`} />
      {mustSet && <p className="mb-5 rounded-2xl bg-yellow-soft p-4 text-sm font-medium text-yellow-deep">Придумайте пароль (від 10 символів) нижче — з ним ви входитимете в адмін-панель.</p>}
      <div className="card space-y-4 p-6">
        <div><label className="label" htmlFor="nm">Ім’я та прізвище</label><input id="nm" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <button className="btn-primary" onClick={saveName}>Зберегти ім’я</button>
      </div>
      <div className="card mt-5 space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold">Змінити пароль</h2>
        <div><label className="label" htmlFor="p1">Новий пароль</label><input id="p1" type="password" autoComplete="new-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <div><label className="label" htmlFor="p2">Повторіть пароль</label><input id="p2" type="password" autoComplete="new-password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
        <button className="btn-primary" disabled={busy} onClick={changePw}>Змінити пароль</button>
      </div>
    </div>
  );
}
