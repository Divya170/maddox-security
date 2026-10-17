import type { Metadata } from 'next';
import Link from 'next/link';
import { getSite } from '@/lib/api';
import { paragraphs } from '@/lib/format';
import { Photo } from '@/components/site/Photo';
import { DraftTag } from '@/components/site/Draft';
import { PageHero } from '@/components/site/Sections';

export const metadata: Metadata = { title: 'Company', description: 'A professional security services provider working with organizations through consultation-led engagement.' };

export default async function CompanyPage() {
  const { settings: s, credentials, images, preview } = await getSite();
  const verified = credentials.filter((c) => !c.draft);
  const pending = credentials.filter((c) => c.draft);
  return (
    <>
      <PageHero label="Company" eyebrow="COMPANY" title={`Meet ${s.businessName}`} intro="A professional security services provider working with organizations through consultation-led engagement." />

      <section aria-label="Company image" className="wrap" style={{ paddingTop: 'clamp(40px,5vw,72px)' }}>
        <div className="band-photo band-photo--sm" data-reveal="1">
          <Photo src={images['company-wide']?.url} alt={images['company-wide']?.alt || 'Commercial building entrance'} label="Architectural exterior — well-maintained commercial building entrance, wide crop" />
        </div>
      </section>

      <section aria-labelledby="appr-h" className="wrap two-col approach" style={{ paddingTop: 'clamp(56px,7vw,104px)', paddingBottom: 'clamp(56px,7vw,104px)' }}>
        <h2 id="appr-h" className="h-sec" style={{ fontSize: 'clamp(30px,3.6vw,50px)', lineHeight: 1.04 }}>
          Professional protection. <span>Operational confidence.</span> Responsible security.
        </h2>
        <div className="text" data-reveal="1">
          <p>{s.businessName} provides professional security services to organizations, including commercial premises and events.</p>
          <p>We begin every engagement with a consultation. That conversation is where we understand your site, your organization, and what you need from a security provider — before anything is agreed.</p>
          {paragraphs(s.companyProfile).map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
          {!s.companyProfile && preview && (
            <div className="draft-box">
              <DraftTag>DRAFT · AWAITING APPROVED COMPANY PROFILE</DraftTag>
              <p>Reserved for owner-approved content: company background, approach, and service standards. Not shown publicly until approved.</p>
            </div>
          )}
        </div>
      </section>

      {(verified.length > 0 || pending.length > 0) && (
        <section aria-labelledby="credd-h" className="wrap col" style={{ paddingBottom: 'clamp(56px,7vw,96px)', gap: 20 }}>
          <div className="flex-wrap" style={{ gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 id="credd-h" className="h-sec" style={{ fontSize: 'clamp(26px,2.8vw,36px)', lineHeight: 1.1 }}>
              Credentials &amp; compliance
            </h2>
            {pending.length > 0 && <DraftTag>DRAFT · EACH ROW PUBLISHES ONLY AFTER VERIFICATION</DraftTag>}
          </div>
          <ul className="creds">
            {[...verified, ...pending].map((c) => (
              <li key={c.id} className={c.draft ? 'is-draft' : ''}>
                <b>{c.label}</b>
                <span>{c.draft ? 'Awaiting verified details — hidden from public' : c.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="cred-h" className="wrap">
        <div className="card-xl contact-card" data-reveal="1">
          <div>
            <p className="eyebrow">CONTACT DETAILS</p>
            <h2 id="cred-h" className="h-sec h-sec--sm">
              Speak with us directly.
            </h2>
            <div style={{ marginTop: 8 }}>
              <Link href="/contact" className="btn btn-navy btn--chip">
                Request a Consultation
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </div>
          <dl className="kv">
            {s.address && (
              <>
                <dt>Address</dt>
                <dd>{s.address}</dd>
              </>
            )}
            {s.mailHref && (
              <>
                <dt>Email</dt>
                <dd>
                  <a href={s.mailHref}>{s.email}</a>
                </dd>
              </>
            )}
            {s.telHref && (
              <>
                <dt>Phone</dt>
                <dd>
                  <a href={s.telHref}>{s.phone}</a>
                </dd>
              </>
            )}
          </dl>
        </div>
      </section>
    </>
  );
}
