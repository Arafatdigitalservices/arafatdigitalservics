import { NextRequest, NextResponse } from 'next/server';
import { requireAdminVerified } from '@/lib/auth';
import { deleteService, upsertService } from '@/lib/data-store';
import { sanitizeSlug, sanitizeString, sanitizeStringArray } from '@/lib/validation';

async function handleUpsert(req: NextRequest) {
  const auth = await requireAdminVerified(req);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const title = sanitizeString(body.title, 140);
    const short_description = sanitizeString(body.short_description, 500);
    const full_description = sanitizeString(body.full_description, 3000) || short_description;

    if (!title || !short_description) {
      return NextResponse.json(
        { error: 'Service title and short description are required.' },
        { status: 400 }
      );
    }

    const slug = sanitizeSlug(sanitizeString(body.slug, 120) || title) || `service-${Date.now()}`;
    const icon_name = sanitizeString(body.icon_name, 40) || 'Code2';
    const features = sanitizeStringArray(body.features, 12, 180);
    const display_order = Math.max(1, Math.min(999, Number(body.display_order) || 1));
    const is_published = body.is_published !== false;
    const id = sanitizeString(body.id, 100) || undefined;

    const saved = await upsertService({
      id,
      slug,
      title,
      short_description,
      full_description,
      icon_name,
      features,
      display_order,
      is_published,
    });
    return NextResponse.json(saved);
  } catch (error) {
    console.error('Failed to save service:', error);
    return NextResponse.json({ error: 'Unable to save service.' }, { status: 500 });
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
      return NextResponse.json({ error: 'Service id is required.' }, { status: 400 });
    }
    await deleteService(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Failed to delete service:', error);
    return NextResponse.json({ error: 'Unable to delete service.' }, { status: 500 });
  }
}
