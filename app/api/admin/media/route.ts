import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { deleteMediaAsset, saveMediaAsset } from '@/lib/data-store';

export async function POST(req: NextRequest) {
  const session = requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Please choose an image file to upload.' }, { status: 400 });
    }

    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be smaller than 4 MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const saved = await saveMediaAsset(file.name, buffer);

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to upload image.';
    console.error('Media upload failed:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const name = req.nextUrl.searchParams.get('name')?.trim();
    if (!name) {
      return NextResponse.json({ error: 'Asset name is required.' }, { status: 400 });
    }
    await deleteMediaAsset(name);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete media asset.';
    console.error('Media deletion failed:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
