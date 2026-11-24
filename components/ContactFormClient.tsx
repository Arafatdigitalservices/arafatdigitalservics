'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2, Mail, MessageSquare, Phone, Send } from 'lucide-react';
import type { ServiceItem, SiteSettings } from '@/lib/types';

interface ContactFormClientProps {
  services: ServiceItem[];
  settings: SiteSettings;
  initialService?: string;
}

const BUDGET_OPTIONS = [
  'Under $2,500',
  '$2,500 – $5,000',
  '$5,000 – $15,000',
  '$15,000 – $35,000',
  '$35,000+',
  'Ongoing Monthly Retainer',
];

export function ContactFormClient({
  services,
  settings,
  initialService = '',
}: ContactFormClientProps) {
  const defaultService =
    services.find((s) => s.title.toLowerCase() === initialService.toLowerCase() || s.slug === initialService)
      ?.title ||
    services[0]?.title ||
    'Website Development';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [serviceRequired, setServiceRequired] = useState(defaultService);
  const [budgetRange, setBudgetRange] = useState(BUDGET_OPTIONS[1]);
  const [projectDetails, setProjectDetails] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setFieldErrors({});

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          company,
          service_required: serviceRequired,
          budget_range: budgetRange,
          project_details: projectDetails,
        }),
      });

      const data = (await res.json()) as {
        id?: string;
        error?: string;
        fieldErrors?: Record<string, string>;
      };

      if (!res.ok) {
        setErrorMsg(data.error || 'Please check the form fields and try again.');
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        return;
      }

      setSubmittedId(data.id || 'submitted');
      setName('');
      setEmail('');
      setCompany('');
      setProjectDetails('');
    } catch {
      setErrorMsg('Network error while sending your inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const socialLinks = [
    { label: 'LinkedIn', href: settings.linkedin_url },
    { label: 'X / Twitter', href: settings.twitter_url },
    { label: 'Facebook', href: settings.facebook_url },
    { label: 'Instagram', href: settings.instagram_url },
    { label: 'GitHub', href: settings.github_url },
  ].filter((item) => Boolean(item.href));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-10">
        {submittedId ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="font-display text-2xl font-bold text-[#0F172A]">
              Project Inquiry Received
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you for reaching out to {settings.brand_name}. Your brief has been saved securely
              and our team will review it within one business day.
            </p>
            <button
              type="button"
              onClick={() => setSubmittedId(null)}
              className="min-h-[44px] inline-flex items-center px-4 py-2.5 text-sm font-medium text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              Submit Another Inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-bold text-[#0F172A]">
                Request a Consultation
              </h2>
              <p className="text-sm text-slate-600">
                Share your goals, timeline, and service requirements.
              </p>
            </div>

            {errorMsg ? (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
              >
                {errorMsg}
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="block text-sm font-medium text-[#0F172A]">
                  Full Name *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
                {fieldErrors.name ? (
                  <p className="text-xs text-red-600">{fieldErrors.name}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-email" className="block text-sm font-medium text-[#0F172A]">
                  Work Email *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
                {fieldErrors.email ? (
                  <p className="text-xs text-red-600">{fieldErrors.email}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-company" className="block text-sm font-medium text-[#0F172A]">
                Company / Organization
              </label>
              <input
                id="contact-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name (optional)"
                className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="contact-service"
                  className="block text-sm font-medium text-[#0F172A]"
                >
                  Required Service *
                </label>
                <select
                  id="contact-service"
                  value={serviceRequired}
                  onChange={(e) => setServiceRequired(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.title}>
                      {service.title}
                    </option>
                  ))}
                  <option value="Full Digital Retainer / Multiple Services">
                    Multiple Services / Retainer
                  </option>
                </select>
                {fieldErrors.service_required ? (
                  <p className="text-xs text-red-600">{fieldErrors.service_required}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-budget" className="block text-sm font-medium text-[#0F172A]">
                  Estimated Budget Range *
                </label>
                <select
                  id="contact-budget"
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                >
                  {BUDGET_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {fieldErrors.budget_range ? (
                  <p className="text-xs text-red-600">{fieldErrors.budget_range}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-details" className="block text-sm font-medium text-[#0F172A]">
                Project Details *
              </label>
              <textarea
                id="contact-details"
                rows={5}
                required
                value={projectDetails}
                onChange={(e) => setProjectDetails(e.target.value)}
                placeholder="Tell us about your business, target market, current website or ad channels, and key objectives..."
                className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
              {fieldErrors.project_details ? (
                <p className="text-xs text-red-600">{fieldErrors.project_details}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              {submitting ? 'Sending Inquiry...' : 'Submit Project Inquiry'}
            </button>
          </form>
        )}
      </div>

      <aside className="lg:col-span-5 space-y-6">
        <div className="bg-[#0F172A] text-white rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="font-display text-xl font-semibold">Direct Communication</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Working across time zones in {settings.location_markets}. Reach out via email,
              phone, or WhatsApp for fast project scoping.
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800">
            {settings.contact_email ? (
              <a
                href={`mailto:${settings.contact_email}`}
                className="min-h-[44px] flex items-center gap-3 p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <Mail className="w-5 h-5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-300">Primary Business Email</p>
                  <p className="text-sm font-medium text-white break-all">
                    {settings.contact_email}
                  </p>
                </div>
              </a>
            ) : null}

            {settings.secondary_email ? (
              <a
                href={`mailto:${settings.secondary_email}`}
                className="min-h-[44px] flex items-center gap-3 p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <Mail className="w-5 h-5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-300">Direct Inquiry Email</p>
                  <p className="text-sm font-medium text-white break-all">
                    {settings.secondary_email}
                  </p>
                </div>
              </a>
            ) : null}

            {settings.phone_number ? (
              <a
                href={`tel:${settings.phone_number.replace(/[^\d+]/g, '')}`}
                className="min-h-[44px] flex items-center gap-3 p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <Phone className="w-5 h-5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-slate-300">Phone / WhatsApp Local</p>
                  <p className="text-sm font-medium text-white tabular-nums">
                    {settings.phone_number}
                  </p>
                </div>
              </a>
            ) : null}

            {settings.whatsapp_number ? (
              <a
                href={`https://wa.me/${settings.whatsapp_number.replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-500 text-white text-sm font-medium transition-colors text-center"
              >
                <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Chat on WhatsApp ({settings.whatsapp_number})</span>
              </a>
            ) : null}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-base font-semibold text-[#0F172A]">
            Official Social Channels
          </h3>
          <div className="flex flex-wrap gap-2">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] inline-flex items-center px-3.5 py-2 text-xs font-medium text-[#0F172A] bg-slate-50 hover:bg-blue-50 hover:text-[#2563EB] border border-slate-200 rounded-lg transition-colors"
              >
                {social.label}
              </a>
            ))}
          </div>
          <p className="text-xs text-slate-600">
            Email addresses, phone, WhatsApp, and social URLs can be updated anytime in Site Settings.
          </p>
        </div>
      </aside>
    </div>
  );
}
