import { NextRequest, NextResponse } from 'next/server';
import { createInquiry } from '@/lib/data-store';
import { validateInquiryPayload } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const validation = validateInquiryPayload(body);

    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { error: 'Please review the highlighted fields.', fieldErrors: validation.errors },
        { status: 400 }
      );
    }

    const inquiry = await createInquiry(validation.data);
    return NextResponse.json(
      {
        message: 'Inquiry received successfully. Our team will respond within 1 business day.',
        id: inquiry.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact inquiry creation failed:', error);
    return NextResponse.json(
      { error: 'Unable to submit your inquiry right now. Please try again.' },
      { status: 500 }
    );
  }
}
