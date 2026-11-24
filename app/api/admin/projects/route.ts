import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { deleteProject, upsertProject } from '@/lib/data-store';
import {
  sanitizeHttpUrl,
  sanitizeSlug,
  sanitizeString,
  sanitizeStringArray,
} from '@/lib/validation';

async function handleUpsert(req: NextRequest) {
  const session = requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const title = sanitizeString(body.title, 160);
    const category = sanitizeString(body.category, 80);
    const summary = sanitizeString(body.summary, 600);

    if (!title || !category || !summary) {
      return NextResponse.json(
        { error: 'Title, category, and summary are required.' },
        { status: 400 }
      );
    }

    const slug = sanitizeSlug(sanitizeString(body.slug, 120) || title) || `project-${Date.now()}`;
    const saved = await upsertProject({
      id: sanitizeString(body.id, 100) || undefined,
      slug,
      title,
      category,
      client_name: sanitizeString(body.client_name, 140),
      summary,
      challenge: sanitizeString(body.challenge, 2000),
      solution: sanitizeString(body.solution, 2000),
      deliverables: sanitizeStringArray(body.deliverables, 12, 160),
      metrics_note: sanitizeString(body.metrics_note, 240),
      image_url: sanitizeHttpUrl(body.image_url),
      live_url: sanitizeHttpUrl(body.live_url),
      is_featured: Boolean(body.is_featured),
      is_published: body.is_published !== false,
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Failed to save project:', error);
    return NextResponse.json({ error: 'Unable to save project.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handleUpsert(req);
}

export async function PUT(req: NextRequest) {
  return handleUpsert(req);
}

export async function DELETE(req: NextRequest) {
  const session = requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = req.nextUrl.searchParams.get('id')?.trim();
    if (!id) {
      return NextResponse.json({ error: 'Project id is required.' }, { status: 400 });
    }
    await deleteProject(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ error: 'Unable to delete project.' }, { status: 500 });
  }
}
