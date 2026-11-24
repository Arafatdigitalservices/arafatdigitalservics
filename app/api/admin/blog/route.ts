import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { deleteBlogPost, upsertBlogPost } from '@/lib/data-store';
import { sanitizeHttpUrl, sanitizeSlug, sanitizeString } from '@/lib/validation';

async function handleUpsert(req: NextRequest) {
  const session = requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const title = sanitizeString(body.title, 180);
    const category = sanitizeString(body.category, 80);
    const excerpt = sanitizeString(body.excerpt, 500);
    const content = sanitizeString(body.content, 15000);

    if (!title || !category || !excerpt || !content) {
      return NextResponse.json(
        { error: 'Title, category, excerpt, and article content are required.' },
        { status: 400 }
      );
    }

    const slug = sanitizeSlug(sanitizeString(body.slug, 120) || title) || `post-${Date.now()}`;
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const computedReadTime = Math.max(1, Math.min(60, Number(body.read_time_minutes) || Math.ceil(wordCount / 200)));

    const saved = await upsertBlogPost({
      id: sanitizeString(body.id, 100) || undefined,
      slug,
      title,
      category,
      excerpt,
      content,
      cover_image_url: sanitizeHttpUrl(body.cover_image_url),
      author_name: sanitizeString(body.author_name, 100) || session.fullName || 'Arafat Digital Team',
      read_time_minutes: computedReadTime,
      is_published: body.is_published !== false,
      published_at: sanitizeString(body.published_at, 60) || undefined,
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Failed to save blog post:', error);
    return NextResponse.json({ error: 'Unable to save blog post.' }, { status: 500 });
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
      return NextResponse.json({ error: 'Blog post id is required.' }, { status: 400 });
    }
    await deleteBlogPost(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Failed to delete blog post:', error);
    return NextResponse.json({ error: 'Unable to delete blog post.' }, { status: 500 });
  }
}
