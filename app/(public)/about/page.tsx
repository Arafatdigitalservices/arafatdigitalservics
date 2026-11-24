import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Globe2, Layers, ShieldCheck, Workflow } from 'lucide-react';
import { MediaImage } from '@/components/MediaImage';
import { getPublicSiteData } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About Us – Arafat Digital Services',
  description:
    'Learn about Arafat Digital Services, our mission, international expertise, and structured digital delivery process.',
};

const EXPERTISE_AREAS = [
  {
    icon: Globe2,
    title: 'Global Market Alignment',
    description:
      'We collaborate remotely with founders, marketing leaders, and operations teams across the USA, UK, Europe, Canada, Australia, and worldwide.',
  },
  {
    icon: Layers,
    title: 'Design-to-Engineering Precision',
    description:
      'Our UI/UX designers and Next.js developers work from unified component systems so production code matches design intent cleanly.',
  },
  {
    icon: Workflow,
    title: 'Connected Acquisition & Automation',
    description:
      'We bridge paid media (Google & Meta Ads), organic SEO, and CRM workflow automation so leads convert without manual handoff delays.',
  },
  {
    icon: ShieldCheck,
    title: 'Security & Ownership',
    description:
      'Clean repositories, documented schemas, environment-isolated secrets, and full client ownership of source code and ad accounts.',
  },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Discovery & Scope Definition',
    description:
      'We review your business objectives, competitive landscape, technical stack, and target audience to produce a clear project roadmap.',
  },
  {
    step: '02',
    title: 'Architecture & Wireframing',
    description:
      'We map user flows, database schemas, URL structures, and paid/organic tracking plans before visual production begins.',
  },
  {
    step: '03',
    title: 'Iterative Build & QA',
    description:
      'Weekly milestone reviews covering responsive UI, backend APIs, validation, accessibility contrast, and cross-device performance.',
  },
  {
    step: '04',
    title: 'Deployment & Handover',
    description:
      'Production rollout with documented admin workflows, analytics verification, and ongoing optimization support.',
  },
];

export default async function AboutPage() {
  const { site_settings } = await getPublicSiteData();

  return (
    <div className="bg-[#F8FAFC]">
      <section className="bg-white border-b border-slate-200 py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <p className="text-sm font-medium text-[#2563EB]">About {site_settings.brand_name}</p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0F172A] text-balance">
              An international digital agency built for modern businesses.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              {site_settings.description}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              From early-stage ventures launching their first digital flagship to established
              service organizations modernizing lead generation and internal automation, we bring
              software engineering discipline and performance marketing together.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
              <MediaImage
                src="/images/hero_agency_studio.jpg"
                alt="Arafat Digital Services studio"
                title={site_settings.brand_name}
                sizes="(max-width: 1024px) 100vw, 42vw"
                priority
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-3">
            <p className="text-xs font-semibold tracking-wide text-[#2563EB]">Our Mission</p>
            <h2 className="font-display text-2xl font-bold text-[#0F172A]">
              Deliver reliable, measurable digital infrastructure
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              To empower businesses across global markets with fast, accessible web platforms,
              disciplined paid and organic acquisition, and practical automation that saves team
              hours every week.
            </p>
          </div>

          <div className="bg-[#0F172A] text-white rounded-2xl p-8 space-y-3">
            <p className="text-xs font-semibold tracking-wide text-[#38BDF8]">Our Vision</p>
            <h2 className="font-display text-2xl font-bold text-white">
              A trusted long-term technology and growth partner
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              To replace fragmented agency handoffs and bloated templates with transparent
              engineering, honest reporting, and scalable digital systems built for long-term
              ownership.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium text-[#2563EB]">Our Expertise</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#0F172A]">
              Where engineering meets acquisition
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {EXPERTISE_AREAS.map((area) => {
              const Icon = area.icon;
              return (
                <div
                  key={area.title}
                  className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-7 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#2563EB] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-display text-lg font-semibold text-[#0F172A]">
                      {area.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{area.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-medium text-[#2563EB]">Our Working Process</p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#0F172A]">
                How we collaborate with international teams
              </h2>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl transition-colors whitespace-nowrap w-fit"
            >
              Start a Conversation
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW_STEPS.map((step) => (
              <div key={step.step} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                <span className="font-mono text-sm font-semibold text-[#2563EB] tabular-nums">
                  {step.step}.
                </span>
                <h3 className="font-display text-lg font-semibold text-[#0F172A]">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
