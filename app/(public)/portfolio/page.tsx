import type { Metadata } from 'next';
import { PortfolioClient } from '@/components/PortfolioClient';
import { getPublicSiteData } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Portfolio – Arafat Digital Services',
  description:
    'Explore web platforms, UI/UX design systems, performance marketing, and business automation projects.',
};

export default async function PortfolioPage() {
  const { projects } = await getPublicSiteData();

  return (
    <div className="bg-[#F8FAFC]">
      <section className="bg-white border-b border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
          <p className="text-sm font-medium text-[#2563EB]">Portfolio</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0F172A] max-w-3xl text-balance">
            Digital systems, interfaces, and growth builds
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Filter by discipline to inspect project summaries, deliverables, and live previews. New
            case studies can be added anytime from the Admin Dashboard.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <PortfolioClient projects={projects} />
        </div>
      </section>
    </div>
  );
}
