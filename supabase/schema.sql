-- ============================================================================
-- Arafat Digital Services — Supabase PostgreSQL Schema & RLS Policies
-- Run this SQL inside your Supabase Dashboard -> SQL Editor
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. PROFILES TABLE (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role text not null default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. SERVICES TABLE
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text not null,
  full_description text not null,
  icon_name text not null default 'Code2',
  features text[] not null default '{}',
  display_order integer not null default 1,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. PROJECTS TABLE
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  client_name text not null default '',
  summary text not null,
  challenge text not null default '',
  solution text not null default '',
  deliverables text[] not null default '{}',
  metrics_note text not null default '',
  image_url text not null default '',
  live_url text not null default '',
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. INQUIRIES TABLE (Contact Form Submissions)
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text not null default '',
  service_required text not null,
  budget_range text not null,
  project_details text not null,
  status text not null default 'new' check (status in ('new', 'in_review', 'replied', 'archived')),
  admin_notes text not null default '',
  created_at timestamptz not null default now()
);

-- 5. BLOG POSTS TABLE
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  excerpt text not null,
  content text not null,
  cover_image_url text not null default '',
  author_name text not null default 'Arafat Digital Team',
  read_time_minutes integer not null default 4,
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. TESTIMONIALS TABLE
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_role text not null,
  company text not null,
  quote text not null,
  project_context text not null default '',
  is_published boolean not null default true,
  display_order integer not null default 1,
  created_at timestamptz not null default now()
);

-- 7. SITE SETTINGS TABLE (Single-row global configuration)
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  brand_name text not null default 'Arafat Digital Services',
  tagline text not null default 'Empowering Businesses with Modern Digital Solutions.',
  description text not null default '',
  contact_email text not null default 'arafatdigitalservics@gmail.com',
  secondary_email text not null default 'hossinmdarafat693@gmail.com',
  whatsapp_number text not null default '+8801314821008',
  phone_number text not null default '01314821008',
  location_markets text not null default 'USA, UK, Europe, Canada, Australia & Worldwide',
  linkedin_url text not null default '',
  twitter_url text not null default '',
  facebook_url text not null default '',
  instagram_url text not null default '',
  github_url text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.site_settings
  add column if not exists secondary_email text not null default 'hossinmdarafat693@gmail.com',
  add column if not exists phone_number text not null default '01314821008';

insert into public.site_settings (
  id,
  brand_name,
  tagline,
  contact_email,
  secondary_email,
  whatsapp_number,
  phone_number
)
values (
  1,
  'Arafat Digital Services',
  'Empowering Businesses with Modern Digital Solutions.',
  'arafatdigitalservics@gmail.com',
  'hossinmdarafat693@gmail.com',
  '+8801314821008',
  '01314821008'
)
on conflict (id) do nothing;

-- Helper function to check admin role safely in RLS policies
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Helpful query performance indexes
create index if not exists idx_services_published_order on public.services (is_published, display_order);
create index if not exists idx_projects_published_created on public.projects (is_published, created_at desc);
create index if not exists idx_blog_posts_published_at on public.blog_posts (is_published, published_at desc);
create index if not exists idx_inquiries_status_created on public.inquiries (status, created_at desc);

-- Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.projects enable row level security;
alter table public.inquiries enable row level security;
alter table public.blog_posts enable row level security;
alter table public.testimonials enable row level security;
alter table public.site_settings enable row level security;

-- PROFILES RLS
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "Admins can manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- SERVICES RLS
create policy "Public can read published services" on public.services
  for select using (is_published = true or public.is_admin());
create policy "Admins can manage services" on public.services
  for all using (public.is_admin()) with check (public.is_admin());

-- PROJECTS RLS
create policy "Public can read published projects" on public.projects
  for select using (is_published = true or public.is_admin());
create policy "Admins can manage projects" on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

-- INQUIRIES RLS (Public can submit validated inquiries; only Admins can read/update/delete)
create policy "Anyone can submit contact inquiry" on public.inquiries
  for insert with check (
    char_length(trim(name)) >= 2
    and char_length(trim(email)) >= 5
    and char_length(trim(service_required)) >= 2
    and char_length(trim(project_details)) >= 10
  );
create policy "Admins can view and manage inquiries" on public.inquiries
  for select using (public.is_admin());
create policy "Admins can update inquiries" on public.inquiries
  for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete inquiries" on public.inquiries
  for delete using (public.is_admin());

-- BLOG POSTS RLS
create policy "Public can read published blog posts" on public.blog_posts
  for select using (is_published = true or public.is_admin());
