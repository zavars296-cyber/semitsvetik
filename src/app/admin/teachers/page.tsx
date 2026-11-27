'use client';
import { EntityManager } from '@/components/admin/EntityManager';
import { teachersConfig } from '@/components/admin/configs';
export default function Page() { return <EntityManager config={teachersConfig} />; }
