import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { cache } from 'react';
import { revalidateTag, unstable_cache } from 'next/cache';
import { DEFAULT_DATABASE_SNAPSHOT } from './default-data';
import {
  getBaseUrl,
  isMissingTableError,
  isSupabaseConfigured,
  supabaseAdminCreateUser,
  supabaseAdminListUsers,
  supabaseCheckSchemaStatus,
  supabaseDelete,
  supabasePatch,
  supabaseSelect,
  supabaseStorageDelete,
  supabaseStorageList,
  supabaseStorageUpload,
  supabaseUpsert,
} from './supabase-rest';
import type {
  AdminCredentialRecord,
  BlogPostItem,
  DatabaseSnapshot,
  InquiryItem,
  InquiryStatus,
  MediaAsset,
  NewsletterSubscriber,
  NewsletterStatus,
  Profile,
  ProjectItem,
  PublicSiteData,
  ServiceItem,
  SiteSettings,
  SupabaseSchemaStatus,
  TestimonialItem,
  UserRole,
} from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
const BUNDLED_IMAGES_DIR = path.resolve(process.cwd(), 'public', 'images');
const SUPABASE_BUCKET = 'agency-media';

let writeQueue: Promise<void> = Promise.resolve();

function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(fn, fn);
  writeQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

