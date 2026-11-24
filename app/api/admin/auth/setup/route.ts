import { NextRequest, NextResponse } from 'next/server';
import { setupFirstRunAdmin } from '@/lib/auth';
import { isValidEmail, sanitizeString } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const email = sanitizeString(body.email, 254).toLowerCase();
    const fullName = sanitizeString(body.fullName, 120) || 'Agency Admin';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid admin email address.' }, { status: 400 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: 'Admin password must be between 8 and 128 characters.' },
        { status: 400 }
      );
    }

    const result = await setupFirstRunAdmin({ email, fullName, password });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || 'Setup unavailable.' },
        { status: result.status || 409 }
      );
    }

    return NextResponse.json({
      token: result.token,
      profile: result.profile,
    });
  } catch (error) {
    console.error('First-run admin setup failed:', error);
    return NextResponse.json({ error: 'Unable to initialize admin account.' }, { status: 500 });
  }
}
