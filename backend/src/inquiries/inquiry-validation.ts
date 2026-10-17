/** Service-enquiry rules — the design's validateEnq() verbatim. Pure, unit-tested. */
import { EMAIL_RE, isChecked, line, PHONE_MSG, PHONE_RE, tidy } from '../common/forms';

export const INQUIRY_STATUSES = ['new', 'in_progress', 'responded', 'archived', 'spam'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];
export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  responded: 'Responded',
  archived: 'Archived',
  spam: 'Spam',
};

export const UNSURE = { value: 'unsure', label: 'Not sure yet — discuss during consultation' };

export type InquiryInput = Partial<
  Record<'company' | 'name' | 'email' | 'phone' | 'service' | 'location' | 'site' | 'requirements' | 'message' | 'privacy' | 'website', unknown>
>;

export function validateInquiry(input: InquiryInput, ctx: { services: string[] }) {
  const e: Record<string, string> = {};
  const company = line(input.company);
  const name = line(input.name);
  const email = tidy(input.email).toLowerCase();
  const phone = tidy(input.phone);
  const service = tidy(input.service);
  const location = line(input.location);
  const site = line(input.site);
  const requirements = tidy(input.requirements, true);
  const message = tidy(input.message, true);
  const privacy = isChecked(input.privacy);

  if (!company) e.company = 'Enter your company name.';
  else if (company.length > 120) e.company = 'Use 120 characters or fewer.';
  if (!name) e.name = 'Enter your name.';
  else if (name.length > 120) e.name = 'Use 120 characters or fewer.';
  if (!email) e.email = 'Enter your business email address.';
  else if (email.length > 160 || !EMAIL_RE.test(email)) e.email = 'Enter an email address in the format name@company.com.';
  if (phone && !PHONE_RE.test(phone)) e.phone = PHONE_MSG;
  if (!service || (service !== UNSURE.value && !ctx.services.includes(service))) e.service = 'Select a service type, or choose “Not sure yet”.';
  if (!location) e.location = 'Enter a city, town, or general service area.';
  else if (location.length > 120) e.location = 'Use 120 characters or fewer.';
  if (site.length > 120) e.site = 'Use 120 characters or fewer.';
  if (requirements.length < 20) e.requirements = 'Briefly describe the support you need (at least 20 characters).';
  else if (requirements.length > 2000) e.requirements = 'Use 2,000 characters or fewer.';
  if (message.length > 2000) e.message = 'Use 2,000 characters or fewer.';
  if (!privacy) e.privacy = 'Confirm the privacy acknowledgement to send your enquiry.';

  return { value: { company, name, email, phone, service, location, site, requirements, message }, errors: e };
}
