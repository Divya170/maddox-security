export interface PublicSettings {
  businessName: string;
  contactName: string;
  phone: string | null;
  telHref: string | null;
  email: string | null;
  mailHref: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  address: string;
  mapsHref: string | null;
  tagline: string;
  companyProfile: string;
  privacyPolicy: string;
  termsOfUse: string;
  reviewNote: string;
  inquiriesOpen: boolean;
  applicationsOpen: boolean;
}

export interface Service {
  id: number;
  num: string;
  slug: string;
  title: string;
  summary: string;
  overview: string;
  featureHeadline: string;
  image: string | null;
  imageAlt: string;
  imageLabel: string;
  draft: boolean;
}

export interface Step {
  id: number;
  title: string;
  body: string;
}
export interface Industry {
  id: number;
  name: string;
  body: string;
  related: string;
  photo: string;
  image: string;
  alt: string;
  draft: boolean;
}
export interface Credential {
  id: number;
  label: string;
  detail: string;
  draft: boolean;
}
export interface VacancySummary {
  slug: string;
  title: string;
  location: string;
  employmentType: string;
  summary: string;
  closesOn: string | null;
  draft: boolean;
  open: boolean;
}
export interface VacancyDetail extends VacancySummary {
  description: string;
  requirements: string;
  howToApply: string;
  applicationsOpen: boolean;
}

export type SiteImages = Record<string, { url: string; alt: string } | undefined>;

export interface SiteData {
  preview: boolean;
  settings: PublicSettings;
  services: Service[];
  strip: string[];
  steps: Step[];
  industries: Industry[];
  credentials: Credential[];
  vacancies: VacancySummary[];
  images: SiteImages;
}

export type Opt = { value: string; label: string };

// ---------- admin ----------

export interface Inquiry {
  id: number;
  publicRef: string | null;
  company: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  serviceLabel: string;
  location: string;
  site: string;
  requirements: string;
  message: string;
  consentAt: string;
  status: string;
  statusLabel: string;
  notes: string;
  notifyStatus: 'pending' | 'sent' | 'failed' | 'disabled';
  notifyError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InquiryList {
  items: Inquiry[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  counts: Record<string, number>;
  services: Opt[];
  notificationsConfigured: boolean;
  retentionMonths: number;
}

export interface Application {
  id: number;
  publicRef: string | null;
  vacancyId: number | null;
  vacancyTitle: string;
  fullName: string;
  email: string;
  phone: string;
  experience: string;
  cover: string;
  hasResume: boolean;
  resumeName: string | null;
  resumeType: string | null;
  resumeSize: number;
  consentAt: string;
  status: string;
  statusLabel: string;
  notes: string;
  notifyStatus: string;
  createdAt: string;
}

export interface ApplicationList {
  items: Application[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  counts: Record<string, number>;
  vacancies: Opt[];
  retentionMonths: number;
}

export interface AdminVacancy {
  id: number;
  slug: string;
  title: string;
  location: string;
  employmentType: string;
  summary: string;
  description: string;
  requirements: string;
  howToApply: string;
  closesOn: string | null;
  published: boolean;
  sortOrder: number;
  applications: number;
  open: boolean;
  updatedAt: string;
}

export interface AdminService {
  id: number;
  slug: string;
  title: string;
  summary: string;
  overview: string;
  featureHeadline: string;
  image: string | null;
  imageAlt: string;
  imageLabel: string;
  published: boolean;
  sortOrder: number;
  updatedAt: string;
}

export type FieldKind = 'text' | 'textarea' | 'list' | 'select' | 'image';
export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  max?: number;
  options?: Opt[];
  help?: string;
}
export interface ContentTypeDef {
  type: string;
  label: string;
  page: string;
  description: string;
  titleField: string;
  fields: FieldDef[];
  uniqueBy?: string;
}
export interface AdminContentItem {
  id: number;
  type: string;
  sortOrder: number;
  fields: Record<string, unknown>;
  published: boolean;
  updatedAt: string;
}

export interface AdminSettings {
  businessName: string;
  contactName: string;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  tagline: string;
  companyProfile: string;
  privacyPolicy: string;
  termsOfUse: string;
  reviewNote: string;
  inquiriesOpen: boolean;
  applicationsOpen: boolean;
  updatedAt: string;
}
