import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { ServiceIcon } from '@/components/ServiceIcon';
import { getPublicSiteData } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Services – Arafat Digital Services',
  description:
    'Website Development, UI/UX Design, Google Ads, Facebook Ads, Social Media Marketing, SEO Services, and Business Automation.',
};

export default async function ServicesPage() {
  const { services } = await getPublicSiteData();

  return (
    <div className="bg-[#F8FAFC]">
      <section className="bg-white border-b border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
          <p className="text-sm font-medium text-[#2563EB]">Capabilities</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0F172A] max-w-3xl text-balance">
            Digital services engineered for growth and operational clarity
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Every capability below is structured around measurable deliverables and clean handoffs.
            Select any service to request a tailored project scope.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          {services.map((service, index) => (
            <article
              key={service.id}
              id={service.slug}
              className="bg-white border border-slate-200 rounded-2xl p-7 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-24"
            >
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                    <ServiceIcon name={service.icon_name} className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs text-slate-500 tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A]">
                  {service.title}
                </h2>
                <p className="text-base text-slate-600 leading-relaxed">
                  {service.full_description || service.short_description}
                </p>

                <div className="pt-2">
                  <Link
                    href={`/contact?service=${encodeURIComponent(service.title)}`}
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl transition-colors whitespace-nowrap"
                  >
                    Request {service.title}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#F8FAFC] border border-slate-200 rounded-xl p-6 space-y-3">
                <h3 className="text-xs font-semibold tracking-wide text-slate-500">
                  Included Scope & Deliverables
                </h3>
                {service.features.length > 0 ? (
                  <ul className="space-y-3">
                    {service.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-sm text-[#0F172A]">
                        <Check
                          className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-600">
                    Custom deliverables tailored to your requirements.
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
