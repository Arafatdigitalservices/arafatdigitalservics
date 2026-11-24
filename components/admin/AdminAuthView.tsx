'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';

interface AdminAuthViewProps {
  needsSetup: boolean;
  envOverride: boolean;
  defaultEmail?: string;
  onAuthenticated: (token: string, profile: { email: string; fullName: string }) => void;
}

export function AdminAuthView({
  needsSetup,
  envOverride,
  defaultEmail = '',
  onAuthenticated,
}: AdminAuthViewProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (needsSetup) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const endpoint = needsSetup ? '/api/admin/auth/setup' : '/api/admin/auth/login';
      const payload = needsSetup
        ? { email, fullName: fullName || 'Agency Admin', password }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as {
        token?: string;
        profile?: { email: string; fullName: string };
        error?: string;
      };

      if (!res.ok || !data.token || !data.profile) {
        setError(data.error || 'Authentication failed.');
        return;
      }

      onAuthenticated(data.token, data.profile);
    } catch {
      setError('Unable to reach the authentication server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Website
          </Link>
          <span className="text-xs font-medium text-slate-500">Arafat Digital Services</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
              {needsSetup ? (
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Lock className="w-5 h-5" aria-hidden="true" />
              )}
            </div>
            <h1 className="font-display text-2xl font-bold text-[#0F172A]">
              {needsSetup ? 'Initialize Admin Account' : 'Admin Dashboard Sign In'}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {needsSetup
                ? 'First-run setup: create your administrator login credentials. Once claimed, this setup route locks automatically.'
                : envOverride
                  ? 'Sign in with your configured ADMIN_PASSWORD environment secret.'
                  : 'Sign in with your administrator email and password to manage services, portfolio, blog posts, inquiries, and site settings.'}
            </p>
          </div>

          {error ? (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            {needsSetup ? (
              <div className="space-y-1.5">
                <label htmlFor="admin-fullname" className="block text-sm font-medium text-[#0F172A]">
                  Administrator Name
                </label>
                <input
                  id="admin-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Arafat Hossain"
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-sm font-medium text-[#0F172A]">
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                required={!envOverride}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="arafatdigitalservics@gmail.com"
                className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-sm font-medium text-[#0F172A]">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={needsSetup ? 'Minimum 8 characters' : 'Enter your password'}
                className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            {needsSetup ? (
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-confirm-password"
                  className="block text-sm font-medium text-[#0F172A]"
                >
                  Confirm Password
                </label>
                <input
                  id="admin-confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[44px] py-3 px-4 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
            >
              {submitting
                ? 'Verifying...'
                : needsSetup
                  ? 'Create Admin Account & Enter Dashboard'
                  : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
