import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, ExternalLink } from 'lucide-react';
import { MediaImage } from '@/components/MediaImage';
import { getPublicSiteData } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

interface ProjectDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProjectDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const { projects } = await getPublicSiteData();
  const project = projects.find((p) => p.slug === slug);
  if (!project) {
    return { title: 'Project Not Found – Arafat Digital Services' };
  }
  return {
    title: `${project.title} – Arafat Digital Services`,
    description: project.summary,
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailProps) {
  const { slug } = await params;
  const { projects } = await getPublicSiteData();
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="bg-[#F8FAFC] py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
        <div>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Portfolio
          </Link>
        </div>

        <header className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-[#2563EB]">{project.category}</span>
            {project.client_name ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{project.client_name}</span>
              </>
            ) : null}
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0F172A] text-balance">
            {project.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
            {project.summary}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            {project.live_url ? (
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl transition-colors"
              >
                Open Live Preview
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            ) : null}
            <Link
              href={`/contact?service=${encodeURIComponent(project.category)}`}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#0F172A] bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
            >
              Request Similar Project
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 bg-white">
          <MediaImage
            src={project.image_url}
            alt={project.title}
            title={project.title}
            sizes="(max-width: 1024px) 100vw, 1024px"
            priority
            className="w-full h-full object-cover"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-7 space-y-3">
              <h2 className="font-display text-xl font-bold text-[#0F172A]">
                Challenge & Context
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                {project.challenge || 'Challenge details can be edited in Admin Dashboard -> Projects.'}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-7 space-y-3">
              <h2 className="font-display text-xl font-bold text-[#0F172A]">
                Architecture & Solution
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                {project.solution || 'Solution details can be edited in Admin Dashboard -> Projects.'}
              </p>
            </div>
          </div>

          <aside className="md:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-base font-semibold text-[#0F172A]">
                Deliverables
              </h3>
              {project.deliverables.length > 0 ? (
                <ul className="space-y-2.5">
                  {project.deliverables.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check
                        className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No deliverables listed yet.</p>
              )}
            </div>

            {project.metrics_note ? (
              <div className="bg-[#0F172A] text-white rounded-2xl p-6 space-y-2">
                <p className="text-xs font-medium text-[#38BDF8]">Outcome Note</p>
                <p className="text-sm text-slate-200 leading-relaxed">{project.metrics_note}</p>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
