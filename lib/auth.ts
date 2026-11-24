import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { claimAdminAuthRecord, getAdminAuthRecord } from './data-store';

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

export async function getAuthStatus() {
  const envPass = process.env.ADMIN_PASSWORD?.trim();
  const stored = await getAdminAuthRecord();
  const envOverride = Boolean(envPass && envPass.length > 0);
  const needsSetup = !envOverride && !stored;

  return {
    needsSetup,
    envOverride,
    adminEmail: stored?.email || '',
  };
}

export async function setupFirstRunAdmin(params: {
  email: string;
  fullName: string;
  password: string;
}): Promise<{ ok: boolean; error?: string; token?: string; profile?: { email: string; fullName: string } }> {
  const envPass = process.env.ADMIN_PASSWORD?.trim();
  if (envPass) {
    return {
      ok: false,
      error: 'Admin password is already managed via environment configuration.',
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
    return { ok: false, error: 'Admin account has already been initialized.' };
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
}): Promise<{ ok: boolean; error?: string; token?: string; profile?: { email: string; fullName: string } }> {
  const envPass = process.env.ADMIN_PASSWORD?.trim();
  const stored = await getAdminAuthRecord();

  if (envPass) {
    if (!verifyConstantTimeString(params.password, envPass)) {
      return { ok: false, error: 'Invalid credentials.' };
    }
    const displayEmail = params.email || stored?.email || 'admin@arafatdigital.com';
    const fullName = stored?.full_name || 'Agency Administrator';
    const token = signSessionToken({ email: displayEmail, fullName, role: 'admin' });
    return { ok: true, token, profile: { email: displayEmail, fullName } };
  }

  if (!stored) {
    return { ok: false, error: 'Admin account has not been initialized yet.' };
  }

  if (params.email.toLowerCase() !== stored.email.toLowerCase()) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  if (!verifyPassword(params.password, stored.password_hash, stored.salt)) {
    return { ok: false, error: 'Invalid email or password.' };
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