async function ensureLocalDatabaseFile(): Promise<DatabaseSnapshot> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSnapshot>;
    return {
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
      services:
        Array.isArray(parsed.services) && parsed.services.length > 0
          ? parsed.services
          : DEFAULT_DATABASE_SNAPSHOT.services,
      projects:
        Array.isArray(parsed.projects) && parsed.projects.length > 0
          ? parsed.projects
          : DEFAULT_DATABASE_SNAPSHOT.projects,
      inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : [],
      blog_posts:
        Array.isArray(parsed.blog_posts) && parsed.blog_posts.length > 0
          ? parsed.blog_posts
          : DEFAULT_DATABASE_SNAPSHOT.blog_posts,
      testimonials:
        Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0
          ? parsed.testimonials
          : DEFAULT_DATABASE_SNAPSHOT.testimonials,
      site_settings: parsed.site_settings
        ? {
            ...DEFAULT_DATABASE_SNAPSHOT.site_settings,
            ...parsed.site_settings,
            contact_email:
              parsed.site_settings.contact_email === 'hello@arafatdigital.com' ||
              parsed.site_settings.contact_email === 'arafatdigitalservics@gmail'
                ? DEFAULT_DATABASE_SNAPSHOT.site_settings.contact_email
                : parsed.site_settings.contact_email ||
                  DEFAULT_DATABASE_SNAPSHOT.site_settings.contact_email,
            secondary_email:
              parsed.site_settings.secondary_email ??
              DEFAULT_DATABASE_SNAPSHOT.site_settings.secondary_email,
            whatsapp_number:
              parsed.site_settings.whatsapp_number === '15550100000'
                ? DEFAULT_DATABASE_SNAPSHOT.site_settings.whatsapp_number
                : parsed.site_settings.whatsapp_number ||
                  DEFAULT_DATABASE_SNAPSHOT.site_settings.whatsapp_number,
            phone_number:
              parsed.site_settings.phone_number ??
              DEFAULT_DATABASE_SNAPSHOT.site_settings.phone_number,
            id: 1,
          }
        : DEFAULT_DATABASE_SNAPSHOT.site_settings,
      newsletter_subscribers: Array.isArray(parsed.newsletter_subscribers)
        ? parsed.newsletter_subscribers
        : [],
      admin_auth: parsed.admin_auth ?? null,
    };
  } catch {
    const initial = structuredClone(DEFAULT_DATABASE_SNAPSHOT);
    await fs.writeFile(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

async function writeLocalDatabaseFile(snapshot: DatabaseSnapshot): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tempFile = path.resolve(DATA_DIR, `database.${randomUUID()}.tmp`);
  await fs.writeFile(tempFile, JSON.stringify(snapshot, null, 2), 'utf8');
  await fs.rename(tempFile, DB_FILE);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveEntityId(rawId?: string): string {
  if (rawId && UUID_RE.test(rawId)) return rawId;
  return randomUUID();
}

function invalidatePublicCache() {
  try {
    revalidateTag('public-site-data');
  } catch {
    // Safe no-op outside Next.js server request context
  }
}

function friendlySupabaseError(err: unknown, fallback: string): Error {
  if (isMissingTableError(err)) {
    return new Error(
      'Supabase database tables are not initialized yet. Run supabase/schema.sql inside your Supabase Dashboard -> SQL Editor.'
    );
  }
  return err instanceof Error ? err : new Error(fallback);
}

async function resolveMatchingServiceId(serviceName: string): Promise<string | null> {
  if (!serviceName || !isSupabaseConfigured()) return null;
  try {
    const services = await supabaseSelect<Pick<ServiceItem, 'id' | 'title' | 'slug'>>(
      'services',
      'select=id,title,slug'
    );
    const needle = serviceName.trim().toLowerCase();
    const match = services.find(
      (s) => s.title.toLowerCase() === needle || s.slug.toLowerCase() === needle
    );
    return match?.id ?? null;
  } catch {
    return null;
  }
}

export function getStorageBackendMode(): 'supabase' | 'local' {
  return isSupabaseConfigured() ? 'supabase' : 'local';
}

async function fetchPublicSiteData(): Promise<PublicSiteData> {
  if (isSupabaseConfigured()) {
    try {
      const [services, projects, blog_posts, testimonials, settingsRows] = await Promise.all([
        supabaseSelect<ServiceItem>('services', 'is_published=eq.true&order=display_order.asc'),
        supabaseSelect<ProjectItem>('projects', 'is_published=eq.true&order=created_at.desc'),
        supabaseSelect<BlogPostItem>('blog_posts', 'is_published=eq.true&order=published_at.desc'),
        supabaseSelect<TestimonialItem>('testimonials', 'is_published=eq.true&order=display_order.asc'),
        supabaseSelect<SiteSettings>('site_settings', 'id=eq.1'),
      ]);
      return {
        services: services.length > 0 ? services : DEFAULT_DATABASE_SNAPSHOT.services,
        projects: projects.length > 0 ? projects : DEFAULT_DATABASE_SNAPSHOT.projects,
        blog_posts: blog_posts.length > 0 ? blog_posts : DEFAULT_DATABASE_SNAPSHOT.blog_posts,
        testimonials:
          testimonials.length > 0 ? testimonials : DEFAULT_DATABASE_SNAPSHOT.testimonials,
        site_settings: settingsRows[0] ?? DEFAULT_DATABASE_SNAPSHOT.site_settings,
      };
    } catch (error) {
      if (!isMissingTableError(error)) {
        console.error('Supabase public read error, falling back to default snapshot:', error);
      }
    }
  }

  const db = await ensureLocalDatabaseFile();
  return {
    services: [...db.services]
      .filter((s) => s.is_published)
      .sort((a, b) => a.display_order - b.display_order),
    projects: [...db.projects]
      .filter((p) => p.is_published)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    blog_posts: [...db.blog_posts]
      .filter((p) => p.is_published)
      .sort((a, b) => b.published_at.localeCompare(a.published_at)),
    testimonials: [...db.testimonials]
      .filter((t) => t.is_published)
      .sort((a, b) => a.display_order - b.display_order),
    site_settings: db.site_settings,
  };
}

const getCachedPublicSiteData = unstable_cache(
  fetchPublicSiteData,
  ['public-site-data'],
  { revalidate: 60, tags: ['public-site-data'] }
);

export const getPublicSiteData = cache(async (): Promise<PublicSiteData> => {
  return await getCachedPublicSiteData();
});

async function safeSupabaseSelect<T>(table: string, query: string, fallback: T[]): Promise<T[]> {
  try {
    return await supabaseSelect<T>(table, query);
  } catch (err) {
    if (isMissingTableError(err)) return fallback;
    throw err;
  }
}

export async function getAdminOverviewData() {
  if (isSupabaseConfigured()) {
    const schemaStatus: SupabaseSchemaStatus = await supabaseCheckSchemaStatus(SUPABASE_BUCKET);
    const [
      services,
      projects,
      inquiries,
      blog_posts,
      testimonials,
      settingsRows,
      profiles,
      newsletter_subscribers,
      media,
    ] = await Promise.all([
      safeSupabaseSelect<ServiceItem>(
        'services',
        'order=display_order.asc',
        DEFAULT_DATABASE_SNAPSHOT.services
      ),
      safeSupabaseSelect<ProjectItem>(
        'projects',
        'order=created_at.desc',
        DEFAULT_DATABASE_SNAPSHOT.projects
      ),
      safeSupabaseSelect<InquiryItem>('inquiries', 'order=created_at.desc', []),
      safeSupabaseSelect<BlogPostItem>(
        'blog_posts',
        'order=published_at.desc',
        DEFAULT_DATABASE_SNAPSHOT.blog_posts
      ),
      safeSupabaseSelect<TestimonialItem>(
        'testimonials',
        'order=display_order.asc',
        DEFAULT_DATABASE_SNAPSHOT.testimonials
      ),
      safeSupabaseSelect<SiteSettings>('site_settings', 'id=eq.1', [
        DEFAULT_DATABASE_SNAPSHOT.site_settings,
      ]),
      listUserProfiles(),
      safeSupabaseSelect<NewsletterSubscriber>(
        'newsletter_subscribers',
        'order=created_at.desc',
        []
      ),
      listMediaAssets(),
    ]);

    return {
      backendMode: 'supabase' as const,
      schemaStatus,
      services,
      projects,
      inquiries,
      blog_posts,
      testimonials,
      site_settings: settingsRows[0] ?? DEFAULT_DATABASE_SNAPSHOT.site_settings,
      profiles,
      newsletter_subscribers,
      media,
    };
  }

  const db = await ensureLocalDatabaseFile();
  const media = await listMediaAssets();
  return {
    backendMode: 'local' as const,
    schemaStatus: { ready: true, missingTables: [], bucketReady: true } satisfies SupabaseSchemaStatus,
    services: [...db.services].sort((a, b) => a.display_order - b.display_order),
    projects: [...db.projects].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    inquiries: [...db.inquiries].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    blog_posts: [...db.blog_posts].sort((a, b) => b.published_at.localeCompare(a.published_at)),
    testimonials: [...db.testimonials].sort((a, b) => a.display_order - b.display_order),
    site_settings: db.site_settings,
    profiles: db.profiles,
    newsletter_subscribers: [...db.newsletter_subscribers].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    ),
    media,
  };
}

// ---------- SERVICES ----------
export async function upsertService(
  item: Omit<ServiceItem, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<ServiceItem> {
  const now = new Date().toISOString();
  const id = resolveEntityId(item.id);

  if (isSupabaseConfigured()) {
    try {
      const payload = { ...item, id, updated_at: now };
      const saved = await supabaseUpsert<ServiceItem>('services', payload, 'id');
      invalidatePublicCache();
      return saved;
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to save service.');
    }
  }

  const saved = await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    const idx = db.services.findIndex((s) => s.id === id || s.id === item.id);
    const nextRecord: ServiceItem = {
      ...item,
      id,
      created_at: idx >= 0 ? db.services[idx].created_at : now,
      updated_at: now,
    };
    if (idx >= 0) db.services[idx] = nextRecord;
    else db.services.push(nextRecord);
    await writeLocalDatabaseFile(db);
    return nextRecord;
  });
  invalidatePublicCache();
  return saved;
}

