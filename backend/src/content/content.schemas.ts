/**
 * Registry of the generic content types on the Maddox Security Services site. The backend
 * validates against these and serves them to the admin UI, which builds its
 * forms from them.
 */

export type FieldKind = 'text' | 'textarea' | 'list' | 'select' | 'image';

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  /** characters (text) or items (list) */
  max?: number;
  options?: { value: string; label: string }[];
  help?: string;
}

export interface ContentTypeDef {
  type: string;
  label: string;
  page: string;
  description: string;
  titleField: string;
  fields: FieldDef[];
  /** only one published row per value of this field (page photos: one per slot) */
  uniqueBy?: string;
}

export const IMAGE_SLOTS = [
  { value: 'hero-photo', label: 'Home hero — uniformed security professional at a contemporary office entrance, natural light' },
  { value: 'home-band', label: 'Home wide band — commercial lobby with security professional greeting a visitor' },
  { value: 'company-wide', label: 'Company — architectural exterior, commercial building entrance, wide crop' },
  { value: 'careers-photo', label: 'Careers — security professional at work in a commercial reception' },
];

export const CONTENT_TYPES: ContentTypeDef[] = [
  {
    type: 'strip', label: 'Hero strip', page: 'Home — under the hero', titleField: 'text',
    description: 'The three short lines with gold diamonds at the bottom of the home hero.',
    fields: [{ key: 'text', label: 'Text', kind: 'text', required: true, max: 60 }],
  },
  {
    type: 'step', label: 'How an enquiry works', page: 'Home — “A clear first conversation.”', titleField: 'title',
    description: 'The numbered steps (01, 02, 03) beside the sticky intro.',
    fields: [
      { key: 'title', label: 'Title', kind: 'text', required: true, max: 80 },
      { key: 'body', label: 'Text', kind: 'textarea', required: true, max: 400 },
    ],
  },
  {
    type: 'industry', label: 'Industries / sectors', page: 'Industries, Home preview', titleField: 'name',
    description:
      'Sectors you serve. The design treats these as drafts until the owner confirms them: unpublished rows show only in staff preview. Once at least one is published, the Industries page lists them and the home page shows the “Environments we can discuss” preview.',
    fields: [
      { key: 'name', label: 'Sector name', kind: 'text', required: true, max: 80 },
      { key: 'body', label: 'Description', kind: 'textarea', required: true, max: 600 },
      { key: 'related', label: 'Related services (text)', kind: 'text', max: 160, help: 'e.g. Guard Services, Access Control' },
      { key: 'image', label: 'Photo', kind: 'image' },
      { key: 'alt', label: 'Photo alt text', kind: 'text', max: 200 },
      { key: 'photo', label: 'Placeholder label', kind: 'text', max: 160, help: 'Shown until a photo is added.' },
    ],
  },
  {
    type: 'credential', label: 'Credentials & compliance', page: 'Company', titleField: 'label',
    description: 'Licensing, insurance, qualifications, certifications. Each row publishes only after verification — unpublished rows show in staff preview as “Awaiting verified details”.',
    fields: [
      { key: 'label', label: 'Label', kind: 'text', required: true, max: 60 },
      { key: 'detail', label: 'Verified detail (e.g. licence number, insurer, scope)', kind: 'textarea', max: 400 },
    ],
  },
  {
    type: 'site-image', label: 'Page photos', page: 'Home, Company, Careers', titleField: 'slot', uniqueBy: 'slot',
    description: 'Photos for the design’s image slots. Until a photo is added the site shows the labelled placeholder. Service and industry photos are set on each item.',
    fields: [
      { key: 'slot', label: 'Slot', kind: 'select', required: true, options: IMAGE_SLOTS },
      { key: 'image', label: 'Photo', kind: 'image', required: true },
      { key: 'alt', label: 'Alt text (describe the photo)', kind: 'text', required: true, max: 200 },
    ],
  },
];

export const CONTENT_TYPE_MAP = new Map(CONTENT_TYPES.map((t) => [t.type, t]));
