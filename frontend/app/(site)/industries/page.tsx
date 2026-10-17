import type { Metadata } from 'next';
import Link from 'next/link';
import { getSite } from '@/lib/api';
import { serviceHref } from '@/lib/links';
import { Photo } from '@/components/site/Photo';
import { DraftTag } from '@/components/site/Draft';
import { ClosingCta, PageHero } from '@/components/site/Sections';

export const metadata: Metadata = { title: 'Industries', description: 'Security for the environments you operate in — tell us about your site.' };

export default async function IndustriesPage() {
  const { settings: s, services, industries } = await getSite();
  const published = industries.filter((i) => !i.draft);
  const drafts = industries.filter((i) => i.draft); // present only in staff preview
  const live = services.filter((x) => !x.draft);

  const rows = (list: typeof industries) =>
    list.map((x) => (
      <article key={x.id} className="ind-row" data-reveal="1">
        <div className="ind-row__img">
          <Photo src={x.image} alt={x.alt || x.name} label={x.photo || x.name} />
        </div>
        <div className="ind-row__body">
          <h3>{x.name}</h3>
          <p>{x.body}</p>
          {x.related && <p className="rel">Related services: {x.related}</p>}
          <div>
            <Link href="/contact" className="tlink">
              Discuss a site assessment <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </article>
    ));

  return (
    <>
      <PageHero
        label="Industries"
        eyebrow="INDUSTRIES"
        title="Security for the Environments You Operate In"
        intro="Every site has its own layout, visitors, and daily rhythm. Tell us about yours and we’ll talk through whether our services are the right fit for your organization."
        cta
      />

      {published.length > 0 && (
        <section aria-labelledby="ind-pub-h" className="wrap stack" style={{ paddingTop: 'clamp(64px,8vw,112px)' }}>
          <h2 id="ind-pub-h" className="h-sec h-sec--sm" style={{ marginBottom: 12 }}>
            Sectors we work with
          </h2>
          {rows(published)}
        </section>
      )}

      {published.length === 0 && (
        <section aria-labelledby="ind-svc-h" className="wrap two-col" style={{ paddingTop: 'clamp(64px,8vw,112px)' }}>
          <div className="col" style={{ gap: 20 }}>
            <h2 id="ind-svc-h" className="h-sec" style={{ fontSize: 'clamp(30px,3.4vw,46px)' }}>
              Start with the service, then tell us about the site.
            </h2>
            <p className="lead" style={{ maxWidth: '30em' }}>
              Choose a service to learn more, or include your site type in the enquiry form.
            </p>
          </div>
          <ul className="svc-links">
            {live.map((x) => (
              <li key={x.slug}>
                <Link href={serviceHref(x.slug)}>
                  {x.title}
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {drafts.length > 0 && (
        <section aria-labelledby="ind-cat-h" className="wrap stack" style={{ paddingTop: 'clamp(64px,8vw,112px)' }}>
          <div className="flex-wrap" style={{ gap: 16, alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 id="ind-cat-h" className="h-sec h-sec--sm">
              Candidate sectors
            </h2>
            <DraftTag>DRAFT · OWNER TO CONFIRM BEFORE PUBLICATION</DraftTag>
          </div>
          {rows(drafts)}
        </section>
      )}

      <ClosingCta s={s} />
    </>
  );
}