export async function deleteService(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseDelete('services', 'id', id);
      invalidatePublicCache();
      return;
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to delete service.');
    }
  }
  await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    db.services = db.services.filter((s) => s.id !== id);
    await writeLocalDatabaseFile(db);
  });
  invalidatePublicCache();
}

// ---------- PROJECTS ----------
export async function upsertProject(
  item: Omit<ProjectItem, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<ProjectItem> {
  const now = new Date().toISOString();
  const id = resolveEntityId(item.id);

  if (isSupabaseConfigured()) {
    try {
      const service_id = item.service_id ?? (await resolveMatchingServiceId(item.category));
      const saved = await supabaseUpsert<ProjectItem>(
        'projects',
        { ...item, id, service_id, updated_at: now },
        'id'
      );
      invalidatePublicCache();
      return saved;
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to save project.');
    }
  }

  const saved = await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    const idx = db.projects.findIndex((p) => p.id === id || p.id === item.id);
    const nextRecord: ProjectItem = {
      ...item,
      id,
      created_at: idx >= 0 ? db.projects[idx].created_at : now,
      updated_at: now,
    };
    if (idx >= 0) db.projects[idx] = nextRecord;
    else db.projects.unshift(nextRecord);
    await writeLocalDatabaseFile(db);
    return nextRecord;
  });
  invalidatePublicCache();
  return saved;
}

