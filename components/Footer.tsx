import Link from 'next/link';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import type { ServiceItem, SiteSettings } from '@/lib/types';

interface FooterProps {
  settings: SiteSettings;
  services: ServiceItem[];
}

export function Footer({ settings, services }: FooterProps) {
  const year = new Date().getFullYear();
  const waDigits = settings.whatsapp_number.replace(/[^\d]/g, '') || '8801314821008';
  const waDisplay = settings.whatsapp_number || '+8801314821008';
  const phoneDisplay = settings.phone_number || '01314821008';
  const phoneHref = `tel:${phoneDisplay.replace(/[^\d+]/g, '')}`;

  const socialLinks = [
    { label: 'LinkedIn', href: settings.linkedin_url },
    { label: 'X / Twitter', href: settings.twitter_url },
    { label: 'Facebook', href: settings.facebook_url },
    { label: 'Instagram', href: settings.instagram_url },
    { label: 'GitHub', href: settings.github_url },
  ].filter((item) => Boolean(item.href));

  return (
    <footer className="bg-[#0F172A] text-slate-200 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
          <div className="sm:col-span-2 lg:col-span-4 space-y-4">
            <Link
              href="/"
              className="font-display text-xl font-bold tracking-tight text-white inline-block"
            >
              {settings.brand_name}
            </Link>
            <p className="text-sm text-slate-200 leading-relaxed max-w-md">
              {settings.tagline}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md">
              Serving organizations across {settings.location_markets}.
            </p>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-xs font-semibold tracking-wide text-slate-100">
              Company
            </h2>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/about" className="inline-block py-1 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services" className="inline-block py-1 hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="inline-block py-1 hover:text-white transition-colors">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link href="/blog" className="inline-block py-1 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="inline-block py-1 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h2 className="text-xs font-semibold tracking-wide text-slate-100">
              Capabilities
            </h2>
            <ul className="space-y-2 text-sm text-slate-300">
              {services.slice(0, 7).map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/services#${service.slug}`}
                    className="inline-block py-1 hover:text-white transition-colors"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 space-y-3">
            <h2 className="text-xs font-semibold tracking-wide text-slate-100">
              Contact & Channels
            </h2>
            <ul className="space-y-2.5 text-sm text-slate-200">
              {settings.contact_email ? (
                <li>
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="inline-flex items-center gap-2 py-1 hover:text-white transition-colors break-all"
                  >
                    <Mail className="w-4 h-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
                    <span>{settings.contact_email}</span>
                  </a>
                </li>
              ) : null}

              {settings.secondary_email ? (
                <li>
                  <a
                    href={`mailto:${settings.secondary_email}`}
                    className="inline-flex items-center gap-2 py-1 hover:text-white transition-colors break-all"
                  >
                    <Mail className="w-4 h-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
                    <span>{settings.secondary_email}</span>
                  </a>
                </li>
              ) : null}

              {waDigits ? (
                <li>
                  <a
                    href={`https://wa.me/${waDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 py-1 text-[#38BDF8] hover:text-sky-200 transition-colors tabular-nums"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>WhatsApp: {waDisplay}</span>
                  </a>
                </li>
              ) : null}

              {phoneDisplay ? (
                <li>
                  <a
                    href={phoneHref}
                    className="inline-flex items-center gap-2 py-1 hover:text-white transition-colors tabular-nums"
                  >
                    <Phone className="w-4 h-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
                    <span>Phone: {phoneDisplay}</span>
                  </a>
                </li>
              ) : null}

              {socialLinks.length > 0 ? (
                <li className="pt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-300">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1 hover:text-white transition-colors"
                    >
                      {social.label}
                    </a>
                  ))}
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-300">
          <p>
            © {year} {settings.brand_name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/contact" className="py-1 hover:text-white transition-colors">
              Start a Project
            </Link>
            <Link href="/admin" className="py-1 hover:text-white transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
