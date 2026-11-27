'use client';
import { EntityManager } from '@/components/admin/EntityManager';
import { programsConfig } from '@/components/admin/configs';
export default function Page() { return <EntityManager config={programsConfig} />; }
