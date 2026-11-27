'use client';

import { ListEditor, SettingsPage, TextField } from './settingsForm';

export function Hours() {
  return (
    <SettingsPage title="Графік роботи" text="Якщо графік порожній, на сайті показується примітка нижче.">
      {(s, set) => (
        <>
          <ListEditor label="Дні та години" items={s.hours || []} onChange={(v) => set({ hours: v })}
            fields={[{ key: 'days', label: 'Дні', placeholder: 'Пн–Пт' }, { key: 'hours', label: 'Години', placeholder: '09:00–19:00' }]} empty={{ days: '', hours: '' }} />
          <TextField label="Примітка (коли графік не вказано або для свят)" value={s.hoursNote} onChange={(v) => set({ hoursNote: v })} />
        </>
      )}
    </SettingsPage>
  );
}
