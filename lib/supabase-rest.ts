// Server-only Supabase PostgREST & Storage helper.
// Activates automatically when NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.

const SUPABASE_TIMEOUT_MS = 8000;

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(url && serviceKey && url.startsWith('https://'));
}

function getSupabaseHeaders(): Record<string, string> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '').replace(/\/+$/, '');
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
    headers: {
      ...getSupabaseHeaders(),
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
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

export async function supabaseStorageUpload(
  bucket: string,
  objectPath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const baseUrl = getBaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  const encodedPath = objectPath
    .replace(/^\/+/, '')
    .split('/')
    .map(encodeURIComponent)
    .join('/');
  const uploadUrl = `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`;

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
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
