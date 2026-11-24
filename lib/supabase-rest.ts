// Server-only Supabase PostgREST, Auth & Storage helper.
// Activates automatically when NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.

const SUPABASE_TIMEOUT_MS = 8000;

export const REQUIRED_SUPABASE_TABLES = [
  'profiles',
  'services',
  'projects',
  'inquiries',
  'blog_posts',
  'testimonials',
  'site_settings',
  'newsletter_subscribers',
] as const;

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(url && serviceKey && url.startsWith('https://'));
}

export function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '').replace(/\/+$/, '');
}

function getServiceKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
}

function getSupabaseHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const serviceKey = getServiceKey();
  const headers: Record<string, string> = {
    apikey: serviceKey,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...extra,
  };
  // Legacy service_role JWTs require Authorization: Bearer; sb_secret_ keys authenticate via apikey.
  if (serviceKey && !serviceKey.startsWith('sb_secret_')) {
    headers.Authorization = `Bearer ${serviceKey}`;
  }
  return headers;
}

export function isMissingTableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('PGRST205') || msg.includes('Could not find the table');
}

export interface SupabaseAuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export async function supabaseCheckSchemaStatus(bucket = 'agency-media'): Promise<{
  ready: boolean;
  missingTables: string[];
  bucketReady: boolean;
}> {
  const baseUrl = getBaseUrl();
  try {
    const [specRes, bucketRes] = await Promise.all([
      fetch(`${baseUrl}/rest/v1/`, {
        method: 'GET',
        headers: { apikey: getServiceKey() },
        cache: 'no-store',
        signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
      }),
      fetch(`${baseUrl}/storage/v1/bucket/${encodeURIComponent(bucket)}`, {
        method: 'GET',
        headers: { apikey: getServiceKey() },
        cache: 'no-store',
        signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
      }),
    ]);

    let missingTables = [...REQUIRED_SUPABASE_TABLES] as string[];
    if (specRes.ok) {
      const spec = (await specRes.json()) as { paths?: Record<string, unknown> };
      const paths = Object.keys(spec.paths || {});
      missingTables = REQUIRED_SUPABASE_TABLES.filter((table) => !paths.includes(`/${table}`));
    }

    return {
      ready: missingTables.length === 0,
      missingTables,
      bucketReady: bucketRes.ok,
    };
  } catch {
    return {
      ready: false,
      missingTables: [...REQUIRED_SUPABASE_TABLES],
      bucketReady: false,
    };
  }
}

export async function supabaseSelect<T>(
  table: string,
  query = 'select=*'
): Promise<T[]> {
  const normalizedQuery = query.includes('select=') ? query : `select=*&${query}`;
  const url = `${getBaseUrl()}/rest/v1/${encodeURIComponent(table)}?${normalizedQuery}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getSupabaseHeaders(),
    cache: 'no-store',
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase select failed (${res.status}): ${errText}`);
  }
  return (await res.json()) as T[];
}

export async function supabaseUpsert<T>(
  table: string,
  payload: Record<string, unknown>,
  onConflict = 'id'
): Promise<T> {
  const url = `${getBaseUrl()}/rest/v1/${encodeURIComponent(table)}?on_conflict=${encodeURIComponent(onConflict)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getSupabaseHeaders({
      Prefer: 'resolution=merge-duplicates,return=representation',
    }),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase upsert failed (${res.status}): ${errText}`);
  }
  const rows = (await res.json()) as T[];
  return rows[0];
}

export async function supabasePatch<T>(
  table: string,
  idColumn: string,
  idValue: string | number,
  payload: Record<string, unknown>
): Promise<T | null> {
  const url = `${getBaseUrl()}/rest/v1/${encodeURIComponent(table)}?${encodeURIComponent(idColumn)}=eq.${encodeURIComponent(String(idValue))}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: getSupabaseHeaders(),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase patch failed (${res.status}): ${errText}`);
  }
  const rows = (await res.json()) as T[];
  return rows[0] ?? null;
}

