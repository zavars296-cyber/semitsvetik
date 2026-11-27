'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useContent } from '@/lib/content';
import { getSupabase } from '@/lib/supabase';
import { telHref } from '@/lib/format';
import { t } from '@/lib/i18n';
import { Icon } from './Icon';

type Kind = 'registration' | 'question' | 'birthday';
const methods = [
  { v: 'phone', l: 'Дзвінок' }, { v: 'viber', l: 'Viber' }, { v: 'telegram', l: 'Telegram' },
  { v: 'whatsapp', l: 'WhatsApp' }, { v: 'instagram', l: 'Instagram' },
];

export function validatePhone(v: string) {
  const digits = v.replace(/\D/g, '');
  return /^\+?[0-9 ()-]{9,20}$/.test(v.trim()) && digits.length >= 9 && digits.length <= 15;
}

export function RegistrationForm({ kind = 'registration', defaultProgram = '', compact = false }: { kind?: Kind; defaultProgram?: string; compact?: boolean }) {
  const { settings, programs } = useContent().content;
  const started = useRef(Date.now());
  const [program, setProgram] = useState(defaultProgram);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const phone = settings.phones[0];

  useEffect(() => {
    if (defaultProgram) return;
    const p = new URLSearchParams(window.location.search).get('program');
    if (p) setProgram(programs.find((x) => x.slug === p)?.title || '');
  }, [defaultProgram, programs]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data = {
      kind,
      parent_name: String(f.get('parent_name') || '').trim(),
      phone: String(f.get('phone') || '').trim(),
      child_age: String(f.get('child_age') || '').trim(),
      program: String(f.get('program') || '').trim(),
      contact_method: String(f.get('contact_method') || 'phone'),
      message: String(f.get('message') || '').trim(),
      consent: f.get('consent') === 'on',
    };
    const errs: Record<string, string> = {};
    if (data.parent_name.length < 2) errs.parent_name = "Вкажіть ваше ім'я";
    if (!validatePhone(data.phone)) errs.phone = 'Вкажіть номер у форматі +380 XX XXX XX XX';
    if (kind !== 'question' && !data.child_age) errs.child_age = 'Вкажіть вік дитини';
    if (data.message.length > 1000) errs.message = 'Максимум 1000 символів';
    if (!data.consent) errs.consent = 'Потрібна ваша згода';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    // Spam traps: hidden field + too-fast submission
    if (f.get('website') || Date.now() - started.current < 2500) { setStatus('done'); return; }

    const sb = getSupabase();
    if (!sb) { setStatus('error'); setError('Онлайн-запис тимчасово недоступний. Будь ласка, зателефонуйте нам.'); return; }
    setStatus('sending'); setError('');
    const { error: err } = await sb.from('registrations').insert(data);
    if (err) {
      setStatus('error');
      setError(err.message.includes('too_many_requests')
        ? 'Ви вже надіслали кілька заявок сьогодні — ми обов’язково зв’яжемося з вами.'
        : 'Не вдалося надіслати заявку. Спробуйте ще раз або зателефонуйте нам.');
      return;
    }
    setStatus('done');
  }

  if (status === 'done') {
    return (
      <div className="card flex flex-col items-center p-8 text-center sm:p-10" role="status">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-green-soft text-green"><Icon name="check" className="h-8 w-8" strokeWidth={2.4} /></div>
        <h3 className="h-display mt-5 text-2xl">Заявку надіслано!</h3>
        <p className="mt-3 max-w-sm text-ink-soft">{t.form.success}</p>
      </div>
    );
  }

  const err = (k: string) => fieldErrors[k] && <p className="mt-1.5 text-sm text-red">{fieldErrors[k]}</p>;

  return (
    <form onSubmit={onSubmit} noValidate className={`card p-6 sm:p-8 ${compact ? '' : ''}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="parent_name">{t.form.parentName} *</label>
          <input id="parent_name" name="parent_name" autoComplete="name" maxLength={80} className="input" aria-invalid={!!fieldErrors.parent_name} />
          {err('parent_name')}
        </div>
        <div>
          <label className="label" htmlFor="phone">{t.form.phone} *</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+380" maxLength={20} className="input" aria-invalid={!!fieldErrors.phone} />
          {err('phone')}
        </div>
        {kind !== 'question' && (
          <div>
            <label className="label" htmlFor="child_age">{t.form.childAge} *</label>
            <input id="child_age" name="child_age" maxLength={40} placeholder="Напр.: 3 роки" className="input" aria-invalid={!!fieldErrors.child_age} />
            {err('child_age')}
          </div>
        )}
        {kind === 'registration' && (
          <div>
            <label className="label" htmlFor="program">{t.form.program}</label>
            <select id="program" name="program" className="input" value={program} onChange={(e) => setProgram(e.target.value)}>
              <option value="">Ще не визначились</option>
              {programs.filter((p) => p.is_active).map((p) => <option key={p.id} value={p.title}>{p.title}</option>)}
            </select>
          </div>
        )}
        {kind === 'birthday' && <input type="hidden" name="program" value="День народження" />}
        <div className="sm:col-span-2">
          <span className="label">{t.form.contactMethod}</span>
          <div className="flex flex-wrap gap-2">
            {methods.map((m, i) => (
              <label key={m.v} className="cursor-pointer">
                <input type="radio" name="contact_method" value={m.v} defaultChecked={i === 0} className="peer sr-only" />
                <span className="inline-block rounded-full px-4 py-2 text-sm font-medium text-ink-soft ring-1 ring-line transition peer-checked:bg-ink peer-checked:text-white peer-checked:ring-ink peer-focus-visible:ring-4 peer-focus-visible:ring-blue/20">{m.l}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="message">{kind === 'question' ? 'Ваше питання' : t.form.message}</label>
          <textarea id="message" name="message" rows={3} maxLength={1000} className="input resize-y" />
          {err('message')}
        </div>
        {/* honeypot */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
          <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>
        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
            <input type="checkbox" name="consent" className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-violet" />
            <span>{t.form.consent} <Link href="/privacy/" className="font-medium text-blue underline underline-offset-2">{t.form.privacy}</Link>. Дані використовуються лише для зв’язку з вами.</span>
          </label>
          {err('consent')}
        </div>
      </div>
      {status === 'error' && <p className="mt-5 rounded-2xl bg-red-soft p-4 text-sm text-red-deep" role="alert">{error}</p>}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={status === 'sending'} className="btn-accent !px-7 !py-3.5 text-base">
          {status === 'sending' ? t.form.sending : t.form.submit}
        </button>
        {phone && <a href={telHref(phone)} className="btn-ghost !py-3.5"><Icon name="phone" className="h-4 w-4" /> або зателефонуйте: {phone}</a>}
      </div>
    </form>
  );
}
