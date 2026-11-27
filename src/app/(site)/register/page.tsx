import type { Metadata } from 'next';
import { RegisterView } from '@/components/site/views/RegisterView';
export const metadata: Metadata = { title: 'Запис на заняття', description: 'Онлайн-запис на заняття в дитячому центрі «Семицвіт».', alternates: { canonical: 'register/' } };
export default function Page() { return <RegisterView />; }
