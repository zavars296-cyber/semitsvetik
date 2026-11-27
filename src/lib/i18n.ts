// UI dictionary. To add a language later, add another object with the same keys
// and choose it by route prefix (e.g. /en/...).
export const uk = {
  nav: {
    home: 'Головна', about: 'Про нас', programs: 'Програми', teachers: 'Педагоги', gallery: 'Галерея',
    news: 'Новини', birthday: 'Дні народження', contacts: 'Контакти',
  },
  cta: { register: 'Записатися', call: 'Зателефонувати', more: 'Детальніше', allPrograms: 'Усі програми', allNews: 'Усі новини', directions: 'Прокласти маршрут' },
  form: {
    parentName: "Ваше ім'я", phone: 'Телефон', childAge: 'Вік дитини', program: 'Програма',
    contactMethod: "Як з вами зв'язатися", message: 'Коментар (необов’язково)', consent: 'Я погоджуюсь на обробку персональних даних відповідно до',
    privacy: 'Політики конфіденційності', submit: 'Надіслати заявку', sending: 'Надсилаємо…',
    success: 'Дякуємо! Заявку отримано — ми зателефонуємо найближчим часом.',
  },
};
export type Dict = typeof uk;
export const t = uk;
