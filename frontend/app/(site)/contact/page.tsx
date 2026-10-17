import type { Metadata } from 'next';
import Link from 'next/link';
import { getInquiryOptions, getSite } from '@/lib/api';
import { EnquiryForm } from '@/components/forms/EnquiryForm';

export const metadata: Metadata = { title: 'Request a Security Service Assessment', description: 'Tell us a little about your organization and the type of security support you’re considering.' };

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || '';

export default async function ContactPage({ searchParams }: { searchParams: SP }) {
  const [{ settings: s }, options] = await Promise.all([getSite(), getInquiryOptions()]);
  const wanted = one(searchParams.service);
  const preService = options.services.some((o) => o.value === wanted && o.value !== 'unsure') ? wanted : '';
  return (
    <>
      <section aria-labelledby="ct-h" data-screen-label="Contact" className="dark" style={{ overflow: 'visible' }}>
        <div className="gridlines" aria-hidden="true" />
        <div className="ct-hero">
          <div>
            <p className="pill">SERVICE ASSESSMENT</p>
            <h1 id="ct-h">Request a Security Service Assessment</h1>
          </div>
          <p>Tell us a little about your organization and the type of security support you&apos;re considering.</p>
        </div>
      </section>

      <section aria-label="Enquiry form and contact details" className="ct-grid">
        <div className="ct-main">
          <EnquiryForm
            services={options.services}
            preService={preService}
            open={options.open}
            businessName={s.businessName}
            phone={s.phone}
            telHref={s.telHref}
            email={s.email}
            mailHref={s.mailHref}
          />
        </div>
        <aside aria-label="Direct contact" className="col" style={{ gap: 16, minWidth: 0 }}>
          <div className="aside-dark">
            <h2>CONTACT DIRECTLY</h2>
            {s.telHref && (
              <a href={s.telHref}>
                <small>Phone</small>
                <strong>{s.phone}</strong>
              </a>
            )}
            {s.mailHref && (
              <a href={s.mailHref} className="mail">
                <small>Email</small>
                <strong>{s.email}</strong>
              </a>
            )}
            {(s.addressLine1 || s.addressLine2) && (
              <div className="cell">
                <small>Address</small>
                <address>
                  {s.addressLine1}
                  {s.addressLine1 && s.addressLine2 && <br />}
                  {s.addressLine2}
                </address>
              </div>
            )}
          </div>
          <div className="aside-note">
            <p>Looking for a job?</p>
            <p>
              This form is for service enquiries. For employment, please visit <Link href="/careers">Careers</Link>.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
