import type { Metadata } from 'next';
import { ProgramsView } from '@/components/site/views/ProgramsView';
export const metadata: Metadata = { title: 'Програми та заняття', description: 'Міні-садок, розвиваючі заняття, підготовка до школи, логопед у дитячому центрі «Семицвіт», Запоріжжя.', alternates: { canonical: 'programs/' } };
export default function Page() { return <ProgramsView />; }
