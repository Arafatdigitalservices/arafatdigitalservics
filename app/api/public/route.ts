import { NextResponse } from 'next/server';
import { getPublicSiteData } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getPublicSiteData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to load public site data:', error);
    return NextResponse.json({ error: 'Unable to load site content.' }, { status: 500 });
  }
}
