'use client';

import { useAuth } from '@/lib/admin/auth';
import { ListEditor, SettingsPage, TextField } from './settingsForm';

export function SiteSettings() {
  const { isOwner } = useAuth();
  return (
    <SettingsPage title="Тексти й налаштування сайту" text="Головні тексти сторінок, SEO та оголошення вгорі сайту.">
      {(s, set) => (
        <>
          <h2 className="font-display text-lg font-semibold">Оголошення</h2>
          <TextField label="Смуга оголошення вгорі сайту (залиште порожнім, щоб сховати)" value={s.announcement} onChange={(v) => set({ announcement: v })} placeholder="Напр.: Набір у групу підготовки до школи відкрито!" />
          <h2 className="pt-4 font-display text-lg font-semibold">Головна сторінка</h2>
          <TextField label="Підзаголовок (бейдж)" value={s.tagline} onChange={(v) => set({ tagline: v })} />
          <TextField label="Головний заголовок" value={s.heroTitle} onChange={(v) => set({ heroTitle: v })} help="Останнє слово виділяється кольоровим градієнтом." />
          <TextField label="Текст під заголовком" rows={3} value={s.heroText} onChange={(v) => set({ heroText: v })} />
          <ListEditor label="Чому обирають нас" items={s.whyUs || []} onChange={(v) => set({ whyUs: v })} fields={[{ key: 'title', label: 'Заголовок' }, { key: 'text', label: 'Текст', rows: 2 }]} empty={{ title: '', text: '' }} />
          <TextField label="Текст про команду" rows={3} value={s.teamText} onChange={(v) => set({ teamText: v })} />
          <h2 className="pt-4 font-display text-lg font-semibold">Про нас</h2>
          <TextField label="Вступ" rows={3} value={s.aboutIntro} onChange={(v) => set({ aboutIntro: v })} />
          <TextField label="Історія центру" rows={5} value={s.aboutHistory} onChange={(v) => set({ aboutHistory: v })} help="Розділ з’явиться на сайті, щойно ви його заповните." />
          <TextField label="Філософія" rows={4} value={s.aboutPhilosophy} onChange={(v) => set({ aboutPhilosophy: v })} />
          <ListEditor label="Цінності" items={s.values || []} onChange={(v) => set({ values: v })} fields={[{ key: 'title', label: 'Заголовок' }, { key: 'text', label: 'Текст', rows: 2 }]} empty={{ title: '', text: '' }} />
          <h2 className="pt-4 font-display text-lg font-semibold">Дні народження</h2>
          <TextField label="Вступ" rows={3} value={s.birthdayIntro} onChange={(v) => set({ birthdayIntro: v })} />
          <ListEditor label="Що входить у свято" items={s.birthdayItems || []} onChange={(v) => set({ birthdayItems: v })} fields={[{ key: 'title', label: 'Заголовок' }, { key: 'text', label: 'Текст', rows: 2 }]} empty={{ title: '', text: '' }} />
          <h2 className="pt-4 font-display text-lg font-semibold">Пошукові системи (SEO)</h2>
          <TextField label="Назва центру" value={s.fullName} onChange={(v) => set({ fullName: v })} />
          <TextField label="Заголовок сторінки в Google" value={s.seoTitle} onChange={(v) => set({ seoTitle: v })} />
          <TextField label="Опис у Google" rows={2} value={s.seoDescription} onChange={(v) => set({ seoDescription: v })} help="SEO-тексти оновлюються в пошуку після наступної публікації сайту." />
          {!isOwner && <p className="text-xs text-ink-mute">Безпекові налаштування та права доступні лише власнику.</p>}
        </>
      )}
    </SettingsPage>
  );
}
