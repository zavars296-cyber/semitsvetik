'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@/components/site/Icon';
import { uploadImage } from '@/lib/admin/db';

// ---------- toasts + confirm ----------
type Toast = { id: number; text: string; tone: 'ok' | 'error' };
interface UiCtx { toast: (text: string, tone?: 'ok' | 'error') => void; confirm: (text: string, opts?: { danger?: boolean; ok?: string }) => Promise<boolean> }
const Ui = createContext<UiCtx>({ toast: () => {}, confirm: async () => false });

export function UiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dlg, setDlg] = useState<{ text: string; danger?: boolean; ok?: string; resolve: (v: boolean) => void } | null>(null);
  const toast = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 6000 : 3000);
  }, []);
  const confirm = useCallback((text: string, opts: { danger?: boolean; ok?: string } = {}) =>
    new Promise<boolean>((resolve) => setDlg({ text, ...opts, resolve })), []);
  const close = (v: boolean) => { dlg?.resolve(v); setDlg(null); };
  return (
    <Ui.Provider value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`pointer-events-auto max-w-md rounded-2xl px-4 py-3 text-sm font-medium shadow-lift ${t.tone === 'ok' ? 'bg-ink text-white' : 'bg-red text-white'}`} role="status">
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <Modal open={!!dlg} onClose={() => close(false)} title="Підтвердіть дію" small>
        <p className="text-ink-soft">{dlg?.text}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => close(false)}>Скасувати</button>
          <button className={dlg?.danger ? 'btn bg-red text-white hover:bg-red-deep' : 'btn-primary'} onClick={() => close(true)} autoFocus>{dlg?.ok || 'Так'}</button>
        </div>
      </Modal>
    </Ui.Provider>
  );
}
export const useUi = () => useContext(Ui);

// ---------- modal ----------
export function Modal({ open, onClose, title, children, small = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; small?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div role="dialog" aria-modal="true" aria-label={title}
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: 0.2 }}
            className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lift sm:rounded-3xl sm:p-7 ${small ? 'sm:max-w-md' : 'sm:max-w-2xl'}`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 className="font-display text-xl font-semibold">{title}</h2>
              <button onClick={onClose} aria-label="Закрити" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-cool"><Icon name="close" className="h-4 w-4" /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- small bits ----------
export function Badge({ tone = 'gray', children }: { tone?: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'violet'; children: ReactNode }) {
  const map = { green: 'bg-green-soft text-green-deep', yellow: 'bg-yellow-soft text-yellow-deep', red: 'bg-red-soft text-red', blue: 'bg-blue-soft text-blue', gray: 'bg-paper-cool text-ink-mute', violet: 'bg-violet-soft text-violet' };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[tone]}`}>{children}</span>;
}

export function PageTitle({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
        {text && <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ label = 'Завантаження…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-sm text-ink-mute" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-violet" /> {label}
    </div>
  );
}

export function Empty({ text, action }: { text: string; action?: ReactNode }) {
  return <div className="card flex flex-col items-center gap-4 p-10 text-center text-ink-soft"><p>{text}</p>{action}</div>;
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-3 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-green' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
      {label && <span className="text-sm text-ink">{label}</span>}
    </label>
  );
}

export function ImageInput({ value, onChange, folder, label = 'Фото' }: { value: string | null; onChange: (url: string | null) => void; folder: string; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useUi();
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-4">
        <div className="grid h-24 w-32 shrink-0 place-items-center overflow-hidden rounded-2xl bg-paper-cool ring-1 ring-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <Icon name="image" className="h-7 w-7 text-ink-mute" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost !py-2" disabled={busy} onClick={() => ref.current?.click()}>{busy ? 'Завантаження…' : value ? 'Замінити' : 'Завантажити'}</button>
          {value && <button type="button" className="btn !py-2 text-red hover:bg-red-soft" onClick={() => onChange(null)}>Прибрати</button>}
        </div>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = '';
            if (!f) return;
            setBusy(true);
            try { onChange((await uploadImage(f, folder)).url); } catch (err: any) { toast(err.message, 'error'); } finally { setBusy(false); }
          }} />
      </div>
    </div>
  );
}

export function ImagesInput({ value, onChange, folder }: { value: string[]; onChange: (v: string[]) => void; folder: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useUi();
  return (
    <div>
      <span className="label">Додаткові фото</span>
      <div className="flex flex-wrap gap-2">
        {value.map((u) => (
          <div key={u} className="relative h-20 w-20 overflow-hidden rounded-xl ring-1 ring-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-full w-full object-cover" />
            <button type="button" aria-label="Прибрати фото" onClick={() => onChange(value.filter((x) => x !== u))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-red"><Icon name="close" className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed border-line text-ink-mute hover:border-violet hover:text-violet">
          {busy ? '…' : '+'}
        </button>
      </div>
      <input ref={ref} type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic" className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files || []); e.target.value = '';
          setBusy(true);
          const added: string[] = [];
          for (const f of files) { try { added.push((await uploadImage(f, folder)).url); } catch (err: any) { toast(`${f.name}: ${err.message}`, 'error'); } }
          onChange([...value, ...added]); setBusy(false);
        }} />
    </div>
  );
}
