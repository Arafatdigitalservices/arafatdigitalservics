import { NextRequest, NextResponse } from 'next/server';
import { requireAdminVerified } from '@/lib/auth';
import { getAdminOverviewData } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminVerified(req);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  try {
    const data = await getAdminOverviewData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to load admin overview:', error);
    return NextResponse.json({ error: 'Unable to load dashboard data.' }, { status: 500 });
  }
}
