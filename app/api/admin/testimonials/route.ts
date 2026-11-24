import { NextRequest, NextResponse } from 'next/server';
import { requireAdminVerified } from '@/lib/auth';
import { deleteTestimonial, upsertTestimonial } from '@/lib/data-store';
import { sanitizeString } from '@/lib/validation';

async function handleUpsert(req: NextRequest) {
  const auth = await requireAdminVerified(req);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const client_name = sanitizeString(body.client_name, 120);
    const client_role = sanitizeString(body.client_role, 120);
    const company = sanitizeString(body.company, 140);
    const quote = sanitizeString(body.quote, 1200);

    if (!client_name || !quote) {
      return NextResponse.json(
        { error: 'Client name and testimonial quote are required.' },
        { status: 400 }
      );
    }

    const saved = await upsertTestimonial({
      id: sanitizeString(body.id, 100) || undefined,
      client_name,
      client_role: client_role || 'Client',
      company: company || 'Confidential',
      quote,
      project_context: sanitizeString(body.project_context, 160),
      is_published: body.is_published !== false,
      display_order: Math.max(1, Math.min(999, Number(body.display_order) || 1)),
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Failed to save testimonial:', error);
    return NextResponse.json({ error: 'Unable to save testimonial.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handleUpsert(req);
}

export async function PUT(req: NextRequest) {
  return handleUpsert(req);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminVerified(req);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  try {
    const id = req.nextUrl.searchParams.get('id')?.trim();
    if (!id) {
      return NextResponse.json({ error: 'Testimonial id is required.' }, { status: 400 });
    }
    await deleteTestimonial(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Failed to delete testimonial:', error);
    return NextResponse.json({ error: 'Unable to delete testimonial.' }, { status: 500 });
  }
}
