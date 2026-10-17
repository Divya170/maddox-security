export const NAV = [
  { label: 'Home', href: '/', key: 'home' },
  { label: 'Services', href: '/services', key: 'services' },
  { label: 'Industries', href: '/industries', key: 'industries' },
  { label: 'Company', href: '/company', key: 'company' },
  { label: 'Careers', href: '/careers', key: 'careers' },
  { label: 'Contact', href: '/contact', key: 'contact' },
] as const;

/** Enquiry form, optionally with the service preselected (design: #/contact?service=guard). */
export const contactHref = (service?: string) => (service ? `/contact?service=${encodeURIComponent(service)}` : '/contact');

/** Services page anchor for one service (design: #/services/guard opens and scrolls to it). */
export const serviceHref = (slug: string) => `/services#svc-${slug}`;
