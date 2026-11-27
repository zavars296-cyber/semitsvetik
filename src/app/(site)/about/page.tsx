import type { Metadata } from 'next';
import { AboutView } from '@/components/site/views/AboutView';
export const metadata: Metadata = { title: 'Про нас', description: 'Дитячий центр «Семицвіт» у Запоріжжі: наш підхід, цінності та команда.', alternates: { canonical: 'about/' } };
export default function Page() { return <AboutView />; }
