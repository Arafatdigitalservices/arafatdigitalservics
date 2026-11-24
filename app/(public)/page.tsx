import Link from 'next/link';
import { ArrowRight, Check, ExternalLink, Globe2, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { MediaImage } from '@/components/MediaImage';
import { SmoothAppear } from '@/components/MotionPrimitives';
import { ServiceIcon } from '@/components/ServiceIcon';
import { getPublicSiteData } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Discovery & Technical Audit',
    description:
      'We evaluate your current digital footprint, target customer segments across international markets, and conversion bottlenecks before writing a single line of code.',
  },
  {
    step: '02',
    title: 'Strategy & System Architecture',
    description:
      'We define site architecture, UI/UX wireframes, paid acquisition structure, and automation workflows aligned with measurable business goals.',
  },
  {
    step: '03',
    title: 'Design, Engineering & Tracking',
    description:
      'Our team builds responsive interfaces, clean TypeScript/Next.js applications, PostgreSQL data models, and verified analytics attribution.',
  },
  {
    step: '04',
    title: 'Launch, Optimization & Support',
    description:
      'After rigorous security and performance testing, we deploy to production and continuously refine campaigns, SEO, and automated pipelines.',
  },
];

const WHY_CHOOSE_US = [
  {
    icon: Globe2,
    title: 'Built for International Standards',
    description:
      'Interfaces, messaging, and technical infrastructure tailored for buyers in the USA, UK, Europe, Canada, Australia, and worldwide.',
  },
  {
    icon: Zap,
    title: 'Performance & Clean Engineering',
    description:
      'Modern Next.js and PostgreSQL architectures engineered for fast page loads, strong Core Web Vitals, and long-term maintainability.',
  },
  {
    icon: ShieldCheck,
    title: 'Security & Data Integrity First',
    description:
      'Every form, admin control, and database mutation enforces strict server-side validation, role protection, and Row Level Security.',
  },
  {
    icon: Sparkles,
    title: 'Unified Growth & Automation',
    description:
      'Instead of disconnected freelancers, your website, UI/UX, paid ads, SEO, and CRM automation work together as one measurable system.',
  },
];

