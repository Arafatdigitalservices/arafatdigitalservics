export type UserRole = 'admin' | 'editor' | 'viewer';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  full_description: string;
  icon_name: string;
  features: string[];
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  client_name: string;
  summary: string;
  challenge: string;
  solution: string;
  deliverables: string[];
  metrics_note: string;
  image_url: string;
  live_url: string;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type InquiryStatus = 'new' | 'in_review' | 'replied' | 'archived';

export interface InquiryItem {
  id: string;
  name: string;
  email: string;
  company: string;
  service_required: string;
  budget_range: string;
  project_details: string;
  status: InquiryStatus;
  admin_notes: string;
  created_at: string;
}

export interface BlogPostItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  author_name: string;
  read_time_minutes: number;
  is_published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface TestimonialItem {
  id: string;
  client_name: string;
  client_role: string;
  company: string;
  quote: string;
  project_context: string;
  is_published: boolean;
  display_order: number;
  created_at: string;
}

export interface SiteSettings {
  id: number;
  brand_name: string;
  tagline: string;
  description: string;
  contact_email: string;
  secondary_email: string;
  whatsapp_number: string;
  phone_number: string;
  location_markets: string;
  linkedin_url: string;
  twitter_url: string;
  facebook_url: string;
  instagram_url: string;
  github_url: string;
  updated_at: string;
}

export interface MediaAsset {
  name: string;
  url: string;
  size: number;
  created_at: string;
  source: 'uploaded' | 'bundled' | 'supabase';
}

export interface AdminCredentialRecord {
  email: string;
  full_name: string;
  password_hash: string;
  salt: string;
  created_at: string;
}

export interface DatabaseSnapshot {
  profiles: Profile[];
  services: ServiceItem[];
  projects: ProjectItem[];
  inquiries: InquiryItem[];
  blog_posts: BlogPostItem[];
  testimonials: TestimonialItem[];
  site_settings: SiteSettings;
  admin_auth?: AdminCredentialRecord | null;
}

export interface PublicSiteData {
  services: ServiceItem[];
  projects: ProjectItem[];
  blog_posts: BlogPostItem[];
  testimonials: TestimonialItem[];
  site_settings: SiteSettings;
}
