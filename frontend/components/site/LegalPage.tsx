import type { PublicSettings } from '@/lib/types';
import { paragraphs } from '@/lib/format';
import { PageHero } from './Sections';

/** Privacy / Terms: approved text from Settings, or the design's "being finalized" note. */
export function LegalPage({ title, intro, text, s }: { title: string; intro: string; text: string; s: PublicSettings }) {
  const paras = paragraphs(text);
  return (
    <>
      <PageHero label="Legal" eyebrow="LEGAL" title={title} intro={intro} />
      <section className="legal">
        <div className="card-xl">
          {paras.length ? (
            paras.map((p) => <p key={p.slice(0, 40)}>{p}</p>)
          ) : (
            <p>
              This document is being finalized and will be published here once approved.
              {s.mailHref && (
                <>
                  {' '}
                  In the meantime, questions about how your information is handled can be sent to <a href={s.mailHref}>{s.email}</a>.
                </>
              )}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
