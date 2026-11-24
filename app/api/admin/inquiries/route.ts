import { NextRequest, NextResponse } from 'next/server';
import { requireAdminVerified } from '@/lib/auth';
import { deleteInquiry, updateInquiry } from '@/lib/data-store';
import type { InquiryStatus } from '@/lib/types';
import { sanitizeString } from '@/lib/validation';

const ALLOWED_STATUSES: InquiryStatus[] = ['new', 'in_review', 'replied', 'archived'];

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminVerified(req);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = sanitizeString(body.id, 100);
    if (!id) {
      return NextResponse.json({ error: 'Inquiry id is required.' }, { status: 400 });
    }

    const updates: { status?: InquiryStatus; admin_notes?: string } = {};
    if (typeof body.status === 'string' && ALLOWED_STATUSES.includes(body.status as InquiryStatus)) {
      updates.status = body.status as InquiryStatus;
    }
    if (typeof body.admin_notes === 'string') {
      updates.admin_notes = sanitizeString(body.admin_notes, 2000);
    }

    const updated = await updateInquiry(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Inquiry not found.' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update inquiry:', error);
    return NextResponse.json({ error: 'Unable to update inquiry.' }, { status: 500 });
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
      return NextResponse.json({ error: 'Inquiry id is required.' }, { status: 400 });
    }
    await deleteInquiry(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Failed to delete inquiry:', error);
    return NextResponse.json({ error: 'Unable to delete inquiry.' }, { status: 500 });
  }
}
