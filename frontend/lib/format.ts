export function formatShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/** "2026-11-30" → "Nov 30, 2026" without timezone shifts. */
export function formatDay(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export const paragraphs = (s: string) =>
  (s || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

export const fileSize = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export const INQUIRY_STATUSES = [
  ['new', 'New'],
  ['in_progress', 'In progress'],
  ['responded', 'Responded'],
  ['archived', 'Archived'],
  ['spam', 'Spam'],
] as const;
export const APPLICATION_STATUSES = [
  ['new', 'New'],
  ['reviewing', 'Reviewing'],
  ['shortlisted', 'Shortlisted'],
  ['unsuccessful', 'Unsuccessful'],
  ['archived', 'Archived'],
] as const;

export const NOTIFY_TEXT: Record<string, string> = {
  disabled: 'Email notifications are not configured. The submission is stored; set SMTP in backend/.env to email staff.',
  pending: 'Notification email queued. It is retried automatically if delivery fails.',
  sent: 'Notification email sent to staff.',
  failed: 'Notification email failed. It is retried automatically, or you can retry now.',
};
