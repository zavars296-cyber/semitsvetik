import type { EntityConfig } from './EntityManager';
import { list } from '@/lib/admin/db';
import { formatDate, kindLabel, time, weekdays, categoryLabel } from '@/lib/format';

const colorOptions = [
  { value: 'red', label: 'Червоний' }, { value: 'orange', label: 'Помаранчевий' }, { value: 'yellow', label: 'Жовтий' },
  { value: 'green', label: 'Зелений' }, { value: 'cyan', label: 'Блакитний' }, { value: 'blue', label: 'Синій' }, { value: 'violet', label: 'Фіолетовий' },
];

export const programsConfig: EntityConfig = {
  table: 'programs', section: 'programs', title: 'Програми та послуги', singular: 'програму',
  description: '«Активна» — набір відкрито й кнопка запису доступна. «Опубліковано» — програму видно на сайті.',
  titleField: 'title', order: [['sort_order'], ['title']],
  defaults: { title: '', slug: '', short: '', description: '', age_group: '', schedule_text: '', price_text: '', color: 'blue', image_url: null, photos: [], is_active: true, is_published: false, sort_order: 100 },
  fields: [
    { name: 'title', label: 'Назва', type: 'text', required: true },
    { name: 'slug', label: 'Адреса на сайті (латиницею)', type: 'slug', slugFrom: 'title', help: 'Створюється автоматично з назви, якщо залишити порожнім.' },
    { name: 'short', label: 'Короткий опис (для картки)', type: 'textarea', rows: 2 },
    { name: 'description', label: 'Повний опис', type: 'textarea', rows: 6, help: 'Порожній рядок — новий абзац.' },
    { name: 'age_group', label: 'Вік', type: 'text', placeholder: 'Напр.: 3–5 років' },
    { name: 'schedule_text', label: 'Розклад (текстом)', type: 'text', placeholder: 'Напр.: Пн, Ср, Пт 10:00' },
    { name: 'price_text', label: 'Вартість (необов’язково)', type: 'text', placeholder: 'Напр.: 250 грн / заняття' },
    { name: 'color', label: 'Колір пелюстки', type: 'select', options: colorOptions, required: true },
    { name: 'sort_order', label: 'Порядок (менше — вище)', type: 'number' },
    { name: 'image_url', label: 'Головне фото', type: 'image', folder: 'programs' },
    { name: 'photos', label: 'Фото', type: 'images', folder: 'programs' },
    { name: 'is_active', label: 'Активна (набір відкрито)', type: 'bool' },
  ],
  thumb: (r) => r.image_url,
  subtitle: (r) => [r.age_group, r.price_text].filter(Boolean).join(' · ') || r.short,
  badges: (r) => (!r.is_active ? 'Неактивна' : null),
  previewUrl: (r) => `/programs/?preview=1#${r.slug}`,
};

export const teachersConfig: EntityConfig = {
  table: 'teachers', section: 'teachers', title: 'Педагоги', singular: 'педагога',
  description: 'Профілі команди. Публікуйте фото лише за згодою людини.',
  titleField: 'full_name', order: [['sort_order'], ['full_name']],
  defaults: { full_name: '', position: '', qualifications: '', bio: '', photo_url: null, is_published: false, sort_order: 100 },
  fields: [
    { name: 'full_name', label: 'Ім’я та прізвище', type: 'text', required: true },
    { name: 'position', label: 'Посада', type: 'text', placeholder: 'Напр.: логопед' },
    { name: 'qualifications', label: 'Освіта та кваліфікація', type: 'textarea', rows: 2 },
    { name: 'bio', label: 'Про педагога', type: 'textarea', rows: 4 },
    { name: 'sort_order', label: 'Порядок', type: 'number' },
    { name: 'photo_url', label: 'Фото', type: 'image', folder: 'teachers' },
  ],
  thumb: (r) => r.photo_url, subtitle: (r) => r.position,
  previewUrl: () => '/teachers/?preview=1',
};

