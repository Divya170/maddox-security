/** Pure validation for services (unit-tested, no framework imports). */
import { clean, IMAGE_RE, SLUG_RE, tooLong } from '../common/text';

export type ServiceInput = Partial<Record<'slug' | 'title' | 'summary' | 'overview' | 'featureHeadline' | 'image' | 'imageAlt' | 'imageLabel' | 'published', unknown>>;

/** "unsure" is reserved for the form's "Not sure yet" option. */
export const RESERVED_SLUGS = ['unsure'];

export function validateService(input: ServiceInput) {
  const e: Record<string, string> = {};
  const title = clean(input.title, 80);
  const slug = clean(input.slug, 40).toLowerCase();
  const summary = clean(input.summary, 400, true);
  const overview = clean(input.overview, 2000, true);
  const featureHeadline = clean(input.featureHeadline, 120);
  const image = clean(input.image, 500);
  const published = input.published === true;

  if (title.length < 2) e.title = 'Enter a service title.';
  tooLong(e, 'title', title, 80);
  if (slug && !SLUG_RE.test(slug)) e.slug = 'Use lowercase letters, numbers and hyphens only.';
  if (RESERVED_SLUGS.includes(slug)) e.slug = '“unsure” is reserved for the form’s “Not sure yet” option.';
  tooLong(e, 'summary', summary, 400);
  tooLong(e, 'overview', overview, 2000);
  tooLong(e, 'featureHeadline', featureHeadline, 120);
  if (image && !IMAGE_RE.test(image)) e.image = 'Upload an image or use an https:// URL.';
  if (published && summary.length < 10) e.summary = 'Add a summary (at least 10 characters) before publishing.';

  return {
    value: { title, slug, summary, overview, featureHeadline, image: image || null, imageAlt: clean(input.imageAlt, 200), imageLabel: clean(input.imageLabel, 160), published },
    errors: e,
  };
}
