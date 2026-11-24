import type { ReactNode } from 'react';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { getPublicSiteData } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const data = await getPublicSiteData();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Navbar
        brandName={data.site_settings.brand_name}
        whatsappNumber={data.site_settings.whatsapp_number}
      />
      <main className="flex-1">{children}</main>
      <Footer settings={data.site_settings} services={data.services} />
    </div>
  );
}