export async function deleteProject(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseDelete('projects', 'id', id);
      invalidatePublicCache();
      return;
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to delete project.');
    }
  }
  await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    db.projects = db.projects.filter((p) => p.id !== id);
    await writeLocalDatabaseFile(db);
  });
  invalidatePublicCache();
}

// ---------- BLOG POSTS ----------
export async function upsertBlogPost(
  item: Omit<BlogPostItem, 'id' | 'created_at' | 'updated_at' | 'published_at'> & {
    id?: string;
    published_at?: string;
  }
): Promise<BlogPostItem> {
  const now = new Date().toISOString();
  const id = resolveEntityId(item.id);

  if (isSupabaseConfigured()) {
    try {
      const payload: Record<string, unknown> = {
        ...item,
        id,
        published_at: item.published_at || now,
        updated_at: now,
      };
      if (payload.author_id === undefined) delete payload.author_id;
      const saved = await supabaseUpsert<BlogPostItem>('blog_posts', payload, 'id');
      invalidatePublicCache();
      return saved;
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to save blog post.');
    }
  }

  const saved = await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    const idx = db.blog_posts.findIndex((p) => p.id === id || p.id === item.id);
    const nextRecord: BlogPostItem = {
      ...item,
      id,
      published_at: item.published_at || (idx >= 0 ? db.blog_posts[idx].published_at : now),
      created_at: idx >= 0 ? db.blog_posts[idx].created_at : now,
      updated_at: now,
    };
    if (idx >= 0) db.blog_posts[idx] = nextRecord;
    else db.blog_posts.unshift(nextRecord);
    await writeLocalDatabaseFile(db);
    return nextRecord;
  });
  invalidatePublicCache();
  return saved;
}

export async function deleteBlogPost(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseDelete('blog_posts', 'id', id);
      invalidatePublicCache();
      return;
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to delete blog post.');
    }
  }
  await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    db.blog_posts = db.blog_posts.filter((p) => p.id !== id);
    await writeLocalDatabaseFile(db);
  });
  invalidatePublicCache();
}

// ---------- TESTIMONIALS ----------
export async function upsertTestimonial(
  item: Omit<TestimonialItem, 'id' | 'created_at'> & { id?: string }
): Promise<TestimonialItem> {
  const now = new Date().toISOString();
  const id = resolveEntityId(item.id);

  if (isSupabaseConfigured()) {
    try {
      const saved = await supabaseUpsert<TestimonialItem>('testimonials', { ...item, id }, 'id');
      invalidatePublicCache();
      return saved;
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to save testimonial.');
    }
  }

  const saved = await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    const idx = db.testimonials.findIndex((t) => t.id === id || t.id === item.id);
    const nextRecord: TestimonialItem = {
      ...item,
      id,
      created_at: idx >= 0 ? db.testimonials[idx].created_at : now,
    };
    if (idx >= 0) db.testimonials[idx] = nextRecord;
    else db.testimonials.push(nextRecord);
    await writeLocalDatabaseFile(db);
    return nextRecord;
  });
  invalidatePublicCache();
  return saved;
}

export async function deleteTestimonial(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseDelete('testimonials', 'id', id);
      invalidatePublicCache();
      return;
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to delete testimonial.');
    }
  }
  await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    db.testimonials = db.testimonials.filter((t) => t.id !== id);
    await writeLocalDatabaseFile(db);
  });
  invalidatePublicCache();
}

// ---------- INQUIRIES ----------
export async function createInquiry(data: {
  name: string;
  email: string;
  company: string;
  service_required: string;
  budget_range: string;
  project_details: string;
}): Promise<InquiryItem> {
  const now = new Date().toISOString();
  const record: InquiryItem = {
    id: randomUUID(),
    ...data,
    service_id: null,
    status: 'new',
    admin_notes: '',
    created_at: now,
  };

  if (isSupabaseConfigured()) {
    try {
      record.service_id = await resolveMatchingServiceId(data.service_required);
      return await supabaseUpsert<InquiryItem>(
        'inquiries',
        record as unknown as Record<string, unknown>,
        'id'
      );
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to save inquiry.');
    }
  }

  return await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    db.inquiries.unshift(record);
    await writeLocalDatabaseFile(db);
    return record;
  });
}

