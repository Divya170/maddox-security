/**
 * Client mirror of the design's validateEnq() / validateApp() and the backend's
 * inquiry-validation.ts / career-validation.ts. The API re-validates everything.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^[0-9+()\-.\s]{7,24}$/;
const PHONE_MSG = 'Enter a phone number using digits, spaces, or + ( ) -.';
export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export type Errors = Record<string, string>;

/** Design ENQ_FIELDS / ENQ_IDS — error summary reads "Label: message". */
export const ENQ_FIELDS: Record<string, string> = {
  company: 'Company name',
  name: 'Your name',
  email: 'Business email',
  phone: 'Phone',
  service: 'Service type',
  location: 'Coverage location',
  requirements: 'Service requirements',
  privacy: 'Privacy acknowledgement',
};
export const ENQ_IDS: Record<string, string> = { company: 'f-company', name: 'f-name', email: 'f-email', phone: 'f-phone', service: 'f-service', location: 'f-location', requirements: 'f-req', privacy: 'f-privacy' };

export function validateEnquiry(v: Record<string, string | boolean>, services: string[]): Errors {
  const s = (k: string) => String(v[k] ?? '').trim();
  const e: Errors = {};
  if (!s('company')) e.company = 'Enter your company name.';
  if (!s('name')) e.name = 'Enter your name.';
  if (!s('email')) e.email = 'Enter your business email address.';
  else if (!EMAIL_RE.test(s('email'))) e.email = 'Enter an email address in the format name@company.com.';
  if (s('phone') && !PHONE_RE.test(s('phone'))) e.phone = PHONE_MSG;
  if (!s('service') || !services.includes(s('service'))) e.service = 'Select a service type, or choose “Not sure yet”.';
  if (!s('location')) e.location = 'Enter a city, town, or general service area.';
  if (s('requirements').length < 20) e.requirements = 'Briefly describe the support you need (at least 20 characters).';
  if (!v.privacy) e.privacy = 'Confirm the privacy acknowledgement to send your enquiry.';
  return e;
}

/** Design APP_FIELDS (ids are "a-" + key). */
export const APP_FIELDS: Record<string, string> = { fullName: 'Full name', email: 'Email address', phone: 'Telephone', resume: 'Resume', privacy: 'Privacy acknowledgement' };

export function validateApplicationForm(v: Record<string, string | boolean>, file: File | null): Errors {
  const s = (k: string) => String(v[k] ?? '').trim();
  const e: Errors = {};
  if (!s('fullName')) e.fullName = 'Enter your full name.';
  if (!s('email')) e.email = 'Enter your email address.';
  else if (!EMAIL_RE.test(s('email'))) e.email = 'Enter an email address in the format name@example.com.';
  if (s('phone') && !PHONE_RE.test(s('phone'))) e.phone = PHONE_MSG;
  if (file && file.size) {
    if (!/\.(pdf|docx?)$/i.test(file.name)) e.resume = 'Upload a PDF, DOC, or DOCX file.';
    else if (file.size > MAX_RESUME_BYTES) e.resume = 'The file is larger than 5 MB. Upload a smaller file.';
  }
  if (!v.privacy) e.privacy = 'Confirm the privacy acknowledgement to submit your application.';
  return e;
}

/** The design's failure outcomes: [title, body]. */
export const OUTCOMES: Record<string, [string, string]> = {
  server: ['We couldn’t send your submission just now.', 'Your details are still here. Please try again, or contact us by phone or email.'],
  network: ['Your connection appears to have dropped.', 'Nothing was lost — check your connection and try again.'],
  ratelimit: ['Too many submissions have been received from this connection.', 'Please wait a few minutes before trying again, or contact us directly.'],
  spam: ['We couldn’t accept this submission.', 'Please try again, or contact us directly by phone or email.'],
  closed: ['Online submissions are paused right now.', 'Please contact us directly by phone or email.'],
  vacancy_closed: ['This vacancy is no longer accepting applications.', 'The position may have closed. Please check the current vacancies.'],
};
