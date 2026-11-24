import { NextRequest, NextResponse } from 'next/server';
import { requireAdminVerified } from '@/lib/auth';
import { updateSiteSettings } from '@/lib/data-store';
import {
  isValidEmail,
  sanitizeHttpUrl,
  sanitizePhoneDisplay,
  sanitizeString,
} from '@/lib/validation';

export async function PUT(req: NextRequest) {
  const auth = await requireAdminVerified(req);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const brand_name = sanitizeString(body.brand_name, 120) || 'Arafat Digital Services';
    const tagline =
      sanitizeString(body.tagline, 200) ||
      'Empowering Businesses with Modern Digital Solutions.';
    const contact_email = sanitizeString(body.contact_email, 254).toLowerCase();
    const secondary_email = sanitizeString(body.secondary_email, 254).toLowerCase();

    if (contact_email && !isValidEmail(contact_email)) {
      return NextResponse.json({ error: 'Please enter a valid primary email.' }, { status: 400 });
    }
    if (secondary_email && !isValidEmail(secondary_email)) {
      return NextResponse.json({ error: 'Please enter a valid secondary email.' }, { status: 400 });
    }

    const updated = await updateSiteSettings({
      brand_name,
      tagline,
      description: sanitizeString(body.description, 1000),
      contact_email: contact_email || 'arafatdigitalservics@gmail.com',
      secondary_email,
      whatsapp_number: sanitizePhoneDisplay(body.whatsapp_number),
      phone_number: sanitizePhoneDisplay(body.phone_number),
      location_markets:
        sanitizeString(body.location_markets, 200) ||
        'USA, UK, Europe, Canada, Australia & Worldwide',
      linkedin_url: sanitizeHttpUrl(body.linkedin_url),
      twitter_url: sanitizeHttpUrl(body.twitter_url),
      facebook_url: sanitizeHttpUrl(body.facebook_url),
      instagram_url: sanitizeHttpUrl(body.instagram_url),
      github_url: sanitizeHttpUrl(body.github_url),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update site settings:', error);
    return NextResponse.json({ error: 'Unable to update site settings.' }, { status: 500 });
  }
}
