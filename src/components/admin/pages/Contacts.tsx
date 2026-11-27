'use client';

import { SettingsPage, TextField } from './settingsForm';

export function Contacts() {
  return (
    <SettingsPage title="Контакти й соцмережі" text="Ці дані показуються в шапці, підвалі, на сторінці «Контакти» та у формах.">
      {(s, set) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Адреса" value={s.address} onChange={(v) => set({ address: v })} />
            <TextField label="Місто" value={s.city} onChange={(v) => set({ city: v })} />
          </div>
          <TextField label="Телефони (кожен з нового рядка)" rows={2} value={(s.phones || []).join('\n')} onChange={(v) => set({ phones: v.split('\n').map((x: string) => x.trim()).filter(Boolean) })} help="Перший номер — головний (кнопка «Зателефонувати»)." />
          <TextField label="Email" value={s.email} onChange={(v) => set({ email: v })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Instagram (посилання)" value={s.instagram} onChange={(v) => set({ instagram: v })} />
            <TextField label="Facebook (посилання)" value={s.facebook} onChange={(v) => set({ facebook: v })} />
            <TextField label="Telegram (посилання)" value={s.telegram} onChange={(v) => set({ telegram: v })} placeholder="https://t.me/…" />
            <TextField label="Viber (посилання)" value={s.viber} onChange={(v) => set({ viber: v })} placeholder="viber://chat?number=%2B380…" />
            <TextField label="WhatsApp (посилання)" value={s.whatsapp} onChange={(v) => set({ whatsapp: v })} placeholder="https://wa.me/380…" />
          </div>
          <TextField label="Посилання на Google Maps" value={s.mapsUrl} onChange={(v) => set({ mapsUrl: v })} />
          <TextField label="Пошуковий запит для карти" value={s.mapsQuery} onChange={(v) => set({ mapsQuery: v })} help="Що показувати на вбудованій карті." />
          <TextField label="Як дістатися" rows={3} value={s.directions} onChange={(v) => set({ directions: v })} placeholder="Напр.: зупинка …, вхід з двору…" />
        </>
      )}
    </SettingsPage>
  );
}
