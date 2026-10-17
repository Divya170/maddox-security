/**
 * Shared, framework-free helpers for the public forms (enquiry + job application).
 * Patterns and messages are the design's own; unit-tested in rules.spec.ts.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^[0-9+()\-.\s]{7,24}$/;
export const PHONE_MSG = 'Enter a phone number using digits, spaces, or + ( ) -.';

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

/** Strip control characters (keep newlines when multiline), normalise line endings, trim. */
export const tidy = (v: unknown, multiline = false) =>
  str(v)
    .replace(multiline ? /[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\r\n?/g, '\n')
    .trim();

/** Single-line value with internal whitespace collapsed. */
export const line = (v: unknown) => tidy(v).replace(/\s+/g, ' ');

/** Checkbox values arrive as true / "true" / "on" (multipart). */
export const isChecked = (v: unknown) => v === true || v === 'true' || v === 'on' || v === '1';

/** Honeypot field `website` (hidden from people). */
export const isHoneypot = (v: unknown) => str(v).trim() !== '';

/** CSV cell, quoted, with spreadsheet-formula injection neutralised. */
export function csvSafe(v: unknown): string {
  let x = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(x)) x = `'${x}`;
  return `"${x.replace(/"/g, '""')}"`;
}

/** Reference shown on success cards and in the admin: MSS-E-1001 (enquiry) / MSS-A-1001 (application). */
export const publicRef = (kind: 'E' | 'A', id: number) => `MSS-${kind}-${1000 + id}`;

/** "Today" in the business time zone (Boston → America/New_York). */
export function todayIso(now = new Date(), tz = process.env.BUSINESS_TZ || 'America/New_York'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