export async function updateInquiry(
  id: string,
  updates: { status?: InquiryStatus; admin_notes?: string }
): Promise<InquiryItem | null> {
  if (isSupabaseConfigured()) {
    try {
      return await supabasePatch<InquiryItem>('inquiries', 'id', id, updates);
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to update inquiry.');
    }
  }

  return await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    const idx = db.inquiries.findIndex((i) => i.id === id);
    if (idx < 0) return null;
    db.inquiries[idx] = { ...db.inquiries[idx], ...updates };
    await writeLocalDatabaseFile(db);
    return db.inquiries[idx];
  });
}

export async function deleteInquiry(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseDelete('inquiries', 'id', id);
      return;
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to delete inquiry.');
    }
  }
  await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    db.inquiries = db.inquiries.filter((i) => i.id !== id);
    await writeLocalDatabaseFile(db);
  });
}

// ---------- NEWSLETTER SUBSCRIBERS ----------
export async function subscribeNewsletter(
  email: string,
  source = 'website'
): Promise<{ subscriber: NewsletterSubscriber; alreadySubscribed: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const existing = await supabaseSelect<NewsletterSubscriber>(
        'newsletter_subscribers',
        `email=eq.${encodeURIComponent(normalizedEmail)}&limit=1`
      );
      if (existing[0] && existing[0].status === 'active') {
        return { subscriber: existing[0], alreadySubscribed: true };
      }

      const saved = await supabaseUpsert<NewsletterSubscriber>(
        'newsletter_subscribers',
        {
          id: existing[0]?.id ?? randomUUID(),
          email: normalizedEmail,
          source,
          status: 'active',
          created_at: existing[0]?.created_at ?? now,
        },
        'email'
      );
      return { subscriber: saved, alreadySubscribed: false };
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to subscribe to newsletter.');
    }
  }

  return await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    const idx = db.newsletter_subscribers.findIndex((s) => s.email === normalizedEmail);
    if (idx >= 0 && db.newsletter_subscribers[idx].status === 'active') {
      return { subscriber: db.newsletter_subscribers[idx], alreadySubscribed: true };
    }
    const record: NewsletterSubscriber = {
      id: idx >= 0 ? db.newsletter_subscribers[idx].id : randomUUID(),
      email: normalizedEmail,
      source,
      status: 'active',
      created_at: idx >= 0 ? db.newsletter_subscribers[idx].created_at : now,
    };
    if (idx >= 0) db.newsletter_subscribers[idx] = record;
    else db.newsletter_subscribers.unshift(record);
    await writeLocalDatabaseFile(db);
    return { subscriber: record, alreadySubscribed: false };
  });
}

export async function listNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  if (isSupabaseConfigured()) {
    return await safeSupabaseSelect<NewsletterSubscriber>(
      'newsletter_subscribers',
      'order=created_at.desc',
      []
    );
  }
  const db = await ensureLocalDatabaseFile();
  return [...db.newsletter_subscribers].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function updateNewsletterSubscriberStatus(
  id: string,
  status: NewsletterStatus
): Promise<NewsletterSubscriber | null> {
  if (isSupabaseConfigured()) {
    try {
      return await supabasePatch<NewsletterSubscriber>('newsletter_subscribers', 'id', id, {
        status,
      });
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to update subscriber status.');
    }
  }
  return await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    const idx = db.newsletter_subscribers.findIndex((s) => s.id === id);
    if (idx < 0) return null;
    db.newsletter_subscribers[idx] = { ...db.newsletter_subscribers[idx], status };
    await writeLocalDatabaseFile(db);
    return db.newsletter_subscribers[idx];
  });
}

export async function deleteNewsletterSubscriber(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseDelete('newsletter_subscribers', 'id', id);
      return;
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to delete subscriber.');
    }
  }
  await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    db.newsletter_subscribers = db.newsletter_subscribers.filter((s) => s.id !== id);
    await writeLocalDatabaseFile(db);
  });
}

// ---------- SITE SETTINGS ----------
export async function updateSiteSettings(
  updates: Omit<SiteSettings, 'id' | 'updated_at'>
): Promise<SiteSettings> {
  const now = new Date().toISOString();
  const nextSettings: SiteSettings = {
    id: 1,
    ...updates,
    updated_at: now,
  };

  if (isSupabaseConfigured()) {
    try {
      const saved = await supabaseUpsert<SiteSettings>(
        'site_settings',
        nextSettings as unknown as Record<string, unknown>,
        'id'
      );
      invalidatePublicCache();
      return saved;
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to update website settings.');
    }
  }

  const saved = await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    db.site_settings = nextSettings;
    await writeLocalDatabaseFile(db);
    return nextSettings;
  });
  invalidatePublicCache();
  return saved;
}

