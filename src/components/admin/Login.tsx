'use client';

import { useState, type FormEvent } from 'react';
import { getSupabase } from '@/lib/supabase';
import { DEMO } from '@/lib/admin/db';
import { useAuth } from '@/lib/admin/auth';
import { LogoMark } from '@/components/site/Logo';

export function Login() {
  const auth = useAuth();
  const [mode, setMode] = useState<'in' | 'up' | 'reset'>('in');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') || '').trim();
    const password = String(f.get('password') || '');
    const name = String(f.get('name') || '').trim();
    const sb = getSupabase()!;
    setBusy(true); setMsg(null);
    try {
      if (mode === 'in') {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message.includes('Invalid login') ? 'Невірний email або пароль' : error.message.includes('not confirmed') ? 'Підтвердіть email — перевірте пошту' : error.message);
      } else if (mode === 'up') {
        if (password.length < 10) throw new Error('Пароль має містити щонайменше 10 символів');
        const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: window.location.href } });
        if (error) throw new Error(error.message);
        setMsg({ ok: true, t: data.session ? 'Обліковий запис створено. Власник має надати вам доступ.' : 'Ми надіслали лист для підтвердження email. Після підтвердження увійдіть, а власник надасть вам доступ.' });
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/admin/account/' });
        if (error) throw new Error(error.message);
        setMsg({ ok: true, t: 'Якщо такий email зареєстровано, ми надіслали посилання для зміни пароля.' });
      }
    } catch (err: any) { setMsg({ t: err.message }); } finally { setBusy(false); }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(60%_50%_at_80%_0%,rgba(242,202,70,.18),transparent),radial-gradient(50%_50%_at_0%_100%,rgba(68,152,201,.14),transparent)] bg-paper-cool p-4">
      <div className="card w-full max-w-md p-7 sm:p-9">
        <LogoMark className="h-12 w-auto" />
        <h1 className="mt-5 font-display text-2xl font-semibold">Адмін-панель «Семицвіт»</h1>
        {DEMO ? (
          <>
            <p className="mt-2 text-sm text-ink-soft">Демо-режим (база ще не підключена). Оберіть роль, щоб подивитися, як працює панель:</p>
            <div className="mt-6 grid gap-2">
              {[['demo-owner', 'Власник', 'повний доступ, права працівників, погодження'], ['demo-admin', 'Адміністратор', 'контент, розклад, заявки'], ['demo-employee', 'Працівник', 'пропозиції змін, завантаження фото']].map(([id, l, d]) => (
                <button key={id} className="card flex flex-col items-start p-4 text-left transition hover:ring-violet" onClick={() => auth.demoSwitch(id)}>
                  <span className="font-semibold">{l}</span><span className="text-sm text-ink-mute">{d}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink-soft">{mode === 'in' ? 'Вхід для працівників центру' : mode === 'up' ? 'Реєстрація працівника. Доступ надає власник.' : 'Відновлення пароля'}</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === 'up' && <div><label className="label" htmlFor="name">Ім’я та прізвище</label><input id="name" name="name" required className="input" autoComplete="name" /></div>}
              <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" autoComplete="email" /></div>
              {mode !== 'reset' && <div><label className="label" htmlFor="password">Пароль</label><input id="password" name="password" type="password" required minLength={mode === 'up' ? 10 : 1} className="input" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} /></div>}
              {msg && <p className={`rounded-2xl p-3 text-sm ${msg.ok ? 'bg-green-soft text-green-deep' : 'bg-red-soft text-red-deep'}`} role="alert">{msg.t}</p>}
              <button className="btn-primary w-full !py-3.5" disabled={busy}>{busy ? 'Зачекайте…' : mode === 'in' ? 'Увійти' : mode === 'up' ? 'Зареєструватися' : 'Надіслати посилання'}</button>
            </form>
            <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm">
              {mode !== 'in' && <button className="text-blue" onClick={() => { setMode('in'); setMsg(null); }}>Увійти</button>}
              {mode !== 'up' && <button className="text-blue" onClick={() => { setMode('up'); setMsg(null); }}>Я новий працівник</button>}
              {mode !== 'reset' && <button className="text-ink-mute" onClick={() => { setMode('reset'); setMsg(null); }}>Забули пароль?</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
