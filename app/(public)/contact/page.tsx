import type { Metadata } from 'next';
import { ContactFormClient } from '@/components/ContactFormClient';
import { getPublicSiteData } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contact Us – Arafat Digital Services',
  description:
    'Start a project with Arafat Digital Services. Request a consultation for web development, UI/UX, ads, SEO, or automation.',
};

interface ContactPageProps {
  searchParams: Promise<{ service?: string }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { service } = await searchParams;
  const { services, site_settings } = await getPublicSiteData();

  return (
    <div className="bg-[#F8FAFC]">
      <section className="bg-white border-b border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
          <p className="text-sm font-medium text-[#2563EB]">Contact Us</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0F172A] max-w-3xl text-balance">
            Start a project with {site_settings.brand_name}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Tell us about your project requirements, budget range, and target markets. Every
            submission is stored securely and reviewed directly in our Admin Dashboard.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ContactFormClient
            services={services}
            settings={site_settings}
            initialService={service || ''}
          />
        </div>
      </section>
    </div>
  );
}