// ---------- ADMIN AUTH RECORD (Local Fallback Mode) ----------
export async function getAdminAuthRecord(): Promise<AdminCredentialRecord | null> {
  const db = await ensureLocalDatabaseFile();
  return db.admin_auth ?? null;
}

export async function claimAdminAuthRecord(record: AdminCredentialRecord): Promise<boolean> {
  return await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    if (db.admin_auth) {
      return false;
    }
    db.admin_auth = record;
    const now = record.created_at;
    if (!db.profiles.some((p) => p.email === record.email)) {
      db.profiles.push({
        id: randomUUID(),
        email: record.email,
        full_name: record.full_name,
        role: 'admin',
        avatar_url: '',
        created_at: now,
        updated_at: now,
      });
    }
    await writeLocalDatabaseFile(db);
    return true;
  });
}

// ---------- RBAC USER PROFILES ----------
export async function listUserProfiles(): Promise<Profile[]> {
  if (isSupabaseConfigured()) {
    const profiles = await safeSupabaseSelect<Profile>('profiles', 'order=created_at.desc', []);
    try {
      const authUsers = await supabaseAdminListUsers();
      const byId = new Map(profiles.map((p) => [p.id, p]));
      const now = new Date().toISOString();
      for (const user of authUsers) {
        if (!byId.has(user.id)) {
          profiles.push({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            role: 'viewer',
            avatar_url: '',
            created_at: now,
            updated_at: now,
          });
        }
      }
    } catch {
      // Return profiles table rows if auth admin user list is unavailable
    }
    return profiles;
  }

  const db = await ensureLocalDatabaseFile();
  return [...db.profiles].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function updateUserProfileRole(
  userId: string,
  role: UserRole,
  actingAdminId?: string
): Promise<Profile> {
  if (actingAdminId && userId === actingAdminId && role !== 'admin') {
    throw new Error('You cannot remove your own Administrator role while signed in.');
  }

  if (isSupabaseConfigured()) {
    const allProfiles = await listUserProfiles();
    const target = allProfiles.find((p) => p.id === userId);
    if (!target) {
      throw new Error('User account not found.');
    }

    if (target.role === 'admin' && role !== 'admin') {
      const adminCount = allProfiles.filter((p) => p.role === 'admin').length;
      if (adminCount <= 1) {
        throw new Error('At least one Administrator account must remain active.');
      }
    }

    const now = new Date().toISOString();
    try {
      return await supabaseUpsert<Profile>(
        'profiles',
        {
          id: target.id,
          email: target.email,
          full_name: target.full_name,
          role,
          avatar_url: target.avatar_url || '',
          created_at: target.created_at || now,
          updated_at: now,
        },
        'id'
      );
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to update user role.');
    }
  }

  return await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    const idx = db.profiles.findIndex((p) => p.id === userId);
    if (idx < 0) {
      throw new Error('User profile not found.');
    }
    if (db.profiles[idx].role === 'admin' && role !== 'admin') {
      const adminCount = db.profiles.filter((p) => p.role === 'admin').length;
      if (adminCount <= 1) {
        throw new Error('At least one Administrator account must remain active.');
      }
    }
    db.profiles[idx] = {
      ...db.profiles[idx],
      role,
      updated_at: new Date().toISOString(),
    };
    await writeLocalDatabaseFile(db);
    return db.profiles[idx];
  });
}

export async function createManagedUser(params: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}): Promise<Profile> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const existingUsers = await supabaseAdminListUsers();
    if (existingUsers.some((u) => (u.email || '').toLowerCase() === normalizedEmail)) {
      throw new Error('A user with this email already exists. Update their role from the list below.');
    }

    const createdUser = await supabaseAdminCreateUser({
      email: normalizedEmail,
      password: params.password,
      fullName: params.fullName,
      role: params.role,
    });

    try {
      return await supabaseUpsert<Profile>(
        'profiles',
        {
          id: createdUser.id,
          email: normalizedEmail,
          full_name: params.fullName,
          role: params.role,
          avatar_url: '',
          created_at: now,
          updated_at: now,
        },
        'id'
      );
    } catch (err) {
      throw friendlySupabaseError(err, 'Unable to save user profile.');
    }
  }

  return await withWriteLock(async () => {
    const db = await ensureLocalDatabaseFile();
    if (db.profiles.some((p) => p.email.toLowerCase() === normalizedEmail)) {
      throw new Error('A user with this email already exists.');
    }
    const profile: Profile = {
      id: randomUUID(),
      email: normalizedEmail,
      full_name: params.fullName,
      role: params.role,
      avatar_url: '',
      created_at: now,
      updated_at: now,
    };
    db.profiles.unshift(profile);
    await writeLocalDatabaseFile(db);
    return profile;
  });
}

