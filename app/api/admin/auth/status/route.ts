import { NextRequest, NextResponse } from 'next/server';
import { getAuthStatus, requireAdminVerified } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const status = await getAuthStatus();
    const auth = await requireAdminVerified(req);
    return NextResponse.json({
      ...status,
      authenticated: Boolean(auth.session),
      profile: auth.session
        ? { email: auth.session.email, fullName: auth.session.fullName }
        : null,
    });
  } catch (error) {
    console.error('Auth status check failed:', error);
    return NextResponse.json({ error: 'Unable to verify authentication status.' }, { status: 500 });
  }
}
