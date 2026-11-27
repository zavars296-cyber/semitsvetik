import type { Metadata } from 'next';
import { GalleryView } from '@/components/site/views/GalleryView';
export const metadata: Metadata = { title: 'Галерея', description: 'Фото з життя дитячого центру «Семицвіт»: заняття, свята, події.', alternates: { canonical: 'gallery/' } };
export default function Page() { return <GalleryView />; }
