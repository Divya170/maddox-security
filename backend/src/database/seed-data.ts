/**
 * First-boot content, copied verbatim from the design comp (Maddox Security Services v2).
 * Pure data — no framework imports — so the rules tests can load it.
 */

export const SETTINGS_SEED = {
  businessName: 'Maddox Security Services',
  contactName: 'Chase Maddox',
  phone: '+1 (404) 798-9172',
  email: 'chase.maddox@outlook.com',
  addressLine1: '1000 Washington St',
  addressLine2: 'Boston, MA 21180',
  tagline: 'Professional security services for organizations.',
  companyProfile: '',
  privacyPolicy: '',
  termsOfUse: '',
  reviewNote: 'Review mode — draft content awaiting owner approval is visible and labelled. It is hidden from the public site.',
  inquiriesOpen: true,
  applicationsOpen: true,
};

export interface ServiceSeed {
  slug: string;
  title: string;
  summary: string;
  overview: string;
  featureHeadline: string;
  imageLabel: string;
  published: boolean;
}

export const SERVICES_SEED: ServiceSeed[] = [
  {
    slug: 'guard',
    title: 'Guard Services',
    summary: 'Uniformed security personnel for commercial premises, arranged around your site and the way your organization operates.',
    overview: '',
    featureHeadline: 'A professional presence at your premises.',
    imageLabel: 'Guard services — officer at building entrance, portrait crop',
    published: true,
  },
  {
    slug: 'commercial',
    title: 'Commercial Security',
    summary: 'Security support for offices, commercial buildings, and business premises, scoped to the property and its daily operation.',
    overview: '',
    featureHeadline: '',
    imageLabel: 'Commercial security — office building entrance',
    published: true,
  },
  {
    slug: 'event',
    title: 'Event Security',
    summary: 'Security staffing for organized events, planned with the organizer around the venue and the format of the event.',
    overview: '',
    featureHeadline: '',
    imageLabel: 'Event security — venue entrance before an event',
    published: true,
  },
  {
    slug: 'access',
    title: 'Access Control',
    summary: 'Support for managing entry to your premises and its access points. Scope is agreed with you during consultation.',
    overview: '',
    featureHeadline: '',
    imageLabel: 'Access control — staffed entry point',
    published: true,
  },
  {
    // Design: draft, "Shown in review only — awaiting owner confirmation that this service is offered."
    slug: 'patrol',
    title: 'Mobile Patrol',
    summary: 'Shown in review only — awaiting owner confirmation that this service is offered.',
    overview: '',
    featureHeadline: '',
    imageLabel: 'Mobile patrol — marked vehicle at a commercial site',
    published: false,
  },
];

type Seed = { fields: Record<string, unknown>; published?: boolean }[];
const f = (fields: Record<string, unknown>, published = true) => ({ fields, published });

export const CONTENT_SEED: Record<string, Seed> = {
  strip: [f({ text: 'Professional security services' }), f({ text: 'Commercial service enquiries' }), f({ text: 'Consultation-led engagement' })],
  step: [
    f({ title: 'Share your requirements', body: 'Use the enquiry form or call us with a general outline of your organization, location, and the support you’re considering.' }),
    f({ title: 'Discuss your service needs', body: 'We talk through your premises or event and what you need from a security provider.' }),
    f({ title: 'Review the next steps', body: 'Agree together on what happens next and what a service arrangement could involve.' }),
  ],
  // Design: candidate sectors are drafts — "owner to confirm before publication".
  industry: [
    f({ name: 'Commercial offices', related: 'Guard Services, Access Control', photo: 'Office lobby with reception desk', body: 'Offices often need a courteous front-of-house presence and a clear approach to visitors and entry points.' }, false),
    f({ name: 'Retail properties', related: 'Guard Services, Commercial Security', photo: 'Retail property exterior, daytime', body: 'Retail environments balance a welcoming customer experience with a visible professional presence.' }, false),
    f({ name: 'Residential property management', related: 'Guard Services, Access Control', photo: 'Managed residential building entrance', body: 'Property managers may need support that respects residents while managing building access.' }, false),
    f({ name: 'Events and venues', related: 'Event Security', photo: 'Venue entrance before an event', body: 'Events bring changing crowds and timings, so planning starts with the venue and the event format.' }, false),
    f({ name: 'Industrial and logistics facilities', related: 'Commercial Security, Access Control', photo: 'Logistics facility gatehouse', body: 'Larger sites with vehicle and staff movement may need structured entry and site security support.' }, false),
  ],
  // Design: "each row publishes only after verification".
  credential: [f({ label: 'Licensing', detail: '' }, false), f({ label: 'Insurance', detail: '' }, false), f({ label: 'Qualifications', detail: '' }, false), f({ label: 'Certifications', detail: '' }, false)],
};
