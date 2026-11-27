import type { Metadata } from 'next';
import { NewsView } from '@/components/site/views/NewsView';
export const metadata: Metadata = { title: 'Новини та події', description: 'Новини, події, майстер-класи та оголошення дитячого центру «Семицвіт».', alternates: { canonical: 'news/' } };
export default function Page() { return <NewsView />; }
