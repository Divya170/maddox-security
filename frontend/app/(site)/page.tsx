import Link from 'next/link';
import { getSite } from '@/lib/api';
import { serviceHref } from '@/lib/links';
import { Photo } from '@/components/site/Photo';
import { DraftTag } from '@/components/site/Draft';
import { ClosingCta } from '@/components/site/Sections';

export default async function HomePage() {
  const { settings: s, services, strip, steps, industries, vacancies, images, preview } = await getSite();
  const [first, ...others] = services;
  const sectors = industries.filter((i) => preview || !i.draft);
  const sectorsAllDraft = sectors.length > 0 && sectors.every((i) => i.draft);
  const RATIOS = ['4/5', '1/1', '4/5', '3/4', '1/1'];

  return (
    <>
      <section aria-labelledby="hero-h" data-screen-label="Home" className="dark">
        <div className="gridlines" aria-hidden="true" />
        <div className="hero">
          <div className="hero__copy">
            <div>
              <p className="pill">{s.businessName.toUpperCase()}</p>
              <h1 id="hero-h">
                Professional Security. <span>Confidence</span> for Your Business.
              </h1>
              <p className="hero__lead">Explore security services designed around your organization&apos;s needs, property, and operating environment.</p>
              <div className="btns">
                <Link href="/contact" className="btn btn-light btn--lg btn--chip" style={{ paddingRight: 10 }}>
                  Request a Consultation
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
                <Link href="/services" className="btn btn-ghost-dark btn--lg">
                  Explore Our Services
                </Link>
              </div>
            </div>
            {strip.length > 0 && (
              <ul className="strip">
                {strip.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="hero__media">
            <div className="hero__photo">
              <Photo dark src={images['hero-photo']?.url} alt={images['hero-photo']?.alt || 'Security professional at an office entrance'} label="Hero photo — uniformed security professional at a contemporary office entrance, natural light" />
            </div>
            {s.telHref && (
              <div className="talk">
                <p>PREFER TO TALK?</p>
                <a href={s.telHref}>{s.phone}</a>
                <p>Call to discuss your organization&apos;s requirements.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="stmt-h" className="wrap statement" data-reveal="1">
        <h2 id="stmt-h">
          Security that supports business confidence<span> — shaped around your site, your people, and the way you operate.</span>
        </h2>
      </section>

      <section aria-labelledby="svc-h" className="wrap" style={{ paddingBottom: 'clamp(80px,9vw,140px)' }}>
        <div className="sec-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span className="eyebrow eyebrow--rule">SERVICES</span>
            <h2 id="svc-h">What we can help with</h2>
          </div>
          <Link href="/services" className="tlink">
            View all services <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="bento">
          {first && (
            <Link href={serviceHref(first.slug)} className="svc-big" data-reveal="1">
              <div className="svc-big__img">
                <Photo dark src={first.image} alt={first.imageAlt} label={first.imageLabel} />
              </div>
              <div className="svc-big__shade" aria-hidden="true" />
              <div className="svc-big__body">
                <span className="num">{first.num}</span>
                <span className="svc-big__t">{first.title}</span>
                {first.draft && <DraftTag light>DRAFT · PENDING CONFIRMATION</DraftTag>}
                <span className="svc-big__s">{first.summary}</span>
              </div>
            </Link>
          )}
          {others.map((x) => (
            <Link key={x.slug} href={serviceHref(x.slug)} className="svc-card" data-reveal="1">
              <div className="svc-card__top">
                <span className="num">{x.num}</span>
                <span className="svc-card__ic" aria-hidden="true">
                  ↗
                </span>
              </div>
              <div className="svc-card__body">
                <span className="svc-card__t">{x.title}</span>
                {x.draft && <DraftTag>DRAFT · PENDING CONFIRMATION</DraftTag>}
                <span className="svc-card__s">{x.summary}</span>
              </div>
            </Link>
          ))}
          <Link href="/contact" className="svc-gold" data-reveal="1">
            <span>NOT SURE YET?</span>
            <span className="svc-gold__row">
              <span>Discuss Your Security Requirements</span>
              <span aria-hidden="true">→</span>
            </span>
          </Link>
        </div>
      </section>

      {steps.length > 0 && (
        <section aria-labelledby="proc-h" className="proc">
          <div className="proc__in">
            <div className="proc__intro">
              <p className="eyebrow eyebrow--rule">HOW AN ENQUIRY WORKS</p>
              <h2 id="proc-h" className="h-sec">
                A clear first conversation.
              </h2>
              <p className="lead">An outline of how most enquiries begin. Every organization is different, and next steps are agreed with you directly.</p>
              <div>
                <Link href="/contact" className="btn btn-navy btn--chip">
                  Start a Service Assessment
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>
            </div>
            <ol className="steps">
              {steps.map((st, i) => (
                <li key={st.id} data-reveal="1">
                  <span className="n">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{st.title}</h3>
                    <p>{st.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section aria-label="Company image" className="wrap" style={{ paddingTop: 'clamp(16px,2vw,24px)' }}>
        <div className="band-photo" data-reveal="1">
          <Photo src={images['home-band']?.url} alt={images['home-band']?.alt || 'Commercial lobby with a security professional greeting a visitor'} label="Wide architectural photo — commercial lobby with security professional greeting a visitor" />
        </div>
      </section>

      <section aria-labelledby="co-h" className="wrap two-col company-intro">
        <div className="col" style={{ gap: 20 }}>
          <p className="eyebrow eyebrow--rule">THE COMPANY</p>
          <h2 id="co-h" className="h-sec h-sec--md">
            Professional Service Starts With Clear Expectations.
          </h2>
        </div>
        <div className="col" data-reveal="1" style={{ gap: 24, maxWidth: '36em', paddingTop: 8 }}>
          <p className="big">
            {s.businessName} works with organizations that need a professional security presence. Engagements begin with a consultation, so the service is shaped around your premises and the way you operate.
          </p>
          <div>
            <Link href="/company" className="tlink">
              Learn About {s.businessName} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {sectors.length > 0 && (
        <section aria-labelledby="ind-prev-h" className="wrap col" style={{ paddingBottom: 'clamp(80px,9vw,128px)', gap: 28 }}>
          <div className="flex-wrap" style={{ gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 id="ind-prev-h" className="h-sec h-sec--sm">
              Environments we can discuss
            </h2>
            {sectorsAllDraft && <DraftTag>DRAFT · HIDDEN UNTIL SECTORS ARE CONFIRMED</DraftTag>}
          </div>
          <div className="ind-prev">
            {sectors.map((x, i) => (
              <Link key={x.id} href="/industries">
                <div style={{ aspectRatio: RATIOS[i % RATIOS.length], borderRadius: 16, overflow: 'hidden' }}>
                  <Photo src={x.image} alt={x.alt || x.name} label={x.photo || x.name} />
                </div>
                <span>
                  {x.name} {x.draft && !sectorsAllDraft && <DraftTag />}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="car-prev-h" className="wrap">
        <div className="panel" data-reveal="1">
          <div>
            <p className="eyebrow">CAREERS</p>
            <h2 id="car-prev-h">Interested in working with us?</h2>
            <p className="lead" style={{ maxWidth: 'none' }}>
              {vacancies.some((v) => !v.draft)
                ? 'Approved vacancies are listed on the Careers page with details and an online application.'
                : 'There are no published vacancies at present. Approved openings will be listed on the Careers page.'}
            </p>
          </div>
          <Link href="/careers" className="btn btn-outline">
            Explore Careers <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <ClosingCta s={s} />
    </>
  );
}
