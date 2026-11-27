import type { Metadata } from 'next';
import { BirthdayView } from '@/components/site/views/BirthdayView';
export const metadata: Metadata = { title: 'Дні народження та дитячі свята', description: 'Організація дитячих днів народження та свят у центрі «Семицвіт», Запоріжжя.', alternates: { canonical: 'birthday/' } };
export default function Page() { return <BirthdayView />; }
