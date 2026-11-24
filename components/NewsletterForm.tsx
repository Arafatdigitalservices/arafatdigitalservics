'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function NewsletterForm({ source = 'footer' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);
    setIsError(false);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        setIsError(true);
        setStatusMessage(data.error || 'Please enter a valid email address.');
        return;
      }

      setIsError(false);
      setStatusMessage(data.message || 'Subscribed successfully.');
      setEmail('');
    } catch {
      setIsError(true);
      setStatusMessage('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-2 space-y-2 max-w-sm">
      <p className="text-xs font-semibold tracking-wide text-slate-100">Newsletter Updates</p>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="footer-newsletter-email" className="sr-only">
          Email address for newsletter
        </label>
        <input
          id="footer-newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="flex-1 min-w-0 min-h-[42px] px-3.5 py-2 text-base sm:text-xs bg-white/10 border border-slate-700 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/50 focus:border-[#38BDF8]"
        />
        <button
          type="submit"
          disabled={submitting}
          className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#2563EB] hover:bg-blue-500 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>{submitting ? 'Joining...' : 'Subscribe'}</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </form>
      {statusMessage ? (
        <p
          role={isError ? 'alert' : 'status'}
          className={`text-xs flex items-center gap-1.5 ${
            isError ? 'text-red-300' : 'text-[#38BDF8]'
          }`}
        >
          {!isError ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> : null}
          <span>{statusMessage}</span>
        </p>
      ) : null}
    </div>
  );
}