export const scheduleConfig: EntityConfig = {
  table: 'schedule_items', section: 'schedule', title: 'Розклад', singular: 'заняття',
  description: 'Заняття за днями тижня. Відображаються на сторінці «Програми» біля відповідної програми.',
  titleField: 'group_name', order: [['weekday'], ['start_time']],
  defaults: { program_id: '', teacher_id: '', weekday: '1', start_time: '10:00', end_time: '', group_name: '', note: '', is_published: false },
  fields: [
    { name: 'program_id', label: 'Програма', type: 'select', required: true },
    { name: 'weekday', label: 'День тижня', type: 'select', required: true, options: [1, 2, 3, 4, 5, 6, 7].map((d) => ({ value: String(d), label: weekdays[d] })) },
    { name: 'start_time', label: 'Початок', type: 'time', required: true },
    { name: 'end_time', label: 'Кінець', type: 'time' },
    { name: 'group_name', label: 'Група', type: 'text', placeholder: 'Напр.: 3–4 роки' },
    { name: 'teacher_id', label: 'Педагог', type: 'select' },
    { name: 'note', label: 'Примітка', type: 'text', full: true },
  ],
  subtitle: (r) => `${weekdays[r.weekday] || ''}, ${time(r.start_time)}${r.end_time ? '–' + time(r.end_time) : ''}`,
  extraLookup: async () => {
    const [programs, teachers] = await Promise.all([list('programs', { order: [['sort_order']] }), list('teachers', { order: [['full_name']] })]);
    return {
      program_id: programs.map((p: any) => ({ value: p.id, label: p.title })),
      teacher_id: teachers.map((t: any) => ({ value: t.id, label: t.full_name })),
    };
  },
  previewUrl: () => '/programs/?preview=1',
};

export const postsConfig: EntityConfig = {
  table: 'posts', section: 'news', title: 'Новини та події', singular: 'публікацію',
  description: 'Новини, події, майстер-класи та оголошення. Для подій вкажіть дату — вони з’являться в «Найближчих подіях».',
  titleField: 'title', order: [['published_at', false], ['created_at', false]],
  defaults: { title: '', slug: '', kind: 'news', excerpt: '', body: '', cover_url: null, event_date: null, is_published: false },
  fields: [
    { name: 'title', label: 'Заголовок', type: 'text', required: true, full: true },
    { name: 'kind', label: 'Тип', type: 'select', required: true, options: Object.entries(kindLabel).map(([value, label]) => ({ value, label })) },
    { name: 'event_date', label: 'Дата події (для подій)', type: 'datetime' },
    { name: 'slug', label: 'Адреса (латиницею)', type: 'slug', slugFrom: 'title', help: 'Створюється автоматично.' },
    { name: 'excerpt', label: 'Короткий анонс', type: 'textarea', rows: 2 },
    { name: 'body', label: 'Текст', type: 'textarea', rows: 8 },
    { name: 'cover_url', label: 'Обкладинка', type: 'image', folder: 'news' },
  ],
  thumb: (r) => r.cover_url,
  subtitle: (r) => `${kindLabel[r.kind] || ''}${r.event_date ? ' · ' + formatDate(r.event_date) : ''}`,
  previewUrl: (r) => `/news/post/?slug=${r.slug}&preview=1`,
};

export const albumsConfig: EntityConfig = {
  table: 'gallery_albums', section: 'gallery', title: 'Альбоми', singular: 'альбом',
  titleField: 'title', order: [['sort_order'], ['created_at', false]],
  defaults: { title: '', slug: '', category: 'activities', description: '', cover_url: null, is_published: false, sort_order: 100 },
  fields: [
    { name: 'title', label: 'Назва альбому', type: 'text', required: true },
    { name: 'category', label: 'Категорія', type: 'select', required: true, options: Object.entries(categoryLabel).map(([value, label]) => ({ value, label })) },
    { name: 'slug', label: 'Адреса (латиницею)', type: 'slug', slugFrom: 'title' },
    { name: 'sort_order', label: 'Порядок', type: 'number' },
    { name: 'description', label: 'Опис', type: 'textarea', rows: 2 },
  ],
  subtitle: (r) => categoryLabel[r.category],
  previewUrl: () => '/gallery/?preview=1',
};

export const testimonialsConfig: EntityConfig = {
  table: 'testimonials', section: 'testimonials', title: 'Відгуки', singular: 'відгук',
  description: 'Публікуйте лише справжні відгуки батьків (наприклад, з Google Maps чи Instagram) і позначайте їх як перевірені.',
  titleField: 'author', order: [['created_at', false]],
  defaults: { author: '', text: '', source: '', is_verified: false, is_published: false },
  fields: [
    { name: 'author', label: 'Автор (ім’я)', type: 'text', required: true },
    { name: 'source', label: 'Джерело', type: 'text', placeholder: 'Напр.: Google Maps' },
    { name: 'text', label: 'Текст відгуку', type: 'textarea', required: true },
    { name: 'is_verified', label: 'Перевірено: відгук справжній', type: 'bool' },
  ],
  subtitle: (r) => r.text,
  badges: (r) => (r.is_verified ? 'Перевірено' : 'Не перевірено'),
};

export const configsByTable: Record<string, EntityConfig> = {
  programs: programsConfig, teachers: teachersConfig, schedule_items: scheduleConfig, posts: postsConfig,
  gallery_albums: albumsConfig, testimonials: testimonialsConfig,
};