export async function supabaseDelete(
  table: string,
  idColumn: string,
  idValue: string
): Promise<void> {
  const url = `${getBaseUrl()}/rest/v1/${encodeURIComponent(table)}?${encodeURIComponent(idColumn)}=eq.${encodeURIComponent(idValue)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getSupabaseHeaders(),
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase delete failed (${res.status}): ${errText}`);
  }
}

export async function supabaseAdminListUsers(): Promise<SupabaseAuthUser[]> {
  const url = `${getBaseUrl()}/auth/v1/admin/users?page=1&per_page=50`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getSupabaseHeaders(),
    cache: 'no-store',
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase list users failed (${res.status}): ${errText}`);
  }
  const data = (await res.json()) as { users?: SupabaseAuthUser[] };
  return Array.isArray(data.users) ? data.users : [];
}

export async function supabaseAdminCreateUser(params: {
  email: string;
  password: string;
  fullName: string;
  role?: 'admin' | 'editor' | 'viewer';
}): Promise<SupabaseAuthUser> {
  const url = `${getBaseUrl()}/auth/v1/admin/users`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getSupabaseHeaders(),
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        full_name: params.fullName,
        role: params.role ?? 'viewer',
      },
    }),
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase user creation failed (${res.status}): ${errText}`);
  }
  return (await res.json()) as SupabaseAuthUser;
}

export async function supabaseVerifyUserPassword(
  email: string,
  password: string
): Promise<SupabaseAuthUser | null> {
  const url = `${getBaseUrl()}/auth/v1/token?grant_type=password`;
  const authKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || getServiceKey();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: authKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
  });
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as { user?: SupabaseAuthUser };
  return data.user ?? null;
}

export async function supabaseEnsureBucket(bucket: string): Promise<void> {
  const baseUrl = getBaseUrl();
  const checkRes = await fetch(`${baseUrl}/storage/v1/bucket/${encodeURIComponent(bucket)}`, {
    method: 'GET',
    headers: { apikey: getServiceKey() },
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
  });
  if (checkRes.ok) return;

  const createRes = await fetch(`${baseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: getSupabaseHeaders(),
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: true,
      file_size_limit: 4 * 1024 * 1024,
      allowed_mime_types: ['image/png', 'image/jpeg', 'image/webp'],
    }),
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
  });
  if (!createRes.ok && createRes.status !== 409) {
    const errText = await createRes.text();
    throw new Error(`Unable to ensure storage bucket (${createRes.status}): ${errText}`);
  }
}

export async function supabaseStorageUpload(
  bucket: string,
  objectPath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await supabaseEnsureBucket(bucket);
  const baseUrl = getBaseUrl();
  const serviceKey = getServiceKey();
  const encodedPath = objectPath
    .replace(/^\/+/, '')
    .split('/')
    .map(encodeURIComponent)
    .join('/');
  const uploadUrl = `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`;

  const headers: Record<string, string> = {
    apikey: serviceKey,
    'Content-Type': contentType,
    'x-upsert': 'true',
  };
  if (serviceKey && !serviceKey.startsWith('sb_secret_')) {
    headers.Authorization = `Bearer ${serviceKey}`;
  }

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers,
    body: new Uint8Array(buffer),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase storage upload failed (${res.status}): ${errText}`);
  }

  return `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
}

export async function supabaseStorageList(bucket: string): Promise<
  Array<{ name: string; id?: string; created_at?: string; metadata?: { size?: number } }>
> {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
      method: 'POST',
      headers: getSupabaseHeaders(),
      body: JSON.stringify({ prefix: '', limit: 100, offset: 0 }),
      signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
    });
    if (!res.ok) return [];
    return (await res.json()) as Array<{
      name: string;
      id?: string;
      created_at?: string;
      metadata?: { size?: number };
    }>;
  } catch {
    return [];
  }
}

export async function supabaseStorageDelete(bucket: string, name: string): Promise<void> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}`, {
    method: 'DELETE',
    headers: getSupabaseHeaders(),
    body: JSON.stringify({ prefixes: [name] }),
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase storage delete failed (${res.status}): ${errText}`);
  }
}
