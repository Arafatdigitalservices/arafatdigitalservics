import type { DatabaseSnapshot } from './types';

const nowIso = '2026-11-24T00:00:00.000Z';

export const DEFAULT_DATABASE_SNAPSHOT: DatabaseSnapshot = {
  profiles: [],
  site_settings: {
    id: 1,
    brand_name: 'Arafat Digital Services',
    tagline: 'Empowering Businesses with Modern Digital Solutions.',
    description:
      'International digital agency partnering with growth-focused organizations across the USA, UK, Europe, Canada, Australia, and worldwide to design, engineer, and scale high-performing digital systems.',
    contact_email: 'arafatdigitalservics@gmail.com',
    secondary_email: 'hossinmdarafat693@gmail.com',
    whatsapp_number: '+8801314821008',
    phone_number: '01314821008',
    location_markets: 'USA, UK, Europe, Canada, Australia & Worldwide',
    linkedin_url: 'https://linkedin.com',
    twitter_url: 'https://x.com',
    facebook_url: 'https://facebook.com',
    instagram_url: 'https://instagram.com',
    github_url: 'https://github.com',
    updated_at: nowIso,
  },
  services: [
    {
      id: '00000000-0000-4000-8000-000000000101',
      slug: 'website-development',
      title: 'Website Development',
      short_description:
        'Fast, accessible, SEO-ready web platforms and custom web applications engineered with Next.js, TypeScript, and modern cloud databases.',
      full_description:
        'We architect and build scalable marketing websites, SaaS platforms, client portals, and e-commerce storefronts designed for Core Web Vitals, maintainability, and conversion clarity.',
      icon_name: 'Code2',
      features: [
        'Custom Next.js & TypeScript architecture',
        'PostgreSQL & Supabase backend integration',
        'Mobile-first responsive layout & WCAG accessibility',
        'Technical SEO & structured data setup',
      ],
      display_order: 1,
      is_published: true,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: '00000000-0000-4000-8000-000000000102',
      slug: 'ui-ux-design',
      title: 'UI/UX Design',
      short_description:
        'Research-backed product interfaces, design systems, and high-converting user journeys tailored for clarity and trust.',
      full_description:
        'From wireframes and interactive prototypes to production-ready component libraries, we craft user interfaces that remove friction and strengthen brand authority across international markets.',
      icon_name: 'Layers',
      features: [
        'User journey mapping & information architecture',
        'Interactive prototypes & usability validation',
        'Reusable Tailwind & Figma component systems',
        'Conversion-focused landing page layouts',
      ],
      display_order: 2,
      is_published: true,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: '00000000-0000-4000-8000-000000000103',
      slug: 'google-ads',
      title: 'Google Ads',
      short_description:
        'Intent-driven Search, Display, and Performance Max campaigns structured around transparent conversion tracking and cost control.',
      full_description:
        'We build disciplined Google Ads account structures, clean keyword segmentation, server-side conversion tracking, and landing page alignment to capture high-intent demand.',
      icon_name: 'Target',
      features: [
        'Search & Performance Max campaign setup',
        'Negative keyword governance & bid hygiene',
        'GA4 & server-side conversion attribution',
        'Landing page message-match optimization',
      ],
      display_order: 3,
      is_published: true,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: '00000000-0000-4000-8000-000000000104',
      slug: 'facebook-ads',
      title: 'Facebook Ads',
      short_description:
        'Full-funnel Meta advertising systems combining creative testing frameworks with Meta Pixel and Conversions API tracking.',
      full_description:
        'We structure Meta (Facebook & Instagram) ad campaigns with systematic creative testing, audience segmentation, and reliable attribution to reach qualified buyers.',
      icon_name: 'Megaphone',
      features: [
        'Meta Pixel & Conversions API implementation',
        'Structured creative testing matrices',
        'Retargeting & lookalike funnel architecture',
        'Clear weekly spend & acquisition reporting',
      ],
      display_order: 4,
      is_published: true,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: '00000000-0000-4000-8000-000000000105',
      slug: 'social-media-marketing',
      title: 'Social Media Marketing',
      short_description:
        'Consistent, brand-aligned editorial calendars and multi-channel content workflows built for international B2B and B2C audiences.',
      full_description:
        'We establish repeatable content pillars, visual templates, and publishing rhythms across LinkedIn, Instagram, and X to build durable organic brand equity.',
      icon_name: 'Share2',
      features: [
        'Channel strategy & positioning guidelines',
        'Monthly content calendars & creative direction',
        'LinkedIn executive & brand presence',
        'Audience engagement & performance reviews',
      ],
      display_order: 5,
      is_published: true,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: '00000000-0000-4000-8000-000000000106',
      slug: 'seo-services',
      title: 'SEO Services',
      short_description:
        'Technical site audits, search-intent content architecture, and international SEO foundations built for compounding organic visibility.',
      full_description:
        'We diagnose crawlability bottlenecks, optimize site speed and schema markup, and develop topic-clustered content strategies targeted at competitive global markets.',
      icon_name: 'Search',
      features: [
        'Technical crawl & Core Web Vitals remediation',
        'Search-intent keyword & topic mapping',
        'On-page structure & Schema.org markup',
        'Regional targeting for US, UK, EU, CA & AU',
      ],
      display_order: 6,
      is_published: true,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: '00000000-0000-4000-8000-000000000107',
      slug: 'business-automation',
      title: 'Business Automation',
      short_description:
        'Custom CRM pipelines, lead routing, API integrations, and automated operational workflows that eliminate manual repetitive work.',
      full_description:
        'We connect your website forms, CRM, email marketing, invoicing, and internal notifications into reliable automated systems with clear audit trails.',
      icon_name: 'Workflow',
      features: [
        'Lead capture to CRM synchronization',
        'Webhook & third-party API integrations',
        'Automated client onboarding & notifications',
        'Custom internal dashboards & reporting pipelines',
      ],
      display_order: 7,
      is_published: true,
      created_at: nowIso,
      updated_at: nowIso,
    },
  ],
  projects: [
    {
      id: '00000000-0000-4000-8000-000000000201',
      slug: 'enterprise-web-platform-template',
      title: 'B2B Web Platform (Editable Showcase)',
      category: 'Website Development',
      client_name: 'Placeholder Client — Editable in Admin',
      summary:
        'Placeholder case study demonstrating our Next.js and PostgreSQL web engineering workflow. Replace this entry with your verified client project via the Admin Dashboard.',
      challenge:
        'Placeholder challenge description: Outline the client’s legacy performance bottlenecks, conversion friction, or manual content management issues here.',
      solution:
        'Placeholder solution overview: Document the custom Next.js architecture, database model, and responsive interface delivered for this project.',
      deliverables: [
        'Next.js App Router Platform',
        'Responsive Component System',
        'Database & CMS Integration',
        'Technical SEO Implementation',
      ],
      metrics_note: 'Editable placeholder — add verified client outcomes when published.',
      image_url: '/images/project_web_platform.jpg',
      live_url: '',
      is_featured: true,
      is_published: true,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: '00000000-0000-4000-8000-000000000202',
      slug: 'cross-platform-ui-ux-system-template',
      title: 'Multi-Device UI/UX Design System (Editable Showcase)',
      category: 'UI/UX Design',
      client_name: 'Placeholder Client — Editable in Admin',
      summary:
        'Placeholder UI/UX portfolio item showcasing responsive web and mobile design architecture. Edit title, client details, screenshots, and live URL in /admin.',
      challenge:
        'Placeholder challenge description: Describe fragmented user flows or inconsistent interface patterns across desktop and mobile screens.',
      solution:
        'Placeholder solution overview: Detail the unified design tokens, wireframe validation, and accessible component specifications created for engineering handoff.',
      deliverables: [
        'Information Architecture',
        'Figma Component Library',
        'Mobile & Desktop Prototypes',
        'Accessibility Contrast Audit',
      ],
      metrics_note: 'Editable placeholder — update with verified project results in Admin.',
      image_url: '/images/project_ux_mobile.jpg',
      live_url: '',
      is_featured: true,
      is_published: true,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: '00000000-0000-4000-8000-000000000203',
      slug: 'lead-capture-automation-pipeline-template',
      title: 'Acquisition & Workflow Automation (Editable Showcase)',
      category: 'Business Automation',
      client_name: 'Placeholder Client — Editable in Admin',
      summary:
        'Placeholder case study for paid acquisition tracking and automated CRM lead routing. Customize all fields, categories, and media in your Admin Dashboard.',
      challenge:
        'Placeholder challenge description: Highlight disconnected ad attribution, delayed lead follow-up, or manual spreadsheet handoffs.',
      solution:
        'Placeholder solution overview: Explain the automated inquiry capture, validation, CRM sync, and conversion tracking workflow built for the team.',
      deliverables: [
        'Paid Search & Meta Tracking Setup',
        'Automated Lead Routing',
        'CRM & Notification Sync',
        'Reporting Dashboard',
      ],
      metrics_note: 'Editable placeholder — add verified performance notes in Admin.',
      image_url: '/images/project_growth_automation.jpg',
      live_url: '',
      is_featured: true,
      is_published: true,
      created_at: nowIso,
      updated_at: nowIso,
    },
  ],
  blog_posts: [
    {
      id: '00000000-0000-4000-8000-000000000301',
      slug: 'modern-web-architecture-for-international-businesses',
      title: 'Structuring High-Speed Web Platforms for International Markets',
      category: 'Website Development',
      excerpt:
        'Key architectural decisions around server rendering, database security, and Core Web Vitals when serving users across North America, Europe, and APAC.',
      content:
        'Organizations operating across the USA, UK, Europe, Canada, and Australia face a common challenge: delivering consistently fast page loads while keeping dynamic business data secure.\n\nServer-rendered frameworks like Next.js paired with PostgreSQL allow public marketing pages to load rapidly while keeping administrative mutations and customer inquiries strictly validated on the server.\n\nWhen planning a digital rebuild, prioritize clean information architecture, accessible typography, predictable URL structures, and minimal third-party script bloat before layering visual motion.\n\nNote: This starter article can be edited, expanded, or replaced directly inside your Admin Dashboard under Blog Posts.',
      cover_image_url: '/images/project_web_platform.jpg',
      author_name: 'Arafat Digital Team',
      read_time_minutes: 4,
      is_published: true,
      published_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: '00000000-0000-4000-8000-000000000302',
      slug: 'clean-conversion-tracking-google-and-meta-ads',
      title: 'Why Clean Conversion Tracking Comes Before Scaling Google & Meta Ads',
      category: 'Paid Advertising',
      excerpt:
        'How proper event attribution, landing page alignment, and qualified lead filtering protect ad budgets before increasing spend.',
      content:
        'Increasing ad spend without reliable conversion signals amplifies wasted budget. Before launching or scaling Google Ads or Facebook Ads campaigns, every landing page and contact form should record clean, verified lead events.\n\nAligning ad copy directly with the landing page headline, keeping form fields focused on genuine qualification criteria (service needed, timeline, and budget range), and connecting inquiries to a structured admin review queue ensures sales teams respond quickly to high-intent prospects.\n\nNote: Manage or publish new articles anytime from /admin.',
      cover_image_url: '/images/project_growth_automation.jpg',
      author_name: 'Arafat Digital Team',
      read_time_minutes: 5,
      is_published: true,
      published_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: '00000000-0000-4000-8000-000000000303',
      slug: 'practical-business-automation-for-service-teams',
      title: 'Practical Business Automation: Eliminating Manual Lead Handoffs',
      category: 'Business Automation',
      excerpt:
        'A practical look at connecting website inquiry forms, relational databases, and instant notifications without over-engineering.',
      content:
        'Many growing service businesses lose hours each week copying inquiry details between email inboxes, spreadsheets, and project trackers.\n\nA well-designed automation pipeline captures structured client requirements at the source, validates fields automatically, stores records in PostgreSQL with status tracking, and alerts the right team member immediately.\n\nStart with the highest-frequency bottlenecks—lead intake, scheduling, and status updates—before automating complex edge cases.',
      cover_image_url: '/images/project_ux_mobile.jpg',
      author_name: 'Arafat Digital Team',
      read_time_minutes: 3,
      is_published: true,
      published_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    },
  ],
  testimonials: [
    {
      id: '00000000-0000-4000-8000-000000000401',
      client_name: 'Client Name Placeholder',
      client_role: 'Role / Title (Editable in Admin)',
      company: 'Client Company Placeholder',
      quote:
        'Editable testimonial slot: Replace this text with a verified client quote, project outcome, and attribution inside Admin Dashboard -> Testimonials.',
      project_context: 'Website Development & UI/UX Design',
      is_published: true,
      display_order: 1,
      created_at: nowIso,
    },
    {
      id: '00000000-0000-4000-8000-000000000402',
      client_name: 'Client Name Placeholder',
      client_role: 'Role / Title (Editable in Admin)',
      company: 'Client Company Placeholder',
      quote:
        'Editable testimonial slot: Add feedback from your Google Ads, SEO, or Business Automation engagements once approved by your client.',
      project_context: 'Performance Marketing & Automation',
      is_published: true,
      display_order: 2,
      created_at: nowIso,
    },
  ],
  inquiries: [],
  admin_auth: null,
};
