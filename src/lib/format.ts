import { asset } from './config';

const months = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
export const weekdays = ['', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя'];
export const weekdaysShort = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

export function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const k = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Kyiv' }));
  return `${k.getDate()} ${months[k.getMonth()]} ${k.getFullYear()}`;
}

export function formatDayMonth(iso?: string | null): { day: string; month: string } {
  if (!iso) return { day: '', month: '' };
  const k = new Date(new Date(iso).toLocaleString('en-US', { timeZone: 'Europe/Kyiv' }));
  return { day: String(k.getDate()), month: months[k.getMonth()] };
}

export const time = (t?: string | null) => (t ? t.slice(0, 5) : '');
export const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, '')}`;
export const img = (u?: string | null) => (u ? asset(u) : '');
export const paragraphs = (text: string) => text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

export const kindLabel: Record<string, string> = {
  news: 'Новина', event: 'Подія', workshop: 'Майстер-клас', announcement: 'Оголошення',
};

export const categoryLabel: Record<string, string> = {
  classrooms: 'Наші кімнати', activities: 'Заняття', events: 'Події', celebrations: 'Свята', other: 'Інше',
};

/** Latin slug from Ukrainian text (official transliteration, simplified). */
export function slugify(s: string): string {
  const map: Record<string, string> = { а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ie',ж:'zh',з:'z',и:'y',і:'i',ї:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ь:'',ю:'iu',я:'ia',ё:'e',ы:'y',э:'e',ъ:'' };
  return s.toLowerCase().split('').map((c) => map[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || `item-${Date.now().toString(36)}`;
}
