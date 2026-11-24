-- ============================================================================
-- Arafat Digital Services — Complete Supabase PostgreSQL Schema, RLS & Seeds
-- Run this SQL inside your Supabase Dashboard -> SQL Editor
-- Safe & idempotent: can be re-run cleanly without duplicating rows or failing
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
  service_id uuid references public.services(id) on delete set null,
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

-- 4. INQUIRIES TABLE (Contact & Project Inquiry Form Submissions)
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text not null default '',
  service_required text not null,
  service_id uuid references public.services(id) on delete set null,
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
  author_id uuid references public.profiles(id) on delete set null,
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

-- 8. NEWSLETTER SUBSCRIBERS TABLE
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'website',
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  created_at timestamptz not null default now()
);

-- Safe schema upgrades for existing databases
alter table public.projects
  add column if not exists service_id uuid references public.services(id) on delete set null;

alter table public.inquiries
  add column if not exists service_id uuid references public.services(id) on delete set null;

alter table public.blog_posts
  add column if not exists author_id uuid references public.profiles(id) on delete set null;

alter table public.site_settings
  add column if not exists secondary_email text not null default 'hossinmdarafat693@gmail.com',
  add column if not exists phone_number text not null default '01314821008';

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

-- Automatically create a lowest-privilege ('viewer') profile whenever a user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'viewer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Ensure any pre-existing auth.users have a default 'viewer' profile (never auto-promoted to admin)
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  'viewer'
from auth.users u
on conflict (id) do nothing;

-- Performance & Foreign Key Indexes
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_services_published_order on public.services (is_published, display_order);
create index if not exists idx_projects_published_created on public.projects (is_published, created_at desc);
create index if not exists idx_projects_service_id on public.projects (service_id);
create index if not exists idx_inquiries_status_created on public.inquiries (status, created_at desc);
create index if not exists idx_inquiries_service_id on public.inquiries (service_id);
create index if not exists idx_blog_posts_published_at on public.blog_posts (is_published, published_at desc);
create index if not exists idx_blog_posts_author_id on public.blog_posts (author_id);
create index if not exists idx_testimonials_published_order on public.testimonials (is_published, display_order);
create index if not exists idx_newsletter_status_created on public.newsletter_subscribers (status, created_at desc);

-- Enable Row Level Security (RLS) on all 8 tables
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.projects enable row level security;
alter table public.inquiries enable row level security;
alter table public.blog_posts enable row level security;
alter table public.testimonials enable row level security;
alter table public.site_settings enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- PROFILES RLS
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- SERVICES RLS
drop policy if exists "Public can read published services" on public.services;
create policy "Public can read published services" on public.services
  for select using (is_published = true or public.is_admin());

drop policy if exists "Admins can manage services" on public.services;
create policy "Admins can manage services" on public.services
  for all using (public.is_admin()) with check (public.is_admin());

-- PROJECTS RLS
drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects" on public.projects
  for select using (is_published = true or public.is_admin());

drop policy if exists "Admins can manage projects" on public.projects;
create policy "Admins can manage projects" on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

-- INQUIRIES RLS (Public can submit validated inquiries; only Admins can read/update/delete)
drop policy if exists "Anyone can submit contact inquiry" on public.inquiries;
create policy "Anyone can submit contact inquiry" on public.inquiries
  for insert with check (
    char_length(trim(name)) >= 2
    and char_length(trim(email)) >= 5
    and char_length(trim(service_required)) >= 2
    and char_length(trim(project_details)) >= 10
  );

drop policy if exists "Admins can view and manage inquiries" on public.inquiries;
create policy "Admins can view and manage inquiries" on public.inquiries
  for select using (public.is_admin());

drop policy if exists "Admins can update inquiries" on public.inquiries;
create policy "Admins can update inquiries" on public.inquiries
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can delete inquiries" on public.inquiries;
create policy "Admins can delete inquiries" on public.inquiries
  for delete using (public.is_admin());

-- BLOG POSTS RLS
drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts" on public.blog_posts
  for select using (is_published = true or public.is_admin());

drop policy if exists "Admins can manage blog posts" on public.blog_posts;
create policy "Admins can manage blog posts" on public.blog_posts
  for all using (public.is_admin()) with check (public.is_admin());

-- TESTIMONIALS RLS
drop policy if exists "Public can read published testimonials" on public.testimonials;
create policy "Public can read published testimonials" on public.testimonials
  for select using (is_published = true or public.is_admin());

