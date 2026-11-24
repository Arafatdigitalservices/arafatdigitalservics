import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { claimAdminAuthRecord, getAdminAuthRecord } from './data-store';
import {
  isSupabaseConfigured,
  supabaseAdminCreateUser,
  supabaseAdminListUsers,
  supabaseCheckSchemaStatus,
  supabaseSelect,
  supabaseUpsert,
  supabaseVerifyUserPassword,
} from './supabase-rest';
import type { Profile } from './types';

declare global {
  var __arafatSessionSecret: string | undefined;
  var __arafatLoginAttempts: Map<string, { count: number; resetAt: number }> | undefined;
}

function getSessionSecret(): string {
  const envSecret = process.env.SESSION_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) return envSecret;
  if (!globalThis.__arafatSessionSecret) {
    globalThis.__arafatSessionSecret = randomBytes(32).toString('hex');
  }
  return globalThis.__arafatSessionSecret;
}

export interface SessionPayload {
  sub?: string;
  email: string;
  fullName: string;
  role: 'admin';
  exp: number;
}

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return { hash: derived, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyConstantTimeString(input: string, expected: string): boolean {
  const a = Buffer.from(input, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function signSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 12, // 12 hours
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', getSessionSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | null | undefined): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;

  const expectedSig = createHmac('sha256', getSessionSecret()).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    if (parsed.role !== 'admin' || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function extractBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length).trim();
}

export function requireAdmin(req: NextRequest): SessionPayload | null {
  const token = extractBearerToken(req);
  return verifySessionToken(token);
}

/**
 * Strict server-side RBAC check:
 * 1. Verifies the signed Bearer session token.
 * 2. When Supabase is active and the session carries a Supabase user UUID (`sub`),
 *    re-verifies in real time against `public.profiles` that `role === 'admin'`.
 *    Any user whose role was downgraded or deleted is blocked immediately.
 */
export async function requireAdminVerified(
  req: NextRequest
): Promise<{ session: SessionPayload | null; status: 401 | 403 | 200; error?: string }> {
  const session = requireAdmin(req);
  if (!session) {
    return { session: null, status: 401, error: 'Unauthorized' };
  }

  if (isSupabaseConfigured() && session.sub) {
    try {
      const rows = await supabaseSelect<Profile>(
        'profiles',
        `id=eq.${encodeURIComponent(session.sub)}&select=id,email,full_name,role&limit=1`
      );
      const profile = rows[0];
      if (!profile || profile.role !== 'admin') {
        return {
          session: null,
          status: 403,
          error: 'Forbidden: Administrator role is required.',
        };
      }
      return {
        session: {
          ...session,
          email: profile.email || session.email,
          fullName: profile.full_name || session.fullName,
        },
        status: 200,
      };
    } catch {
      return {
        session: null,
        status: 403,
        error: 'Forbidden: Unable to verify administrator role.',
      };
    }
  }

  return { session, status: 200 };
}

export async function getAuthStatus() {
  const envPass = process.env.ADMIN_PASSWORD?.trim();
  const envOverride = Boolean(envPass && envPass.length > 0);
  const ownerEmailLock = process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase() || '';

  if (isSupabaseConfigured()) {
    const schema = await supabaseCheckSchemaStatus();
    let adminEmail = '';
    let hasAdmin = false;

    // RBAC Rule: ONLY an explicit `role = 'admin'` row in public.profiles satisfies admin presence.
    // Non-admin auth.users (viewer/editor) NEVER count as initialized admins.
    if (!schema.missingTables.includes('profiles')) {
      try {
        const admins = await supabaseSelect<Profile>('profiles', 'role=eq.admin&limit=1');
        if (admins.length > 0) {
          hasAdmin = true;
          adminEmail = admins[0].email;
        }
      } catch {
        // Ignore if table not ready
      }
    }

    return {
      needsSetup: !envOverride && !hasAdmin,
      envOverride,
      adminEmail: adminEmail || ownerEmailLock,
      authProvider: 'supabase' as const,
      schemaReady: schema.ready,
    };
  }

  const stored = await getAdminAuthRecord();
  const needsSetup = !envOverride && !stored;

  return {
    needsSetup,
    envOverride,
    adminEmail: stored?.email || ownerEmailLock,
    authProvider: 'local' as const,
    schemaReady: true,
  };
}

export async function setupFirstRunAdmin(params: {
  email: string;
  fullName: string;
  password: string;
}): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
  token?: string;
  profile?: { email: string; fullName: string };
}> {
  const envPass = process.env.ADMIN_PASSWORD?.trim();
  if (envPass) {
    return {
      ok: false,
      status: 409,
      error: 'Admin password is already managed via environment configuration.',
    };
  }

  const ownerEmailLock = process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase();
  if (ownerEmailLock && params.email.toLowerCase() !== ownerEmailLock) {
    return {
      ok: false,
      status: 403,
      error: 'Access denied: Only the designated site owner email can claim Admin setup.',
    };
  }

  if (isSupabaseConfigured()) {
    const schema = await supabaseCheckSchemaStatus();
    if (schema.missingTables.includes('profiles')) {
      return {
        ok: false,
        status: 400,
        error:
          'Database tables have not been created in Supabase yet. Run supabase/schema.sql in your Supabase SQL Editor, then create your admin account.',
      };
    }

    const existingAdmins = await supabaseSelect<Profile>('profiles', 'role=eq.admin&limit=1');
    if (existingAdmins.length > 0) {
      return {
        ok: false,
        status: 409,
        error: 'An Admin account already exists. Only an Admin can assign additional roles.',
      };
    }

    // Security check: do not allow claiming/promoting an existing non-admin auth.users email via public setup
    const existingUsers = await supabaseAdminListUsers();
    const existingMatch = existingUsers.find(
      (u) => (u.email || '').toLowerCase() === params.email.toLowerCase()
    );
    if (existingMatch) {
      return {
        ok: false,
        status: 403,
        error:
          'This email already exists without Admin privileges. Use a fresh owner email or assign role = admin in Supabase Table Editor -> profiles.',
      };
    }

    const createdUser = await supabaseAdminCreateUser({
      email: params.email,
      password: params.password,
      fullName: params.fullName,
      role: 'admin',
    });

    const now = new Date().toISOString();
    await supabaseUpsert<Profile>(
      'profiles',
      {
        id: createdUser.id,
        email: params.email,
        full_name: params.fullName,
        role: 'admin',
        avatar_url: '',
        created_at: now,
        updated_at: now,
      },
      'id'
    );

    const token = signSessionToken({
      sub: createdUser.id,
      email: params.email,
      fullName: params.fullName,
      role: 'admin',
    });

    return {
      ok: true,
      token,
      profile: { email: params.email, fullName: params.fullName },
    };
  }

  const { hash, salt } = hashPassword(params.password);
  const claimed = await claimAdminAuthRecord({
    email: params.email,
    full_name: params.fullName,
    password_hash: hash,
    salt,
    created_at: new Date().toISOString(),
  });

  if (!claimed) {
    return { ok: false, status: 409, error: 'Admin account has already been initialized.' };
  }

  const token = signSessionToken({
    email: params.email,
    fullName: params.fullName,
    role: 'admin',
  });

  return {
    ok: true,
    token,
    profile: { email: params.email, fullName: params.fullName },
  };
}

export function checkLoginRateLimit(key: string): boolean {
  if (!globalThis.__arafatLoginAttempts) {
    globalThis.__arafatLoginAttempts = new Map();
  }
  const map = globalThis.__arafatLoginAttempts;
  const now = Date.now();
  const entry = map.get(key);

  if (!entry || entry.resetAt < now) {
    map.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }

  if (entry.count >= 12) {
    return false;
  }

  entry.count += 1;
  map.set(key, entry);
  return true;
}

export async function authenticateAdmin(params: {
  email: string;
  password: string;
}): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
  token?: string;
  profile?: { email: string; fullName: string };
}> {
  const envPass = process.env.ADMIN_PASSWORD?.trim();

  if (envPass) {
    if (!verifyConstantTimeString(params.password, envPass)) {
      return { ok: false, status: 401, error: 'Invalid credentials.' };
    }
    let displayEmail = params.email || 'arafatdigitalservics@gmail.com';
    let fullName = 'Agency Administrator';

    if (isSupabaseConfigured()) {
      try {
        const admins = await supabaseSelect<Profile>('profiles', 'role=eq.admin&limit=1');
        if (admins[0]) {
          displayEmail = params.email || admins[0].email;
          fullName = admins[0].full_name || fullName;
        }
      } catch {
        // Ignore if table not ready
      }
    } else {
      const stored = await getAdminAuthRecord();
      if (stored) {
        displayEmail = params.email || stored.email;
        fullName = stored.full_name || fullName;
      }
    }

    const token = signSessionToken({ email: displayEmail, fullName, role: 'admin' });
    return { ok: true, token, profile: { email: displayEmail, fullName } };
  }

  if (isSupabaseConfigured()) {
    if (!params.email) {
      return { ok: false, status: 400, error: 'Admin email is required.' };
    }

    const authUser = await supabaseVerifyUserPassword(params.email, params.password);
    if (!authUser) {
      return { ok: false, status: 401, error: 'Invalid email or password.' };
    }

    const schema = await supabaseCheckSchemaStatus();
    if (schema.missingTables.includes('profiles')) {
      return {
        ok: false,
        status: 400,
        error:
          'Database tables have not been created yet. Run supabase/schema.sql in your Supabase SQL Editor.',
      };
    }

    const profiles = await supabaseSelect<Profile>(
      'profiles',
      `id=eq.${encodeURIComponent(authUser.id)}&limit=1`
    );
    const profile = profiles[0];
    if (!profile || profile.role !== 'admin') {
      return {
        ok: false,
        status: 403,
        error:
          'Access denied: Your account does not have Administrator privileges. Only users explicitly assigned the Admin role can enter.',
      };
    }

    const token = signSessionToken({
      sub: authUser.id,
      email: profile.email || authUser.email || params.email,
      fullName: profile.full_name || authUser.user_metadata?.full_name || 'Agency Admin',
      role: 'admin',
    });

    return {
      ok: true,
      token,
      profile: {
        email: profile.email || authUser.email || params.email,
        fullName: profile.full_name || authUser.user_metadata?.full_name || 'Agency Admin',
      },
    };
  }

  const stored = await getAdminAuthRecord();
  if (!stored) {
    return { ok: false, status: 401, error: 'Admin account has not been initialized yet.' };
  }

  if (params.email.toLowerCase() !== stored.email.toLowerCase()) {
    return { ok: false, status: 401, error: 'Invalid email or password.' };
  }

  if (!verifyPassword(params.password, stored.password_hash, stored.salt)) {
    return { ok: false, status: 401, error: 'Invalid email or password.' };
  }

  const token = signSessionToken({
    email: stored.email,
    fullName: stored.full_name,
    role: 'admin',
  });

  return {
    ok: true,
    token,
    profile: { email: stored.email, fullName: stored.full_name },
  };
}
