import type { Metadata } from 'next';
import { PostView } from '@/components/site/views/PostView';
export const metadata: Metadata = { title: 'Новина', description: 'Новини дитячого центру «Семицвіт».', alternates: { canonical: 'news/post/' } };
export default function Page() { return <PostView />; }