// ---------- MEDIA ASSETS ----------
export async function listMediaAssets(): Promise<MediaAsset[]> {
  const assets: MediaAsset[] = [];

  try {
    const bundledFiles = await fs.readdir(BUNDLED_IMAGES_DIR);
    for (const file of bundledFiles) {
      if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
        const stats = await fs.stat(path.resolve(BUNDLED_IMAGES_DIR, file));
        assets.push({
          name: file,
          url: `/images/${file}`,
          size: stats.size,
          created_at: stats.birthtime.toISOString(),
          source: 'bundled',
        });
      }
    }
  } catch {
    // ignore if directory missing
  }

  if (isSupabaseConfigured()) {
    const baseUrl = getBaseUrl();
    const items = await supabaseStorageList(SUPABASE_BUCKET);
    for (const item of items) {
      if (item.name && !item.name.startsWith('.')) {
        assets.push({
          name: item.name,
          url: `${baseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${encodeURIComponent(item.name)}`,
          size: item.metadata?.size ?? 0,
          created_at: item.created_at || new Date().toISOString(),
          source: 'supabase',
        });
      }
    }
    return assets;
  }

  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const uploadedFiles = await fs.readdir(UPLOADS_DIR);
    for (const file of uploadedFiles) {
      if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
        const stats = await fs.stat(path.resolve(UPLOADS_DIR, file));
        assets.push({
          name: file,
          url: `/uploads/${file}`,
          size: stats.size,
          created_at: stats.birthtime.toISOString(),
          source: 'uploaded',
        });
      }
    }
  } catch {
    // ignore
  }

  return assets;
}

export function detectImageSignature(buffer: Buffer): { ext: string; mime: string } | null {
  if (buffer.length < 12) return null;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { ext: 'png', mime: 'image/png' };
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  // WEBP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

export async function saveMediaAsset(
  originalName: string,
  buffer: Buffer
): Promise<MediaAsset> {
  const sig = detectImageSignature(buffer);
  if (!sig) {
    throw new Error('Only verified PNG, JPEG, and WEBP images are permitted.');
  }
  if (buffer.length > 4 * 1024 * 1024) {
    throw new Error('File exceeds 4 MB upload limit.');
  }

  const baseName =
    path
      .basename(originalName, path.extname(originalName))
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 48) || 'asset';
  const fileName = `${baseName}-${Date.now()}.${sig.ext}`;

  if (isSupabaseConfigured()) {
    const publicUrl = await supabaseStorageUpload(SUPABASE_BUCKET, fileName, buffer, sig.mime);
    return {
      name: fileName,
      url: publicUrl,
      size: buffer.length,
      created_at: new Date().toISOString(),
      source: 'supabase',
    };
  }

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const resolvedTarget = path.resolve(UPLOADS_DIR, fileName);
  if (!resolvedTarget.startsWith(UPLOADS_DIR + path.sep)) {
    throw new Error('Invalid destination path.');
  }
  await fs.writeFile(resolvedTarget, buffer);

  return {
    name: fileName,
    url: `/uploads/${fileName}`,
    size: buffer.length,
    created_at: new Date().toISOString(),
    source: 'uploaded',
  };
}

export async function deleteMediaAsset(name: string): Promise<void> {
  const cleanName = path.basename(name);
  if (!cleanName || cleanName !== name || cleanName.startsWith('.')) {
    throw new Error('Invalid asset name.');
  }

  if (isSupabaseConfigured()) {
    await supabaseStorageDelete(SUPABASE_BUCKET, cleanName);
    return;
  }

  const resolvedTarget = path.resolve(UPLOADS_DIR, cleanName);
  if (!resolvedTarget.startsWith(UPLOADS_DIR + path.sep)) {
    throw new Error('Invalid asset path.');
  }
  await fs.unlink(resolvedTarget);
}
