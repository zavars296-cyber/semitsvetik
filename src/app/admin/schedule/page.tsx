'use client';
import { EntityManager } from '@/components/admin/EntityManager';
import { scheduleConfig } from '@/components/admin/configs';
export default function Page() { return <EntityManager config={scheduleConfig} />; }
