import { NextRequest, NextResponse } from 'next/server';
import { requireAdminVerified } from '@/lib/auth';
import { createManagedUser, listUserProfiles, updateUserProfileRole } from '@/lib/data-store';
import type { UserRole } from '@/lib/types';
import { isValidEmail, sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES: UserRole[] = ['admin', 'editor', 'viewer'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const auth = await requireAdminVerified(req);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  try {
    const profiles = await listUserProfiles();
    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Failed to list user roles:', error);
    return NextResponse.json({ error: 'Unable to load user accounts.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminVerified(req);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = sanitizeString(body.id, 100);
    const role = sanitizeString(body.role, 20) as UserRole;

    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Valid user ID is required.' }, { status: 400 });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Role must be one of: admin, editor, viewer.' },
        { status: 400 }
      );
    }

    const updated = await updateUserProfileRole(id, role, auth.session.sub);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update user role.';
    console.error('Failed to update user role:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminVerified(req);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const email = sanitizeString(body.email, 254).toLowerCase();
    const fullName = sanitizeString(body.fullName, 120) || 'Team Member';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = sanitizeString(body.role, 20) as UserRole;

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: 'Password must be between 8 and 128 characters.' },
        { status: 400 }
      );
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Role must be one of: admin, editor, viewer.' },
        { status: 400 }
      );
    }

    const created = await createManagedUser({ email, password, fullName, role });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create user.';
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
