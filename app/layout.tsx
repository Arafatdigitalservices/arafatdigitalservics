import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const siteTitle = 'Arafat Digital Services – Modern Digital Solutions';
const siteDescription =
  'Empowering businesses with modern digital solutions across the USA, UK, Europe, Canada, Australia, and worldwide. Web development, UI/UX, ads, SEO, and automation.';

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  keywords: [
    'Arafat Digital Services',
    'International Digital Agency',
    'Website Development',
    'UI/UX Design',
    'Google Ads',
    'Facebook Ads',
    'SEO Services',
    'Business Automation',
  ],
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: 'website',
    siteName: 'Arafat Digital Services',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Arafat Digital Services',
    description: siteDescription,
    areaServed: ['United States', 'United Kingdom', 'Europe', 'Canada', 'Australia', 'Worldwide'],
    serviceType: [
      'Website Development',
      'UI/UX Design',
      'Google Ads',
      'Facebook Ads',
      'Social Media Marketing',
      'SEO Services',
      'Business Automation',
    ],
  };

  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
