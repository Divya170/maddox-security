/** Vacancy + job-application rules — the design's validateApp() verbatim. Pure, unit-tested. */
import { EMAIL_RE, isChecked, line, PHONE_MSG, PHONE_RE, tidy } from '../common/forms';
import { clean, SLUG_RE, tooLong } from '../common/text';

export const APPLICATION_STATUSES = ['new', 'reviewing', 'shortlisted', 'unsuccessful', 'archived'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  shortlisted: 'Shortlisted',
  unsuccessful: 'Unsuccessful',
  archived: 'Archived',
};

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const RESUME_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;
export type ResumeKind = keyof typeof RESUME_TYPES;

/** Recognise real document bytes — the browser-reported MIME type and the file name can lie. */
export function sniffResume(buf: Buffer | Uint8Array): ResumeKind | null {
  const b = Buffer.from(buf.buffer, buf.byteOffset, Math.min(buf.byteLength, 8));
  if (b.length >= 5 && b.toString('ascii', 0, 5) === '%PDF-') return 'pdf';
  if (b.length >= 8 && b.equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) return 'doc';
  if (b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) return 'docx';
  return null;
}

export interface ResumeFile {
  originalname: string;
  size: number;
  buffer: Buffer;
}

/** Design: optional; PDF/DOC/DOCX by name; ≤ 5 MB. Server also checks the bytes match the extension. */
export function resumeError(file: ResumeFile | null | undefined): string | null {
  if (!file || !file.size) return null;
  const ext = (/\.(pdf|docx?)$/i.exec(file.originalname || '')?.[1] || '').toLowerCase() as ResumeKind | '';
  if (!ext) return 'Upload a PDF, DOC, or DOCX file.';
  if (file.size > MAX_RESUME_BYTES) return 'The file is larger than 5 MB. Upload a smaller file.';
  const real = sniffResume(file.buffer);
  if (!real || real !== ext) return 'Upload a PDF, DOC, or DOCX file.';
  return null;
}

/** Keep a safe display name for the admin download (no paths, no odd characters). */
export const safeFileName = (name: string) =>
  (name || 'resume')
    .split(/[\\/]/)
    .pop()!
    .replace(/[^\w.\- ()]+/g, '_')
    .slice(-120);

export type ApplicationInput = Partial<Record<'fullName' | 'email' | 'phone' | 'experience' | 'cover' | 'privacy' | 'website', unknown>>;

export function validateApplication(input: ApplicationInput, file?: ResumeFile | null) {
  const e: Record<string, string> = {};
  const fullName = line(input.fullName);
  const email = tidy(input.email).toLowerCase();
  const phone = tidy(input.phone);
  const experience = tidy(input.experience, true);
  const cover = tidy(input.cover, true);

  if (!fullName) e.fullName = 'Enter your full name.';
  else if (fullName.length > 120) e.fullName = 'Use 120 characters or fewer.';
  if (!email) e.email = 'Enter your email address.';
  else if (email.length > 160 || !EMAIL_RE.test(email)) e.email = 'Enter an email address in the format name@example.com.';
  if (phone && !PHONE_RE.test(phone)) e.phone = PHONE_MSG;
  if (experience.length > 2000) e.experience = 'Use 2,000 characters or fewer.';
  if (cover.length > 2000) e.cover = 'Use 2,000 characters or fewer.';
  const r = resumeError(file);
  if (r) e.resume = r;
  if (!isChecked(input.privacy)) e.privacy = 'Confirm the privacy acknowledgement to submit your application.';

  return { value: { fullName, email, phone, experience, cover }, errors: e };
}

export type VacancyInput = Partial<Record<'slug' | 'title' | 'location' | 'employmentType' | 'summary' | 'description' | 'requirements' | 'howToApply' | 'closesOn' | 'published', unknown>>;

const isRealDate = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
};

export function validateVacancy(input: VacancyInput) {
  const e: Record<string, string> = {};
  const title = clean(input.title, 100);
  const slug = clean(input.slug, 60).toLowerCase();
  const location = clean(input.location, 100);
  const employmentType = clean(input.employmentType, 60);
  const summary = clean(input.summary, 300, true);
  const description = clean(input.description, 8000, true);
  const requirements = clean(input.requirements, 4000, true);
  const howToApply = clean(input.howToApply, 1000, true);
  const closesOn = clean(input.closesOn, 10);
  const published = input.published === true;

  if (title.length < 2) e.title = 'Enter the job title.';
  tooLong(e, 'title', title, 100);
  if (slug && !SLUG_RE.test(slug)) e.slug = 'Use lowercase letters, numbers and hyphens only.';
  tooLong(e, 'location', location, 100);
  tooLong(e, 'employmentType', employmentType, 60);
  tooLong(e, 'summary', summary, 300);
  tooLong(e, 'description', description, 8000);
  tooLong(e, 'requirements', requirements, 4000);
  tooLong(e, 'howToApply', howToApply, 1000);
  if (closesOn && !isRealDate(closesOn)) e.closesOn = 'Enter a valid date.';
  if (published) {
    if (!location) e.location = 'Add the location before publishing.';
    if (!employmentType) e.employmentType = 'Add the employment type before publishing.';
    if (description.length < 40) e.description = 'Add the approved job description (at least 40 characters) before publishing.';
  }
  return {
    value: { title, slug, location, employmentType, summary, description, requirements, howToApply, closesOn: closesOn || null, published },
    errors: e,
  };
}

/** A vacancy accepts applications while published and not past its closing date (business time zone). */
export const isVacancyOpen = (v: { published: boolean; closesOn: string | null }, today: string) => v.published && (!v.closesOn || v.closesOn >= today);
