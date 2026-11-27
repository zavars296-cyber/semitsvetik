import type { Metadata } from 'next';
import { TeachersView } from '@/components/site/views/TeachersView';
export const metadata: Metadata = { title: 'Наші педагоги', description: 'Команда педагогів дитячого центру «Семицвіт» у Запоріжжі.', alternates: { canonical: 'teachers/' } };
export default function Page() { return <TeachersView />; }
