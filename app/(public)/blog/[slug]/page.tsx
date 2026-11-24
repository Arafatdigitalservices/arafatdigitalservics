import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { MediaImage } from '@/components/MediaImage';
import { getPublicSiteData } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

interface BlogDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const { blog_posts } = await getPublicSiteData();
  const post = blog_posts.find((p) => p.slug === slug);
  if (!post) {
    return { title: 'Article Not Found – Arafat Digital Services' };
  }
  return {
    title: `${post.title} – Arafat Digital Services`,
    description: post.excerpt,
  };
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const { slug } = await params;
  const { blog_posts } = await getPublicSiteData();
  const post = blog_posts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const paragraphs = post.content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article className="bg-[#F8FAFC] py-12 lg:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Blog
          </Link>
        </div>

        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-[#2563EB]">{post.category}</span>
            <span aria-hidden="true">·</span>
            <span>{formatDate(post.published_at)}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{post.read_time_minutes} min read</span>
            <span aria-hidden="true">·</span>
            <span>By {post.author_name}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-[#0F172A] leading-tight text-balance">
            {post.title}
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed">{post.excerpt}</p>
        </header>

        {post.cover_image_url ? (
          <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 bg-white">
            <MediaImage
              src={post.cover_image_url}
              alt={post.title}
              title={post.title}
              sizes="(max-width: 768px) 100vw, 768px"
              priority
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}

        <div className="bg-white border border-slate-200 rounded-2xl p-7 sm:p-10 space-y-5">
          {paragraphs.map((para, idx) => (
            <p key={idx} className="text-base text-slate-700 leading-[1.75]">
              {para}
            </p>
          ))}
        </div>

        <div className="bg-[#0F172A] text-white rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold">Need help implementing this?</h2>
            <p className="text-sm text-slate-300">
              Talk with Arafat Digital Services about your website, ads, or automation roadmap.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-500 rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            Get Started
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
