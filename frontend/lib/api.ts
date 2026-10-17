/**
 * Server-side data access for public pages (React Server Components).
 * Uncached so admin edits appear immediately.
 *
 * Staff draft preview: when the `ms_preview` cookie is set, the request forwards the admin
 * session cookie and asks for `?preview=1`. The API includes drafts only if that session is
 * valid, so visitors can never see drafts by setting the cookie themselves.
 */
import { cookies } from 'next/headers';
import type { SiteData, VacancyDetail } from './types';

const BACKEND = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');
export const PREVIEW_COOKIE = 'ms_preview';
const SESSION_COOKIE = 'ms_session';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function previewHeaders(): { preview: boolean; headers: Record<string, string> } {
  const jar = cookies();
  const session = jar.get(SESSION_COOKIE)?.value;
  if (jar.get(PREVIEW_COOKIE)?.value !== '1' || !session) return { preview: false, headers: {} };
  return { preview: true, headers: { Cookie: `${SESSION_COOKIE}=${session}` } };
}

async function get<T>(path: string): Promise<T> {
  const { preview, headers } = previewHeaders();
  const url = `${BACKEND}/api${path}${preview ? `${path.includes('?') ? '&' : '?'}preview=1` : ''}`;
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json', ...headers } });
  } catch {
    throw new ApiError(503, 'The site service is unavailable. Please try again shortly.');
  }
  if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

/** Business details, services, steps, sectors, credentials, vacancies and page photos. */
export const getSite = () => get<SiteData>('/site');

/** Enquiry form options (published services + "Not sure yet"). */
export const getInquiryOptions = () => get<{ services: { value: string; label: string }[]; open: boolean }>('/inquiries/options');

/** One vacancy, or null when it is missing / closed / not published. */
export async function getVacancy(slug: string): Promise<VacancyDetail | null> {
  try {
    return await get<VacancyDetail>(`/careers/vacancies/${encodeURIComponent(slug)}`);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 410)) return null;
    throw e;
  }
}
