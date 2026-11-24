'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, MessageCircle, X } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  brandName: string;
  whatsappNumber?: string;
}

const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/blog', label: 'Blog' },
  { href: '/admin', label: 'Admin' },
];

export function Navbar({ brandName, whatsappNumber = '+8801314821008' }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const waDigits = whatsappNumber.replace(/[^\d]/g, '') || '8801314821008';
  const waHref = `https://wa.me/${waDigits}`;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6 lg:gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <Link
          href="/"
          className="font-display text-base sm:text-lg font-bold tracking-tight text-[#0F172A] truncate max-w-[215px] sm:max-w-none whitespace-nowrap shrink-0 hover:text-[#2563EB] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-sm py-1"
        >
          {brandName}
        </Link>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-slate-600" aria-label="Primary">
          {NAV_LINKS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-xs ${
                  isActive
                    ? 'text-[#0F172A] border-[#2563EB]'
                    : 'border-transparent hover:text-[#0F172A] hover:border-slate-300'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: WhatsApp Shortcut + Contact Us Button + Mobile Menu Trigger */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp Direct"
            className="hidden sm:inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 text-xs font-medium text-[#0F172A] bg-slate-50 hover:bg-blue-50 hover:text-[#2563EB] border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
            <span>WhatsApp</span>
          </a>

          <Link
            href="/contact"
            className="hidden sm:inline-flex items-center justify-center min-h-[40px] px-4 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB]"
          >
            Contact Us
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 text-[#0F172A] hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] cursor-pointer"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-sm">
          <nav className="flex flex-col space-y-1" aria-label="Mobile Navigation">
            {NAV_LINKS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-[#2563EB]'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-[#0F172A]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#0F172A] bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
              WhatsApp
            </a>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="min-h-[44px] inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
