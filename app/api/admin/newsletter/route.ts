import { NextRequest, NextResponse } from 'next/server';
import { requireAdminVerified } from '@/lib/auth';
import {
  deleteNewsletterSubscriber,
  listNewsletterSubscribers,
  updateNewsletterSubscriberStatus,
} from '@/lib/data-store';
import type { NewsletterStatus } from '@/lib/types';
import { sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES: NewsletterStatus[] = ['active', 'unsubscribed'];

export async function GET(req: NextRequest) {
  const auth = await requireAdminVerified(req);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  try {
    const subscribers = await listNewsletterSubscribers();
    return NextResponse.json(subscribers);
  } catch (error) {
    console.error('Failed to list newsletter subscribers:', error);
    return NextResponse.json({ error: 'Unable to load subscribers.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminVerified(req);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = sanitizeString(body.id, 100);
    const status = sanitizeString(body.status, 30) as NewsletterStatus;

    if (!id || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Valid subscriber id and status are required.' }, { status: 400 });
    }

    const updated = await updateNewsletterSubscriberStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Subscriber not found.' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update subscriber:', error);
    return NextResponse.json({ error: 'Unable to update subscriber.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminVerified(req);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  try {
    const id = req.nextUrl.searchParams.get('id')?.trim();
    if (!id) {
      return NextResponse.json({ error: 'Subscriber id is required.' }, { status: 400 });
    }
    await deleteNewsletterSubscriber(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Failed to delete subscriber:', error);
    return NextResponse.json({ error: 'Unable to delete subscriber.' }, { status: 500 });
  }
}
