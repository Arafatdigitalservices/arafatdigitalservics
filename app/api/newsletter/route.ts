import { NextRequest, NextResponse } from 'next/server';
import { subscribeNewsletter } from '@/lib/data-store';
import { isValidEmail, sanitizeString } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const email = sanitizeString(body.email, 254).toLowerCase();
    const source = sanitizeString(body.source, 60) || 'website';

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const { subscriber, alreadySubscribed } = await subscribeNewsletter(email, source);
    return NextResponse.json(
      {
        id: subscriber.id,
        alreadySubscribed,
        message: alreadySubscribed
          ? 'You are already subscribed to Arafat Digital Services updates.'
          : 'Subscribed successfully. Thank you for joining our newsletter.',
      },
      { status: alreadySubscribed ? 200 : 201 }
    );
  } catch (error) {
    console.error('Newsletter subscription failed:', error);
    const message =
      error instanceof Error && error.message.includes('Supabase')
        ? error.message
        : 'Unable to process subscription right now. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
