import type { Metadata } from 'next';
import { BlogClient } from '@/components/BlogClient';
import { getPublicSiteData } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog & Insights – Arafat Digital Services',
  description:
    'Articles and practical guides on web engineering, UI/UX design, paid ads, SEO, and business automation.',
};

export default async function BlogPage() {
  const { blog_posts } = await getPublicSiteData();

  return (
    <div className="bg-[#F8FAFC]">
      <section className="bg-white border-b border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
          <p className="text-sm font-medium text-[#2563EB]">Blog & Insights</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0F172A] max-w-3xl text-balance">
            Practical insights on web engineering, acquisition, and automation
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Search articles by topic or filter by category. Publish, edit, or archive posts directly
            from your Admin Dashboard.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <BlogClient posts={blog_posts} />
        </div>
      </section>
    </div>
  );
}
