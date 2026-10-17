import type { Metadata } from 'next';
import Link from 'next/link';
import { getSite } from '@/lib/api';
import { contactHref } from '@/lib/links';
import { Photo } from '@/components/site/Photo';
import { ClosingCta, PageHero } from '@/components/site/Sections';
import { ServiceList } from '@/components/site/ServiceList';

export const metadata: Metadata = { title: 'Services', description: 'Guard services, commercial security, event security and access control — scope agreed with you during consultation.' };

export default async function ServicesPage() {
  const { settings: s, services } = await getSite();
  const feature = services.find((x) => !x.draft) || services[0];
  return (
    <>
      <PageHero
        label="Services"
        eyebrow="SERVICES"
        title="Security Services for Your Organization"
        intro="Explore the services below, then get in touch to discuss your requirements. Scope is agreed with you during consultation, based on your site and how your organization operates."
        cta
      />

      {feature && (
        <section aria-label="Featured service" className="wrap" style={{ paddingTop: 'clamp(40px,5vw,72px)' }}>
          <div className="feature" data-reveal="1">
            <div className="feature__img">
              <Photo src={feature.image} alt={feature.imageAlt} label={feature.imageLabel} />
            </div>
            <div className="feature__body">
              <p className="eyebrow">
                {feature.num} — {feature.title.toUpperCase()}
              </p>
              <h2>{feature.featureHeadline}</h2>
              <p className="d">{feature.summary}</p>
              <div style={{ marginTop: 6 }}>
                <Link href={contactHref(feature.slug)} className="btn btn-navy btn--chip">
                  Discuss {feature.title}
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="cat-h" className="wrap" style={{ paddingTop: 'clamp(64px,8vw,112px)' }}>
        <div className="eyebrow eyebrow--rule" style={{ marginBottom: 24 }}>
          <h2 id="cat-h" style={{ font: 'inherit', letterSpacing: 'inherit' }}>
            ALL SERVICES
          </h2>
        </div>
        {services.length ? (
          <ServiceList services={services} />
        ) : (
          <p className="body">Service details are being updated. Please get in touch to discuss your requirements.</p>
        )}
      </section>

      <ClosingCta s={s} />
    </>
  );
}
