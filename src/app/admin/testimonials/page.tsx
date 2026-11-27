'use client';
import { EntityManager } from '@/components/admin/EntityManager';
import { testimonialsConfig } from '@/components/admin/configs';
export default function Page() { return <EntityManager config={testimonialsConfig} />; }