export default async function HomePage() {
  const data = await getPublicSiteData();
  const { services, projects, testimonials, site_settings } = data;
  const featuredProjects = projects.filter((p) => p.is_featured).slice(0, 3);
  const displayProjects = featuredProjects.length > 0 ? featuredProjects : projects.slice(0, 3);

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section className="relative bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <SmoothAppear className="lg:col-span-6 flex flex-col justify-center space-y-5 sm:space-y-6">
              <p className="text-xs sm:text-sm font-medium text-[#2563EB] tracking-wide">
                International Digital Agency · {site_settings.location_markets}
              </p>

              <h1 className="font-display text-[1.875rem] sm:text-4xl lg:text-[3.35rem] font-bold tracking-tight text-[#0F172A] leading-[1.15] lg:leading-[1.1] text-balance">
                {site_settings.tagline}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                {site_settings.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                <Link
                  href="/contact"
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB]"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>

                <Link
                  href="/services"
                  className="min-h-[44px] inline-flex items-center justify-center px-5 py-3 text-sm font-medium text-[#0F172A] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  Explore Services
                </Link>
              </div>
            </SmoothAppear>

            <SmoothAppear delay={0.08} className="lg:col-span-6 flex">
              <div className="relative w-full min-h-[280px] sm:min-h-[360px] lg:min-h-[440px] rounded-2xl overflow-hidden border border-slate-200 bg-[#0F172A]">
                <MediaImage
                  src="/images/hero_agency_studio.jpg"
                  alt="Arafat Digital Services architectural agency workspace"
                  title={site_settings.brand_name}
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/85 via-[#0F172A]/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5 p-4 sm:p-5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
                  <p className="text-xs font-medium text-[#38BDF8]">
                    Full-Stack Web, Performance Ads & Automation
                  </p>
                  <p className="text-sm sm:text-base font-medium text-white mt-1 leading-snug">
                    Engineering fast digital platforms and measurable acquisition systems for global teams.
                  </p>
                </div>
              </div>
            </SmoothAppear>
          </div>
        </div>
      </section>

      {/* 2. OUR SERVICES */}
      <section className="py-16 sm:py-20 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <p className="text-sm font-medium text-[#2563EB]">Our Services</p>
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0F172A] text-balance">
                End-to-end digital capabilities under one roof
              </h2>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 py-2 text-sm font-medium text-[#2563EB] hover:text-blue-700 whitespace-nowrap shrink-0"
            >
              View All Services
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div
                key={service.id}
                className={`bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-colors hover:border-blue-300 ${
                  index === 0 ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                      <ServiceIcon name={service.icon_name} className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-display text-xl font-semibold text-[#0F172A]">
                      {service.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {service.short_description}
                    </p>
                  </div>

                  {service.features.length > 0 ? (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {service.features.slice(0, 4).map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-xs text-slate-600">
                          <Check
                            className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link
                    href={`/contact?service=${encodeURIComponent(service.title)}`}
                    className="inline-flex items-center gap-1.5 py-1 text-sm font-medium text-[#0F172A] hover:text-[#2563EB] transition-colors"
                  >
                    Inquire about {service.title}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED PROJECTS */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <p className="text-sm font-medium text-[#2563EB]">Featured Projects</p>
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0F172A] text-balance">
                Selected architecture & digital showcases
              </h2>
              <p className="text-sm text-slate-600">
                All project showcases, client details, and live URLs are dynamically managed from the Admin Dashboard.
              </p>
            </div>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-1.5 py-2 text-sm font-medium text-[#2563EB] hover:text-blue-700 whitespace-nowrap shrink-0"
            >
              Browse Portfolio
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayProjects.map((project) => (
              <article
                key={project.id}
                className="group bg-[#F8FAFC] border border-slate-200 rounded-2xl overflow-hidden flex flex-col"
              >
                <Link
                  href={`/portfolio/${project.slug}`}
                  className="block aspect-[4/3] overflow-hidden bg-slate-100"
                >
                  <MediaImage
                    src={project.image_url}
                    alt={project.title}
                    title={project.title}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </Link>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4 bg-white">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-[#2563EB]">{project.category}</span>
                      {project.client_name ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{project.client_name}</span>
                        </>
                      ) : null}
                    </div>
                    <h3 className="font-display text-lg font-semibold text-[#0F172A]">
                      <Link
                        href={`/portfolio/${project.slug}`}
                        className="hover:text-[#2563EB] transition-colors"
                      >
                        {project.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {project.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                    <Link
                      href={`/portfolio/${project.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0F172A] hover:text-[#2563EB]"
                    >
                      Case Study
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    {project.live_url ? (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:text-blue-700"
                      >
                        Live Preview
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE US */}
      <section className="py-20 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium text-[#2563EB]">Why Choose Us</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] text-balance">
              Built on technical discipline and transparent execution
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {WHY_CHOOSE_US.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white border border-slate-200 rounded-2xl p-7 flex items-start gap-5"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-display text-lg font-semibold text-[#0F172A]">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. OUR WORKING PROCESS */}
      <section className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium text-[#2563EB]">Our Working Process</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] text-balance">
              A structured delivery workflow from discovery to scale
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((item) => (
              <div
                key={item.step}
                className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 space-y-4"
              >
                <span className="font-mono text-sm font-semibold text-[#2563EB] tabular-nums">
                  {item.step}.
                </span>
                <h3 className="font-display text-lg font-semibold text-[#0F172A]">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="py-20 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3 max-w-2xl">
              <p className="text-sm font-medium text-[#2563EB]">Client Feedback</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] text-balance">
                Client testimonials & partner perspectives
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Editable in Admin Dashboard → Testimonials
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((item) => (
              <blockquote
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between space-y-6"
              >
                <p className="text-base text-slate-700 leading-relaxed">“{item.quote}”</p>
                <footer className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-sm font-semibold text-[#0F172A]">
                      {item.client_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.client_role} · {item.company}
                    </p>
                  </div>
                  {item.project_context ? (
                    <span className="text-xs text-[#2563EB] font-medium">
                      {item.project_context}
                    </span>
                  ) : null}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CONTACT CTA */}
      <section className="py-20 bg-[#0F172A] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <p className="text-sm font-medium text-[#38BDF8]">
            Ready to launch or scale your digital presence?
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
            Let’s build your next web platform, marketing funnel, or automation system.
          </h2>
          <p className="text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Partner with {site_settings.brand_name} for transparent scoping, direct communication,
            and production-grade execution across {site_settings.location_markets}.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-500 rounded-xl transition-colors whitespace-nowrap"
            >
              Get Started Now
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            {site_settings.whatsapp_number ? (
              <a
                href={`https://wa.me/${site_settings.whatsapp_number.replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-medium text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-colors whitespace-nowrap"
              >
                Chat on WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
