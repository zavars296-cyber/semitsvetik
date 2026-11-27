import type { Metadata } from 'next';
import { PrivacyView } from '@/components/site/views/PrivacyView';
export const metadata: Metadata = { title: 'Політика конфіденційності', description: 'Як дитячий центр «Семицвіт» обробляє персональні дані.', alternates: { canonical: 'privacy/' } };
export default function Page() { return <PrivacyView />; }
