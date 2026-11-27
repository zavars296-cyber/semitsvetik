'use client';
import { EntityManager } from '@/components/admin/EntityManager';
import { postsConfig } from '@/components/admin/configs';
export default function Page() { return <EntityManager config={postsConfig} />; }
