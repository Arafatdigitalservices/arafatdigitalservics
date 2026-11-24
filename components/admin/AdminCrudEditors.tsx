'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type {
  BlogPostItem,
  MediaAsset,
  ProjectItem,
  ServiceItem,
  TestimonialItem,
} from '@/lib/types';

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function ModalShell({ title, onClose, children }: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-[#0F172A]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

const SERVICE_ICONS = [
  'Code2',
  'Layers',
  'Target',
  'Megaphone',
  'Share2',
  'Search',
  'Workflow',
  'Globe',
  'ShieldCheck',
];

export function ServiceEditorModal({
  initial,
  token,
  onClose,
  onSaved,
}: {
  initial: ServiceItem | null;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [shortDesc, setShortDesc] = useState(initial?.short_description || '');
  const [fullDesc, setFullDesc] = useState(initial?.full_description || '');
  const [iconName, setIconName] = useState(initial?.icon_name || 'Code2');
  const [featuresText, setFeaturesText] = useState((initial?.features || []).join('\n'));
  const [displayOrder, setDisplayOrder] = useState(String(initial?.display_order || 1));
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/services', {
        method: initial ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: initial?.id,
          title,
          slug,
          short_description: shortDesc,
          full_description: fullDesc,
          icon_name: iconName,
          features: featuresText,
          display_order: Number(displayOrder) || 1,
          is_published: isPublished,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Failed to save service.');
        return;
      }
      onSaved();
    } catch {
      setError('Network error while saving service.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={initial ? 'Edit Service' : 'Add New Service'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Service Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">URL Slug (auto if blank)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="website-development"
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Icon</label>
            <select
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl bg-white"
            >
              {SERVICE_ICONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Display Order</label>
            <input
              type="number"
              min={1}
              max={999}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl tabular-nums"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#0F172A]">Short Description *</label>
          <textarea
            rows={2}
            required
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#0F172A]">Full Description</label>
          <textarea
            rows={3}
            value={fullDesc}
            onChange={(e) => setFullDesc(e.target.value)}
            className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#0F172A]">
            Deliverables / Features (one per line)
          </label>
          <textarea
            rows={4}
            value={featuresText}
            onChange={(e) => setFeaturesText(e.target.value)}
            placeholder="Custom Next.js architecture&#10;PostgreSQL database setup"
            className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[#0F172A] cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="rounded border-slate-300"
          />
          Published on public website
        </label>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 rounded-xl cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Service'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function ProjectEditorModal({
  initial,
  media,
  token,
  onClose,
  onSaved,
}: {
  initial: ProjectItem | null;
  media: MediaAsset[];
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [category, setCategory] = useState(initial?.category || 'Website Development');
  const [clientName, setClientName] = useState(initial?.client_name || '');
  const [summary, setSummary] = useState(initial?.summary || '');
  const [challenge, setChallenge] = useState(initial?.challenge || '');
  const [solution, setSolution] = useState(initial?.solution || '');
  const [deliverablesText, setDeliverablesText] = useState(
    (initial?.deliverables || []).join('\n')
  );
  const [metricsNote, setMetricsNote] = useState(initial?.metrics_note || '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url || media[0]?.url || '');
  const [liveUrl, setLiveUrl] = useState(initial?.live_url || '');
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? true);
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/projects', {
        method: initial ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: initial?.id,
          title,
          slug,
          category,
          client_name: clientName,
          summary,
          challenge,
          solution,
          deliverables: deliverablesText,
          metrics_note: metricsNote,
          image_url: imageUrl,
          live_url: liveUrl,
          is_featured: isFeatured,
          is_published: isPublished,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Failed to save project.');
        return;
      }
      onSaved();
    } catch {
      setError('Network error while saving project.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={initial ? 'Edit Project' : 'Add New Project'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Project Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Category *</label>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Website Development"
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Client Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">URL Slug (auto if blank)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#0F172A]">Summary *</label>
          <textarea
            rows={2}
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Challenge</label>
            <textarea
              rows={3}
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Solution</label>
            <textarea
              rows={3}
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Cover Image URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/images/project_web_platform.jpg"
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
            />
            {media.length > 0 ? (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) setImageUrl(e.target.value);
                }}
                className="w-full mt-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50"
              >
                <option value="">Or pick from Media Library...</option>
                {media.map((m) => (
                  <option key={m.url} value={m.url}>
                    {m.name} ({m.source})
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Live Preview URL (https://)</label>
            <input
              type="url"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Deliverables (one per line)</label>
            <textarea
              rows={3}
              value={deliverablesText}
              onChange={(e) => setDeliverablesText(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Outcome / Metrics Note</label>
            <textarea
              rows={3}
              value={metricsNote}
              onChange={(e) => setMetricsNote(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-[#0F172A] cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded border-slate-300"
            />
            Featured on Home Page
          </label>
          <label className="flex items-center gap-2 text-sm text-[#0F172A] cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-slate-300"
            />
            Published
          </label>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 rounded-xl cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function BlogEditorModal({
  initial,
  media,
  token,
  onClose,
  onSaved,
}: {
  initial: BlogPostItem | null;
  media: MediaAsset[];
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [category, setCategory] = useState(initial?.category || 'Website Development');
  const [authorName, setAuthorName] = useState(initial?.author_name || 'Arafat Digital Team');
  const [excerpt, setExcerpt] = useState(initial?.excerpt || '');
  const [content, setContent] = useState(initial?.content || '');
  const [coverImageUrl, setCoverImageUrl] = useState(
    initial?.cover_image_url || media[0]?.url || ''
  );
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/blog', {
        method: initial ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: initial?.id,
          title,
          slug,
          category,
          author_name: authorName,
          excerpt,
          content,
          cover_image_url: coverImageUrl,
          is_published: isPublished,
          published_at: initial?.published_at,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Failed to save article.');
        return;
      }
      onSaved();
    } catch {
      setError('Network error while saving article.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={initial ? 'Edit Blog Post' : 'Write New Blog Post'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#0F172A]">Article Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Category *</label>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Author</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Slug (auto if blank)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#0F172A]">Cover Image URL</label>
          <input
            type="text"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
          />
          {media.length > 0 ? (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) setCoverImageUrl(e.target.value);
              }}
              className="w-full mt-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50"
            >
              <option value="">Or pick from Media Library...</option>
              {media.map((m) => (
                <option key={m.url} value={m.url}>
                  {m.name} ({m.source})
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#0F172A]">Excerpt *</label>
          <textarea
            rows={2}
            required
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#0F172A]">
            Article Content * (separate paragraphs with a blank line)
          </label>
          <textarea
            rows={7}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[#0F172A] cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="rounded border-slate-300"
          />
          Published on Blog
        </label>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 rounded-xl cursor-pointer"
          >
            {saving ? 'Saving...' : 'Publish Post'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function TestimonialEditorModal({
  initial,
  token,
  onClose,
  onSaved,
}: {
  initial: TestimonialItem | null;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [clientName, setClientName] = useState(initial?.client_name || '');
  const [clientRole, setClientRole] = useState(initial?.client_role || '');
  const [company, setCompany] = useState(initial?.company || '');
  const [projectContext, setProjectContext] = useState(initial?.project_context || '');
  const [quote, setQuote] = useState(initial?.quote || '');
  const [displayOrder, setDisplayOrder] = useState(String(initial?.display_order || 1));
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: initial ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: initial?.id,
          client_name: clientName,
          client_role: clientRole,
          company,
          project_context: projectContext,
          quote,
          display_order: Number(displayOrder) || 1,
          is_published: isPublished,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Failed to save testimonial.');
        return;
      }
      onSaved();
    } catch {
      setError('Network error while saving testimonial.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={initial ? 'Edit Testimonial' : 'Add Client Testimonial'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Client Name *</label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Role / Title</label>
            <input
              type="text"
              value={clientRole}
              onChange={(e) => setClientRole(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Service / Context</label>
            <input
              type="text"
              value={projectContext}
              onChange={(e) => setProjectContext(e.target.value)}
              placeholder="Website Development"
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#0F172A]">Testimonial Quote *</label>
          <textarea
            rows={4}
            required
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#0F172A]">Display Order</label>
            <input
              type="number"
              min={1}
              max={999}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl tabular-nums"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#0F172A] cursor-pointer pt-4">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-slate-300"
            />
            Published on Home Page
          </label>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 rounded-xl cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Testimonial'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
