import type { Metadata } from 'next';
import { AdminWorkspace } from '@/components/admin/AdminWorkspace';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Dashboard – Arafat Digital Services',
  description: 'Secure administration dashboard for Arafat Digital Services.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminWorkspace />;
}
