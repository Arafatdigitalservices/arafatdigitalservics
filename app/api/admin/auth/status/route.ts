import { NextRequest, NextResponse } from 'next/server';
import { getAuthStatus, requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const status = await getAuthStatus();
    const session = requireAdmin(req);
    return NextResponse.json({
      ...status,
      authenticated: Boolean(session),
      profile: session ? { email: session.email, fullName: session.fullName } : null,
    });
  } catch (error) {
    console.error('Auth status check failed:', error);
    return NextResponse.json({ error: 'Unable to verify authentication status.' }, { status: 500 });
  }
}
