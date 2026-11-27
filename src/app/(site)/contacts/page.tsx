import type { Metadata } from 'next';
import { ContactsView } from '@/components/site/views/ContactsView';
export const metadata: Metadata = { title: 'Контакти', description: 'Адреса, телефон, графік роботи та як дістатися до дитячого центру «Семицвіт» у Запоріжжі.', alternates: { canonical: 'contacts/' } };
export default function Page() { return <ContactsView />; }
