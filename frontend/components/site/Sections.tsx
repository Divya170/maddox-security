import Link from 'next/link';
import type { PublicSettings } from '@/lib/types';

/** Inner-page dark hero (design PAGE_HEROS). */
export function PageHero({ eyebrow, title, intro, cta, label }: { eyebrow: string; title: string; intro: string; cta?: boolean; label?: string }) {
  return (
    <section aria-labelledby="ph-h" data-screen-label={label || eyebrow} className="dark">
      <div className="gridlines" aria-hidden="true" />
      <div className="phero">
        <div>
          <p className="pill">{eyebrow}</p>
          <h1 id="ph-h">{title}</h1>
        </div>
        <div>
          <p className="intro">{intro}</p>
          {cta && (
            <div>
              <Link href="/contact" className="btn btn-light btn--chip" style={{ minHeight: 54 }}>
                Discuss Your Requirements
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Closing CTA "Let's Discuss Your Security Requirements." (home, services, industries, careers). */
export function ClosingCta({ s }: { s: PublicSettings }) {
  return (
    <section aria-labelledby="cta-h" className="cta-wrap">
      <div className="cta" data-reveal="1">
        <div className="cta__ring" aria-hidden="true" />
        <div className="cta__ring cta__ring--2" aria-hidden="true" />
        <h2 id="cta-h">Let’s Discuss Your Security Requirements.</h2>
        <div className="cta__row">
          <p>Share a few details about your organization and the support you’re considering, and we’ll arrange a conversation.</p>
          <div className="btns">
            <Link href="/contact" className="btn btn-light gold btn--lg btn--chip">
              Request a Service Assessment
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </Link>
            {s.telHref && (
              <a href={s.telHref} className="btn btn-ghost-dark btn--lg" style={{ borderColor: 'rgba(245,244,239,.35)' }}>
                Call {s.phone}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Shared success card with next-action links (every form). */
export function SuccessCard({
  kicker,
  title,
  reference,
  children,
  actions,
  shadow,
  headingRef,
}: {
  kicker: string;
  title: string;
  reference?: string;
  children?: React.ReactNode;
  actions: React.ReactNode;
  shadow?: boolean;
  headingRef?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <div role="status" className={`success${shadow ? ' success--shadow' : ''}`}>
      <p className="success__k">
        <span aria-hidden="true">✓</span>
        {kicker}
      </p>
      <h2 ref={headingRef} tabIndex={-1}>
        {title}
      </h2>
      {reference && (
        <p className="ref">
          Your reference: <b>{reference}</b>
        </p>
      )}
      {children}
      <div className="btns" style={{ marginTop: 6 }}>
        {actions}
      </div>
    </div>
  );
}
