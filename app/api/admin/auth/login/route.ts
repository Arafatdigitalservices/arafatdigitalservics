import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, checkLoginRateLimit } from '@/lib/auth';
import { sanitizeString } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!checkLoginRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts. Please wait a few minutes and try again.' },
        { status: 429 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const email = sanitizeString(body.email, 254).toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';

    if (!password) {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    }

    const result = await authenticateAdmin({ email, password });
    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Invalid credentials.' }, { status: 401 });
    }

    return NextResponse.json({
      token: result.token,
      profile: result.profile,
    });
  } catch (error) {
    console.error('Admin login failed:', error);
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 500 });
  }
}