drop policy if exists "Admins can manage testimonials" on public.testimonials;
create policy "Admins can manage testimonials" on public.testimonials
  for all using (public.is_admin()) with check (public.is_admin());

-- SITE SETTINGS RLS
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings
  for select using (true);

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- NEWSLETTER SUBSCRIBERS RLS (Public can subscribe with valid email; only Admins can read/manage)
drop policy if exists "Anyone can subscribe to newsletter" on public.newsletter_subscribers;
create policy "Anyone can subscribe to newsletter" on public.newsletter_subscribers
  for insert with check (
    char_length(trim(email)) >= 5
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

drop policy if exists "Admins can read newsletter subscribers" on public.newsletter_subscribers;
create policy "Admins can read newsletter subscribers" on public.newsletter_subscribers
  for select using (public.is_admin());

drop policy if exists "Admins can manage newsletter subscribers" on public.newsletter_subscribers;
create policy "Admins can manage newsletter subscribers" on public.newsletter_subscribers
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can delete newsletter subscribers" on public.newsletter_subscribers;
create policy "Admins can delete newsletter subscribers" on public.newsletter_subscribers
  for delete using (public.is_admin());

-- STORAGE BUCKET & POLICIES
insert into storage.buckets (id, name, public)
values ('agency-media', 'agency-media', true)
on conflict (id) do nothing;

drop policy if exists "Public can view agency media" on storage.objects;
create policy "Public can view agency media"
  on storage.objects for select
  using (bucket_id = 'agency-media');

drop policy if exists "Admins can upload agency media" on storage.objects;
create policy "Admins can upload agency media"
  on storage.objects for insert
  with check (bucket_id = 'agency-media' and public.is_admin());

drop policy if exists "Admins can delete agency media" on storage.objects;
create policy "Admins can delete agency media"
  on storage.objects for delete
  using (bucket_id = 'agency-media' and public.is_admin());

-- ============================================================================
-- IDEMPOTENT DEFAULT SEEDS
-- ============================================================================

insert into public.site_settings (
  id,
  brand_name,
  tagline,
  description,
  contact_email,
  secondary_email,
  whatsapp_number,
  phone_number,
  location_markets,
  linkedin_url,
  twitter_url,
  facebook_url,
  instagram_url,
  github_url
)
values (
  1,
  'Arafat Digital Services',
  'Empowering Businesses with Modern Digital Solutions.',
  'International digital agency partnering with growth-focused organizations across the USA, UK, Europe, Canada, Australia, and worldwide to design, engineer, and scale high-performing digital systems.',
  'arafatdigitalservics@gmail.com',
  'hossinmdarafat693@gmail.com',
  '+8801314821008',
  '01314821008',
  'USA, UK, Europe, Canada, Australia & Worldwide',
  'https://linkedin.com',
  'https://x.com',
  'https://facebook.com',
  'https://instagram.com',
  'https://github.com'
)
on conflict (id) do nothing;

insert into public.services (id, slug, title, short_description, full_description, icon_name, features, display_order, is_published)
values
  ('00000000-0000-4000-8000-000000000101', 'website-development', 'Website Development', 'Fast, accessible, SEO-ready web platforms and custom web applications engineered with Next.js, TypeScript, and modern cloud databases.', 'We architect and build scalable marketing websites, SaaS platforms, client portals, and e-commerce storefronts designed for Core Web Vitals, maintainability, and conversion clarity.', 'Code2', array['Custom Next.js & TypeScript architecture','PostgreSQL & Supabase backend integration','Mobile-first responsive layout & WCAG accessibility','Technical SEO & structured data setup'], 1, true),
  ('00000000-0000-4000-8000-000000000102', 'ui-ux-design', 'UI/UX Design', 'Research-backed product interfaces, design systems, and high-converting user journeys tailored for clarity and trust.', 'From wireframes and interactive prototypes to production-ready component libraries, we craft user interfaces that remove friction and strengthen brand authority across international markets.', 'Layers', array['User journey mapping & information architecture','Interactive prototypes & usability validation','Reusable Tailwind & Figma component systems','Conversion-focused landing page layouts'], 2, true),
  ('00000000-0000-4000-8000-000000000103', 'google-ads', 'Google Ads', 'Intent-driven Search, Display, and Performance Max campaigns structured around transparent conversion tracking and cost control.', 'We build disciplined Google Ads account structures, clean keyword segmentation, server-side conversion tracking, and landing page alignment to capture high-intent demand.', 'Target', array['Search & Performance Max campaign setup','Negative keyword governance & bid hygiene','GA4 & server-side conversion attribution','Landing page message-match optimization'], 3, true),
  ('00000000-0000-4000-8000-000000000104', 'facebook-ads', 'Facebook Ads', 'Full-funnel Meta advertising systems combining creative testing frameworks with Meta Pixel and Conversions API tracking.', 'We structure Meta (Facebook & Instagram) ad campaigns with systematic creative testing, audience segmentation, and reliable attribution to reach qualified buyers.', 'Megaphone', array['Meta Pixel & Conversions API implementation','Structured creative testing matrices','Retargeting & lookalike funnel architecture','Clear weekly spend & acquisition reporting'], 4, true),
  ('00000000-0000-4000-8000-000000000105', 'social-media-marketing', 'Social Media Marketing', 'Consistent, brand-aligned editorial calendars and multi-channel content workflows built for international B2B and B2C audiences.', 'We establish repeatable content pillars, visual templates, and publishing rhythms across LinkedIn, Instagram, and X to build durable organic brand equity.', 'Share2', array['Channel strategy & positioning guidelines','Monthly content calendars & creative direction','LinkedIn executive & brand presence','Audience engagement & performance reviews'], 5, true),
  ('00000000-0000-4000-8000-000000000106', 'seo-services', 'SEO Services', 'Technical site audits, search-intent content architecture, and international SEO foundations built for compounding organic visibility.', 'We diagnose crawlability bottlenecks, optimize site speed and schema markup, and develop topic-clustered content strategies targeted at competitive global markets.', 'Search', array['Technical crawl & Core Web Vitals remediation','Search-intent keyword & topic mapping','On-page structure & Schema.org markup','Regional targeting for US, UK, EU, CA & AU'], 6, true),
  ('00000000-0000-4000-8000-000000000107', 'business-automation', 'Business Automation', 'Custom CRM pipelines, lead routing, API integrations, and automated operational workflows that eliminate manual repetitive work.', 'We connect your website forms, CRM, email marketing, invoicing, and internal notifications into reliable automated systems with clear audit trails.', 'Workflow', array['Lead capture to CRM synchronization','Webhook & third-party API integrations','Automated client onboarding & notifications','Custom internal dashboards & reporting pipelines'], 7, true)
on conflict (slug) do nothing;

insert into public.projects (id, slug, title, category, service_id, client_name, summary, challenge, solution, deliverables, metrics_note, image_url, live_url, is_featured, is_published)
values
  ('00000000-0000-4000-8000-000000000201', 'enterprise-web-platform-template', 'B2B Web Platform (Editable Showcase)', 'Website Development', '00000000-0000-4000-8000-000000000101', 'Placeholder Client — Editable in Admin', 'Placeholder case study demonstrating our Next.js and PostgreSQL web engineering workflow. Replace this entry with your verified client project via the Admin Dashboard.', 'Placeholder challenge description: Outline the client’s legacy performance bottlenecks, conversion friction, or manual content management issues here.', 'Placeholder solution overview: Document the custom Next.js architecture, database model, and responsive interface delivered for this project.', array['Next.js App Router Platform','Responsive Component System','Database & CMS Integration','Technical SEO Implementation'], 'Editable placeholder — add verified client outcomes when published.', '/images/project_web_platform.jpg', '', true, true),
  ('00000000-0000-4000-8000-000000000202', 'cross-platform-ui-ux-system-template', 'Multi-Device UI/UX Design System (Editable Showcase)', 'UI/UX Design', '00000000-0000-4000-8000-000000000102', 'Placeholder Client — Editable in Admin', 'Placeholder UI/UX portfolio item showcasing responsive web and mobile design architecture. Edit title, client details, screenshots, and live URL in /admin.', 'Placeholder challenge description: Describe fragmented user flows or inconsistent interface patterns across desktop and mobile screens.', 'Placeholder solution overview: Detail the unified design tokens, wireframe validation, and accessible component specifications created for engineering handoff.', array['Information Architecture','Figma Component Library','Mobile & Desktop Prototypes','Accessibility Contrast Audit'], 'Editable placeholder — update with verified project results in Admin.', '/images/project_ux_mobile.jpg', '', true, true),
  ('00000000-0000-4000-8000-000000000203', 'lead-capture-automation-pipeline-template', 'Acquisition & Workflow Automation (Editable Showcase)', 'Business Automation', '00000000-0000-4000-8000-000000000107', 'Placeholder Client — Editable in Admin', 'Placeholder case study for paid acquisition tracking and automated CRM lead routing. Customize all fields, categories, and media in your Admin Dashboard.', 'Placeholder challenge description: Highlight disconnected ad attribution, delayed lead follow-up, or manual spreadsheet handoffs.', 'Placeholder solution overview: Explain the automated inquiry capture, validation, CRM sync, and conversion tracking workflow built for the team.', array['Paid Search & Meta Tracking Setup','Automated Lead Routing','CRM & Notification Sync','Reporting Dashboard'], 'Editable placeholder — add verified performance notes in Admin.', '/images/project_growth_automation.jpg', '', true, true)
on conflict (slug) do nothing;

insert into public.blog_posts (id, slug, title, category, excerpt, content, cover_image_url, author_name, read_time_minutes, is_published)
values
  ('00000000-0000-4000-8000-000000000301', 'modern-web-architecture-for-international-businesses', 'Structuring High-Speed Web Platforms for International Markets', 'Website Development', 'Key architectural decisions around server rendering, database security, and Core Web Vitals when serving users across North America, Europe, and APAC.', E'Organizations operating across the USA, UK, Europe, Canada, and Australia face a common challenge: delivering consistently fast page loads while keeping dynamic business data secure.\n\nServer-rendered frameworks like Next.js paired with PostgreSQL allow public marketing pages to load rapidly while keeping administrative mutations and customer inquiries strictly validated on the server.\n\nWhen planning a digital rebuild, prioritize clean information architecture, accessible typography, predictable URL structures, and minimal third-party script bloat before layering visual motion.\n\nNote: This starter article can be edited, expanded, or replaced directly inside your Admin Dashboard under Blog Posts.', '/images/project_web_platform.jpg', 'Arafat Digital Team', 4, true),
  ('00000000-0000-4000-8000-000000000302', 'clean-conversion-tracking-google-and-meta-ads', 'Why Clean Conversion Tracking Comes Before Scaling Google & Meta Ads', 'Paid Advertising', 'How proper event attribution, landing page alignment, and qualified lead filtering protect ad budgets before increasing spend.', E'Increasing ad spend without reliable conversion signals amplifies wasted budget. Before launching or scaling Google Ads or Facebook Ads campaigns, every landing page and contact form should record clean, verified lead events.\n\nAligning ad copy directly with the landing page headline, keeping form fields focused on genuine qualification criteria (service needed, timeline, and budget range), and connecting inquiries to a structured admin review queue ensures sales teams respond quickly to high-intent prospects.\n\nNote: Manage or publish new articles anytime from /admin.', '/images/project_growth_automation.jpg', 'Arafat Digital Team', 5, true),
  ('00000000-0000-4000-8000-000000000303', 'practical-business-automation-for-service-teams', 'Practical Business Automation: Eliminating Manual Lead Handoffs', 'Business Automation', 'A practical look at connecting website inquiry forms, relational databases, and instant notifications without over-engineering.', E'Many growing service businesses lose hours each week copying inquiry details between email inboxes, spreadsheets, and project trackers.\n\nA well-designed automation pipeline captures structured client requirements at the source, validates fields automatically, stores records in PostgreSQL with status tracking, and alerts the right team member immediately.\n\nStart with the highest-frequency bottlenecks—lead intake, scheduling, and status updates—before automating complex edge cases.', '/images/project_ux_mobile.jpg', 'Arafat Digital Team', 3, true)
on conflict (slug) do nothing;

insert into public.testimonials (id, client_name, client_role, company, quote, project_context, is_published, display_order)
values
  ('00000000-0000-4000-8000-000000000401', 'Client Name Placeholder', 'Role / Title (Editable in Admin)', 'Client Company Placeholder', 'Editable testimonial slot: Replace this text with a verified client quote, project outcome, and attribution inside Admin Dashboard -> Testimonials.', 'Website Development & UI/UX Design', true, 1),
  ('00000000-0000-4000-8000-000000000402', 'Client Name Placeholder', 'Role / Title (Editable in Admin)', 'Client Company Placeholder', 'Editable testimonial slot: Add feedback from your Google Ads, SEO, or Business Automation engagements once approved by your client.', 'Performance Marketing & Automation', true, 2)
on conflict (id) do nothing;
