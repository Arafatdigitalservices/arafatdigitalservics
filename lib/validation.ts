export function sanitizeString(value: unknown, maxLength = 2000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

export function sanitizeHttpUrl(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/images/') || trimmed.startsWith('/uploads/')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return '';
  } catch {
    return '';
  }
}

export function sanitizeWhatsAppDigits(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[^\d]/g, '').slice(0, 20);
}

export function sanitizePhoneDisplay(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[^\d+\-\s()]/g, '').trim().slice(0, 24);
}

export function sanitizeStringArray(raw: unknown, maxItems = 20, maxItemLen = 200): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => sanitizeString(item, maxItemLen))
      .filter(Boolean)
      .slice(0, maxItems);
  }
  if (typeof raw === 'string') {
    return raw
      .split(/\r?\n|,/)
      .map((item) => item.trim().slice(0, maxItemLen))
      .filter(Boolean)
      .slice(0, maxItems);
  }
  return [];
}

export interface InquiryValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  data?: {
    name: string;
    email: string;
    company: string;
    service_required: string;
    budget_range: string;
    project_details: string;
  };
}

export function validateInquiryPayload(body: Record<string, unknown>): InquiryValidationResult {
  const name = sanitizeString(body.name, 120);
  const email = sanitizeString(body.email, 254).toLowerCase();
  const company = sanitizeString(body.company, 160);
  const service_required = sanitizeString(body.service_required, 140);
  const budget_range = sanitizeString(body.budget_range, 100);
  const project_details = sanitizeString(body.project_details, 4000);

  const errors: Record<string, string> = {};

  if (name.length < 2) {
    errors.name = 'Please enter your full name (at least 2 characters).';
  }
  if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid business or personal email address.';
  }
  if (!service_required) {
    errors.service_required = 'Please select the required service.';
  }
  if (!budget_range) {
    errors.budget_range = 'Please select an estimated budget range.';
  }
  if (project_details.length < 15) {
    errors.project_details = 'Please describe your project goals (at least 15 characters).';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    data: {
      name,
      email,
      company,
      service_required,
      budget_range,
      project_details,
    },
  };
}
