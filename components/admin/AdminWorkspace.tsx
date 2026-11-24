'use client';

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Briefcase,
  Check,
  Copy,
  ExternalLink,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  Pencil,
  Plus,
  Settings,
  Trash2,
  Upload,
} from 'lucide-react';
import { MediaImage } from '@/components/MediaImage';
import type {
  BlogPostItem,
  InquiryItem,
  InquiryStatus,
  MediaAsset,
  Profile,
  ProjectItem,
  ServiceItem,
  SiteSettings,
  TestimonialItem,
} from '@/lib/types';
import { AdminAuthView } from './AdminAuthView';

const ServiceEditorModal = dynamic(
  () => import('./AdminCrudEditors').then((m) => m.ServiceEditorModal),
  { ssr: false }
);
const ProjectEditorModal = dynamic(
  () => import('./AdminCrudEditors').then((m) => m.ProjectEditorModal),
  { ssr: false }
);
const BlogEditorModal = dynamic(
  () => import('./AdminCrudEditors').then((m) => m.BlogEditorModal),
  { ssr: false }
);
const TestimonialEditorModal = dynamic(
  () => import('./AdminCrudEditors').then((m) => m.TestimonialEditorModal),
  { ssr: false }
);

type AdminTab =
  | 'overview'
  | 'projects'
  | 'services'
  | 'blog'
  | 'testimonials'
  | 'inquiries'
  | 'media'
  | 'settings';

interface OverviewPayload {
  backendMode: 'supabase' | 'local';
  services: ServiceItem[];
  projects: ProjectItem[];
  inquiries: InquiryItem[];
  blog_posts: BlogPostItem[];
  testimonials: TestimonialItem[];
  site_settings: SiteSettings;
  profiles: Profile[];
  media: MediaAsset[];
}

const SIDEBAR_ITEMS: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'blog', label: 'Blog Posts', icon: FileText },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { id: 'inquiries', label: 'Inquiries', icon: Inbox },
  { id: 'media', label: 'Media Library', icon: ImageIcon },
  { id: 'settings', label: 'Site Settings', icon: Settings },
];

const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: 'New',
  in_review: 'In Review',
  replied: 'Replied',
  archived: 'Archived',
};

function formatDateShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function AdminWorkspace() {
  const [token, setToken] = useState<string | null>(null);
  const [adminProfile, setAdminProfile] = useState<{ email: string; fullName: string } | null>(
    null
  );
  const [authChecking, setAuthChecking] = useState(true);
  const [authStatus, setAuthStatus] = useState<{
    needsSetup: boolean;
    envOverride: boolean;
    adminEmail: string;
  }>({
    needsSetup: false,
    envOverride: false,
    adminEmail: '',
  });

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Modals
  const [editingService, setEditingService] = useState<ServiceItem | null | undefined>(undefined);
  const [editingProject, setEditingProject] = useState<ProjectItem | null | undefined>(undefined);
  const [editingBlog, setEditingBlog] = useState<BlogPostItem | null | undefined>(undefined);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null | undefined>(
    undefined
  );

  // Inquiries filter & notes
  const [inquiryFilter, setInquiryFilter] = useState<'all' | InquiryStatus>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);
  const [inquiryNotesDraft, setInquiryNotesDraft] = useState('');

  // Media upload & clipboard state
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Settings draft
  const [settingsForm, setSettingsForm] = useState<SiteSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Delete confirmation dialog state (no window.confirm)
  const [pendingDelete, setPendingDelete] = useState<{
    label: string;
    endpoint: string;
  } | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 3500);
  }, []);

  useEffect(() => {
    let active = true;
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/auth/status', { cache: 'no-store' });
        const json = (await res.json()) as {
          needsSetup?: boolean;
          envOverride?: boolean;
          adminEmail?: string;
        };
        if (active) {
          setAuthStatus({
            needsSetup: Boolean(json.needsSetup),
            envOverride: Boolean(json.envOverride),
            adminEmail: json.adminEmail || '',
          });
        }
      } catch {
        // ignore
      } finally {
        if (active) setAuthChecking(false);
      }
    }
    checkAuth();
    return () => {
      active = false;
    };
  }, []);

  const fetchOverview = useCallback(async (authToken: string) => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store',
      });
      if (res.status === 401) {
        setToken(null);
        setAdminProfile(null);
        return;
      }
      if (!res.ok) return;
      const json = (await res.json()) as OverviewPayload;
      setData(json);
      setSettingsForm(json.site_settings);
    } finally {
      setLoadingData(false);
    }
  }, []);

  async function confirmDelete() {
    if (!pendingDelete || !token) return;
    try {
      const res = await fetch(pendingDelete.endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast(`${pendingDelete.label} deleted.`);
        await fetchOverview(token);
      } else {
        showToast('Unable to delete item.');
      }
    } finally {
      setPendingDelete(null);
    }
  }

  async function handleInquiryUpdate(id: string, status: InquiryStatus, admin_notes?: string) {
    if (!token) return;
    const res = await fetch('/api/admin/inquiries', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, status, admin_notes }),
    });
    if (res.ok) {
      showToast('Inquiry updated.');
      await fetchOverview(token);
      if (selectedInquiry?.id === id) {
        const updated = (await res.json()) as InquiryItem;
        setSelectedInquiry(updated);
      }
    }
  }

  async function handleMediaUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast(json.error || 'Upload failed.');
        return;
      }
      showToast('Image uploaded to Media Library.');
      await fetchOverview(token);
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  }

  async function handleCopyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      showToast('Copy failed — please copy the URL manually.');
    }
  }

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    if (!settingsForm || !token) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsForm),
      });
      const json = (await res.json()) as SiteSettings & { error?: string };
      if (!res.ok) {
        showToast(json.error || 'Unable to save settings.');
        return;
      }
      showToast('Website settings updated.');
      await fetchOverview(token);
    } finally {
      setSavingSettings(false);
    }
  }

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <p className="text-sm text-slate-600">Checking authentication status...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <AdminAuthView
        needsSetup={authStatus.needsSetup}
        envOverride={authStatus.envOverride}
        defaultEmail={authStatus.adminEmail}
        onAuthenticated={(newToken, profile) => {
          setToken(newToken);
          setAdminProfile(profile);
          void fetchOverview(newToken);
        }}
      />
    );
  }

  const activeLabel = SIDEBAR_ITEMS.find((i) => i.id === activeTab)?.label || 'Overview';
  const filteredInquiries =
    data?.inquiries.filter((inq) =>
      inquiryFilter === 'all' ? true : inq.status === inquiryFilter
    ) || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0F172A] text-slate-300 shrink-0 flex flex-col justify-between">
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
            <span className="font-display text-base font-bold text-white whitespace-nowrap">
              Arafat Admin
            </span>
          </div>

          <nav className="p-3 flex md:flex-col gap-1 overflow-x-auto" aria-label="Admin Navigation">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#2563EB] text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.id === 'inquiries' && data ? (
                    <span className="ml-auto font-mono text-xs tabular-nums opacity-90">
                      {data.inquiries.filter((i) => i.status === 'new').length}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:block p-4 border-t border-slate-800 space-y-3">
          <div className="text-xs">
            <p className="font-medium text-white truncate">{adminProfile?.fullName}</p>
            <p className="text-slate-300 truncate">{adminProfile?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setToken(null);
              setAdminProfile(null);
              setData(null);
            }}
            className="w-full min-h-[40px] flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 bg-white/10 hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-slate-500">Admin</span>
            <span className="text-slate-400">/</span>
            <h1 className="font-display font-semibold text-[#0F172A] truncate">{activeLabel}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-medium text-[#0F172A] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              View Live Site
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setToken(null);
                setAdminProfile(null);
                setData(null);
              }}
              className="md:hidden min-h-[40px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>

        {toast ? (
          <div className="mx-4 sm:mx-8 mt-4 px-4 py-3 rounded-xl bg-[#0F172A] text-white text-sm flex items-center justify-between">
            <span>{toast}</span>
          </div>
        ) : null}

        <main className="p-4 sm:p-8 flex-1 max-w-6xl w-full">
          {loadingData && !data ? (
            <div className="space-y-4">
              <div className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
              <div className="h-64 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            </div>
          ) : null}

          {/* 1. OVERVIEW */}
          {activeTab === 'overview' && data ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Services', value: data.services.length, tab: 'services' as AdminTab },
                  { label: 'Projects', value: data.projects.length, tab: 'projects' as AdminTab },
                  { label: 'Blog Posts', value: data.blog_posts.length, tab: 'blog' as AdminTab },
                  {
                    label: 'Testimonials',
                    value: data.testimonials.length,
                    tab: 'testimonials' as AdminTab,
                  },
                  {
                    label: 'Open Inquiries',
                    value: data.inquiries.filter((i) => i.status === 'new').length,
                    tab: 'inquiries' as AdminTab,
                  },
                ].map((stat) => (
                  <button
                    key={stat.label}
                    type="button"
                    onClick={() => setActiveTab(stat.tab)}
                    className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 text-left transition-colors cursor-pointer"
                  >
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p className="font-display text-3xl font-bold text-[#0F172A] mt-1 tabular-nums">
                      {stat.value}
                    </p>
                  </button>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#2563EB]">Database Persistence Mode</p>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {data.backendMode === 'supabase'
                      ? 'Connected to Supabase PostgreSQL & Storage'
                      : 'Local Server Persistence Active (data/database.json)'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {data.backendMode === 'supabase'
                      ? 'All CRUD actions read and write directly to your Supabase tables.'
                      : 'Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment secrets anytime to switch to Supabase PostgreSQL.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="px-4 py-2 text-xs font-medium text-[#0F172A] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl whitespace-nowrap cursor-pointer"
                >
                  Edit Site Settings
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold text-[#0F172A]">
                    Recent Client Inquiries
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('inquiries')}
                    className="text-xs font-medium text-[#2563EB] hover:text-blue-700 cursor-pointer"
                  >
                    Manage All
                  </button>
                </div>

                {data.inquiries.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <p className="text-sm font-medium text-[#0F172A]">No client inquiries yet</p>
                    <p className="text-xs text-slate-500">
                      Submissions sent from the public /contact page will appear here immediately.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                        <tr>
                          <th className="px-6 py-3 font-medium">Client</th>
                          <th className="px-6 py-3 font-medium">Service</th>
                          <th className="px-6 py-3 font-medium">Budget</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                          <th className="px-6 py-3 font-medium text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.inquiries.slice(0, 5).map((inq) => (
                          <tr key={inq.id} className="hover:bg-slate-50/60">
                            <td className="px-6 py-3.5">
                              <p className="font-medium text-[#0F172A]">{inq.name}</p>
                              <p className="text-xs text-slate-500">{inq.email}</p>
                            </td>
                            <td className="px-6 py-3.5 text-slate-600">{inq.service_required}</td>
                            <td className="px-6 py-3.5 text-slate-600 tabular-nums">
                              {inq.budget_range}
                            </td>
                            <td className="px-6 py-3.5 text-xs font-medium text-[#2563EB]">
                              {INQUIRY_STATUS_LABELS[inq.status]}
                            </td>
                            <td className="px-6 py-3.5 text-right text-xs text-slate-500 tabular-nums">
                              {formatDateShort(inq.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* 2. PROJECTS */}
          {activeTab === 'projects' && data ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-slate-600">
                  Manage portfolio items, live preview URLs, and featured home page placements.
                </p>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add Project
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[4/3] bg-slate-100">
                      <MediaImage
                        src={project.image_url}
                        alt={project.title}
                        title={project.title}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="text-[#2563EB] font-medium">{project.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{project.is_published ? 'Published' : 'Draft'}</span>
                          {project.is_featured ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Featured</span>
                            </>
                          ) : null}
                        </div>
                        <h3 className="font-display font-semibold text-[#0F172A]">
                          {project.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2">{project.summary}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setEditingProject(project)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F172A] hover:text-[#2563EB] cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingDelete({
                              label: project.title,
                              endpoint: `/api/admin/projects?id=${encodeURIComponent(project.id)}`,
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* 3. SERVICES */}
          {activeTab === 'services' && data ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-slate-600">
                  Manage agency services, deliverables, and display ordering.
                </p>
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add Service
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                      <tr>
                        <th className="px-6 py-3 font-medium">Order</th>
                        <th className="px-6 py-3 font-medium">Service</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.services.map((service) => (
                        <tr key={service.id} className="hover:bg-slate-50/60">
                          <td className="px-6 py-4 font-mono text-xs text-slate-500 tabular-nums">
                            {service.display_order}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-[#0F172A]">{service.title}</p>
                            <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                              {service.short_description}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-[#2563EB]">
                            {service.is_published ? 'Published' : 'Hidden'}
                          </td>
                          <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setEditingService(service)}
                              className="text-xs font-medium text-[#0F172A] hover:text-[#2563EB] cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingDelete({
                                  label: service.title,
                                  endpoint: `/api/admin/services?id=${encodeURIComponent(service.id)}`,
                                })
                              }
                              className="text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {/* 4. BLOG POSTS */}
          {activeTab === 'blog' && data ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-slate-600">
                  Publish insights, SEO guides, and agency updates.
                </p>
                <button
                  type="button"
                  onClick={() => setEditingBlog(null)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  New Article
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                      <tr>
                        <th className="px-6 py-3 font-medium">Title</th>
                        <th className="px-6 py-3 font-medium">Category</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Published</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.blog_posts.map((post) => (
                        <tr key={post.id} className="hover:bg-slate-50/60">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-[#0F172A]">{post.title}</p>
                            <p className="text-xs text-slate-500 line-clamp-1 max-w-md">
                              {post.excerpt}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600">{post.category}</td>
                          <td className="px-6 py-4 text-xs font-medium text-[#2563EB]">
                            {post.is_published ? 'Published' : 'Draft'}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 tabular-nums">
                            {formatDateShort(post.published_at)}
                          </td>
                          <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setEditingBlog(post)}
                              className="text-xs font-medium text-[#0F172A] hover:text-[#2563EB] cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingDelete({
                                  label: post.title,
                                  endpoint: `/api/admin/blog?id=${encodeURIComponent(post.id)}`,
                                })
                              }
                              className="text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {/* 5. TESTIMONIALS */}
          {activeTab === 'testimonials' && data ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-slate-600">
                  Replace placeholder items with verified client quotes and attributions.
                </p>
                <button
                  type="button"
                  onClick={() => setEditingTestimonial(null)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add Testimonial
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.testimonials.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{item.project_context || 'General'}</span>
                        <span>{item.is_published ? 'Published' : 'Hidden'}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">“{item.quote}”</p>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{item.client_name}</p>
                        <p className="text-xs text-slate-500">
                          {item.client_role} · {item.company}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingTestimonial(item)}
                          className="text-xs font-medium text-[#0F172A] hover:text-[#2563EB] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingDelete({
                              label: item.client_name,
                              endpoint: `/api/admin/testimonials?id=${encodeURIComponent(item.id)}`,
                            })
                          }
                          className="text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* 6. INQUIRIES */}
          {activeTab === 'inquiries' && data ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl">
                  {(['all', 'new', 'in_review', 'replied', 'archived'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setInquiryFilter(status)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        inquiryFilter === status
                          ? 'bg-white text-[#0F172A] shadow-xs'
                          : 'text-slate-600 hover:text-[#0F172A]'
                      }`}
                    >
                      {status === 'all' ? 'All' : INQUIRY_STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>

              {filteredInquiries.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
                  <p className="text-base font-semibold text-[#0F172A]">No inquiries in this view</p>
                  <p className="text-sm text-slate-500">
                    Test the contact form at /contact to see live leads arrive here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {filteredInquiries.map((inq) => (
                      <button
                        key={inq.id}
                        type="button"
                        onClick={() => {
                          setSelectedInquiry(inq);
                          setInquiryNotesDraft(inq.admin_notes || '');
                        }}
                        className={`w-full text-left p-5 hover:bg-slate-50 transition-colors cursor-pointer ${
                          selectedInquiry?.id === inq.id ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm text-[#0F172A]">{inq.name}</p>
                          <span className="text-xs font-medium text-[#2563EB]">
                            {INQUIRY_STATUS_LABELS[inq.status]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {inq.email} {inq.company ? `· ${inq.company}` : ''}
                        </p>
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                          {inq.service_required} · {inq.budget_range} — {inq.project_details}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                    {selectedInquiry ? (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-display text-lg font-bold text-[#0F172A]">
                              {selectedInquiry.name}
                            </h3>
                            <p className="text-xs text-slate-500">{selectedInquiry.email}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingDelete({
                                label: `Inquiry from ${selectedInquiry.name}`,
                                endpoint: `/api/admin/inquiries?id=${encodeURIComponent(selectedInquiry.id)}`,
                              })
                            }
                            className="text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <div>
                            <p className="text-slate-500">Company</p>
                            <p className="font-medium text-[#0F172A] mt-0.5">
                              {selectedInquiry.company || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Budget</p>
                            <p className="font-medium text-[#0F172A] mt-0.5 tabular-nums">
                              {selectedInquiry.budget_range}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-slate-500">Requested Service</p>
                            <p className="font-medium text-[#0F172A] mt-0.5">
                              {selectedInquiry.service_required}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-slate-600">Project Details</p>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                            {selectedInquiry.project_details}
                          </p>
                        </div>

                        <div className="space-y-2 pt-3 border-t border-slate-100">
                          <label className="block text-xs font-medium text-[#0F172A]">
                            Lead Status
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {(['new', 'in_review', 'replied', 'archived'] as InquiryStatus[]).map(
                              (st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    handleInquiryUpdate(selectedInquiry.id, st, inquiryNotesDraft)
                                  }
                                  className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                                    selectedInquiry.status === st
                                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  {INQUIRY_STATUS_LABELS[st]}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-[#0F172A]">
                            Internal Notes
                          </label>
                          <textarea
                            rows={3}
                            value={inquiryNotesDraft}
                            onChange={(e) => setInquiryNotesDraft(e.target.value)}
                            className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
                            placeholder="Follow-up notes, call summary..."
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleInquiryUpdate(
                                selectedInquiry.id,
                                selectedInquiry.status,
                                inquiryNotesDraft
                              )
                            }
                            className="min-h-[40px] px-4 py-2 text-xs font-medium text-white bg-[#0F172A] hover:bg-slate-800 rounded-xl cursor-pointer"
                          >
                            Save Notes
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500 py-8 text-center">
                        Select an inquiry on the left to inspect details and update status.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* 7. MEDIA LIBRARY */}
          {activeTab === 'media' && data ? (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="font-display text-base font-semibold text-[#0F172A]">
                    Upload Image Asset
                  </h2>
                  <p className="text-xs text-slate-500">
                    Supports PNG, JPEG, and WEBP up to 4 MB. Copy any URL to assign it to Projects
                    or Blog Posts.
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl cursor-pointer whitespace-nowrap">
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  {uploadingMedia ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleMediaUpload}
                    disabled={uploadingMedia}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.media.map((asset) => (
                  <div
                    key={asset.url}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[4/3] bg-slate-100">
                      <MediaImage
                        src={asset.url}
                        alt={asset.name}
                        title={asset.name}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-[#0F172A] truncate">{asset.name}</p>
                        <p className="text-xs text-slate-500 tabular-nums">
                          {asset.source} · {Math.round(asset.size / 1024)} KB
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(asset.url)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:text-blue-700 cursor-pointer"
                        >
                          {copiedUrl === asset.url ? (
                            <>
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                              Copy URL
                            </>
                          )}
                        </button>

                        {asset.source !== 'bundled' ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPendingDelete({
                                label: asset.name,
                                endpoint: `/api/admin/media?name=${encodeURIComponent(asset.name)}`,
                              })
                            }
                            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            Delete
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">Default Asset</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* 8. SITE SETTINGS */}
          {activeTab === 'settings' && settingsForm ? (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 max-w-3xl"
            >
              <div className="space-y-1">
                <h2 className="font-display text-xl font-bold text-[#0F172A]">
                  Global Website Settings
                </h2>
                <p className="text-xs text-slate-500">
                  Changes apply immediately across the Navbar, Hero, Contact page, and Footer.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#0F172A]">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.brand_name}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, brand_name: e.target.value })
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#0F172A]">Target Markets</label>
                  <input
                    type="text"
                    value={settingsForm.location_markets}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, location_markets: e.target.value })
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#0F172A]">
                    Primary Business Email
                  </label>
                  <input
                    type="email"
                    required
                    value={settingsForm.contact_email}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, contact_email: e.target.value })
                    }
                    placeholder="arafatdigitalservics@gmail.com"
                    className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#0F172A]">
                    Secondary Business Email
                  </label>
                  <input
                    type="email"
                    value={settingsForm.secondary_email}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, secondary_email: e.target.value })
                    }
                    placeholder="hossinmdarafat693@gmail.com"
                    className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0F172A]">Tagline / Hero Headline</label>
                <input
                  type="text"
                  required
                  value={settingsForm.tagline}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0F172A]">Agency Description</label>
                <textarea
                  rows={3}
                  value={settingsForm.description}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#0F172A]">
                    WhatsApp Number (international, e.g. +8801314821008)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.whatsapp_number}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })
                    }
                    placeholder="+8801314821008"
                    className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#0F172A]">
                    Phone / Local Number (e.g. 01314821008)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.phone_number}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, phone_number: e.target.value })
                    }
                    placeholder="01314821008"
                    className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h3 className="text-xs font-semibold text-slate-600">Social Media Links</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'linkedin_url', label: 'LinkedIn URL' },
                    { key: 'twitter_url', label: 'X / Twitter URL' },
                    { key: 'facebook_url', label: 'Facebook URL' },
                    { key: 'instagram_url', label: 'Instagram URL' },
                    { key: 'github_url', label: 'GitHub URL' },
                  ].map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-xs font-medium text-[#0F172A]">{field.label}</label>
                      <input
                        type="url"
                        value={settingsForm[field.key as keyof SiteSettings] as string}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            [field.key]: e.target.value,
                          })
                        }
                        placeholder="https://"
                        className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="min-h-[44px] w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 rounded-xl cursor-pointer"
                >
                  {savingSettings ? 'Saving Settings...' : 'Save Website Settings'}
                </button>
              </div>
            </form>
          ) : null}
        </main>
      </div>

      {/* CRUD Modals */}
      {editingService !== undefined && token ? (
        <ServiceEditorModal
          initial={editingService}
          token={token}
          onClose={() => setEditingService(undefined)}
          onSaved={() => {
            setEditingService(undefined);
            showToast('Service saved.');
            fetchOverview(token);
          }}
        />
      ) : null}

      {editingProject !== undefined && token && data ? (
        <ProjectEditorModal
          initial={editingProject}
          media={data.media}
          token={token}
          onClose={() => setEditingProject(undefined)}
          onSaved={() => {
            setEditingProject(undefined);
            showToast('Project saved.');
            fetchOverview(token);
          }}
        />
      ) : null}

      {editingBlog !== undefined && token && data ? (
        <BlogEditorModal
          initial={editingBlog}
          media={data.media}
          token={token}
          onClose={() => setEditingBlog(undefined)}
          onSaved={() => {
            setEditingBlog(undefined);
            showToast('Blog post saved.');
            fetchOverview(token);
          }}
        />
      ) : null}

      {editingTestimonial !== undefined && token ? (
        <TestimonialEditorModal
          initial={editingTestimonial}
          token={token}
          onClose={() => setEditingTestimonial(undefined)}
          onSaved={() => {
            setEditingTestimonial(undefined);
            showToast('Testimonial saved.');
            fetchOverview(token);
          }}
        />
      ) : null}

      {/* Delete Confirmation Dialog */}
      {pendingDelete ? (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-[#0F172A]">Confirm Deletion</h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to permanently remove{' '}
              <span className="font-semibold text-[#0F172A]">{pendingDelete.label}</span>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
