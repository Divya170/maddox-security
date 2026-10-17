'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Service } from '@/lib/types';
import { contactHref } from '@/lib/links';
import { DraftTag } from './Draft';

/**
 * "ALL SERVICES" accordion. `/services#svc-guard` (home cards, footer) opens that panel and
 * scrolls to it, like the design's #/services/guard route.
 */
export function ServiceList({ services }: { services: Service[] }) {
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const fromHash = () => {
      const m = /^#svc-([\w-]+)$/.exec(window.location.hash);
      if (!m) return;
      setOpen(m[1]);
      requestAnimationFrame(() => {
        const el = document.getElementById(`svc-${m[1]}`);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96 });
      });
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  return (
    <ul className="acc">
      {services.map((s) => {
        const isOpen = open === s.slug;
        const panel = `svc-panel-${s.slug}`;
        return (
          <li key={s.slug} id={`svc-${s.slug}`} data-reveal="1" className={isOpen ? 'is-open' : ''}>
            <div className="acc__row">
              <span className="num">{s.num}</span>
              <h3>
                {s.title}
                {s.draft && <DraftTag />}
              </h3>
              <p>{s.summary}</p>
              <button type="button" className="acc__btn" aria-expanded={isOpen} aria-controls={panel} onClick={() => setOpen(isOpen ? null : s.slug)}>
                {isOpen ? 'Hide details' : 'Service details'}
                <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
              </button>
            </div>
            {isOpen && (
              <div id={panel} className="acc__panel">
                <div>
                  <h4>OVERVIEW</h4>
                  <p style={{ whiteSpace: 'pre-line' }}>{s.overview}</p>
                </div>
                <div>
                  <h4>HELPFUL TO SHARE IN YOUR ENQUIRY</h4>
                  <ul>
                    <li>The type of site, property, or event</li>
                    <li>The general city or service area</li>
                    <li>The kind of support you’re considering</li>
                  </ul>
                </div>
                <div style={{ alignItems: 'flex-start', gap: 16 }}>
                  <p className="note">Inclusions and arrangements are confirmed with you during consultation.</p>
                  {s.draft ? (
                    <p className="note">Draft service — enquiries open once it is published.</p>
                  ) : (
                    <Link href={contactHref(s.slug)} className="btn btn-navy btn--chip" style={{ minHeight: 50 }}>
                      Discuss {s.title}
                      <span className="arrow" aria-hidden="true" style={{ width: 34, height: 34, borderRadius: 8 }}>
                        →
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