create policy "Admins can manage blog posts" on public.blog_posts
  for all using (public.is_admin()) with check (public.is_admin());

-- TESTIMONIALS RLS
create policy "Public can read published testimonials" on public.testimonials
  for select using (is_published = true or public.is_admin());
create policy "Admins can manage testimonials" on public.testimonials
  for all using (public.is_admin()) with check (public.is_admin());

-- SITE SETTINGS RLS
create policy "Public can read site settings" on public.site_settings
  for select using (true);
create policy "Admins can update site settings" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- STORAGE BUCKET & POLICIES
insert into storage.buckets (id, name, public)
values ('agency-media', 'agency-media', true)
on conflict (id) do nothing;

create policy "Public can view agency media"
  on storage.objects for select
  using (bucket_id = 'agency-media');

create policy "Admins can upload agency media"
  on storage.objects for insert
  with check (bucket_id = 'agency-media' and public.is_admin());

create policy "Admins can delete agency media"
  on storage.objects for delete
  using (bucket_id = 'agency-media' and public.is_admin());

-- INITIAL SERVICES SEED (Idempotent)
insert into public.services (slug, title, short_description, full_description, icon_name, features, display_order, is_published)
values
  ('website-development', 'Website Development', 'Fast, accessible, SEO-ready web platforms and custom web applications engineered with Next.js, TypeScript, and modern cloud databases.', 'We architect and build scalable marketing websites, SaaS platforms, client portals, and e-commerce storefronts designed for Core Web Vitals, maintainability, and conversion clarity.', 'Code2', array['Custom Next.js & TypeScript architecture','PostgreSQL & Supabase backend integration','Mobile-first responsive layout & WCAG accessibility','Technical SEO & structured data setup'], 1, true),
  ('ui-ux-design', 'UI/UX Design', 'Research-backed product interfaces, design systems, and high-converting user journeys tailored for clarity and trust.', 'From wireframes and interactive prototypes to production-ready component libraries, we craft user interfaces that remove friction and strengthen brand authority across international markets.', 'Layers', array['User journey mapping & information architecture','Interactive prototypes & usability validation','Reusable Tailwind & Figma component systems','Conversion-focused landing page layouts'], 2, true),
  ('google-ads', 'Google Ads', 'Intent-driven Search, Display, and Performance Max campaigns structured around transparent conversion tracking and cost control.', 'We build disciplined Google Ads account structures, clean keyword segmentation, server-side conversion tracking, and landing page alignment to capture high-intent demand.', 'Target', array['Search & Performance Max campaign setup','Negative keyword governance & bid hygiene','GA4 & server-side conversion attribution','Landing page message-match optimization'], 3, true),
  ('facebook-ads', 'Facebook Ads', 'Full-funnel Meta advertising systems combining creative testing frameworks with Meta Pixel and Conversions API tracking.', 'We structure Meta (Facebook & Instagram) ad campaigns with systematic creative testing, audience segmentation, and reliable attribution to reach qualified buyers.', 'Megaphone', array['Meta Pixel & Conversions API implementation','Structured creative testing matrices','Retargeting & lookalike funnel architecture','Clear weekly spend & acquisition reporting'], 4, true),
  ('social-media-marketing', 'Social Media Marketing', 'Consistent, brand-aligned editorial calendars and multi-channel content workflows built for international B2B and B2C audiences.', 'We establish repeatable content pillars, visual templates, and publishing rhythms across LinkedIn, Instagram, and X to build durable organic brand equity.', 'Share2', array['Channel strategy & positioning guidelines','Monthly content calendars & creative direction','LinkedIn executive & brand presence','Audience engagement & performance reviews'], 5, true),
  ('seo-services', 'SEO Services', 'Technical site audits, search-intent content architecture, and international SEO foundations built for compounding organic visibility.', 'We diagnose crawlability bottlenecks, optimize site speed and schema markup, and develop topic-clustered content strategies targeted at competitive global markets.', 'Search', array['Technical crawl & Core Web Vitals remediation','Search-intent keyword & topic mapping','On-page structure & Schema.org markup','Regional targeting for US, UK, EU, CA & AU'], 6, true),
  ('business-automation', 'Business Automation', 'Custom CRM pipelines, lead routing, API integrations, and automated operational workflows that eliminate manual repetitive work.', 'We connect your website forms, CRM, email marketing, invoicing, and internal notifications into reliable automated systems with clear audit trails.', 'Workflow', array['Lead capture to CRM synchronization','Webhook & third-party API integrations','Automated client onboarding & notifications','Custom internal dashboards & reporting pipelines'], 7, true)
on conflict (slug) do nothing;
