import type { Metadata } from 'next';
import Link from 'next/link';
import { getSite } from '@/lib/api';
import { formatDay } from '@/lib/format';
import { Photo } from '@/components/site/Photo';
import { DraftTag } from '@/components/site/Draft';
import { ClosingCta, PageHero } from '@/components/site/Sections';

export const metadata: Metadata = { title: 'Careers', description: 'Explore approved vacancies and apply online.' };

export default async function CareersPage() {
  const { settings: s, vacancies, images } = await getSite();
  const live = vacancies.filter((v) => !v.draft).length;
  return (
    <>
      <PageHero label="Careers" eyebrow="CAREERS" title={`Build Your Career With ${s.businessName}`} intro="Explore approved vacancies and apply online. Each listing explains the role and how to apply." />

      <section aria-labelledby="vac-h" className="wrap vac-grid" style={{ paddingTop: 'clamp(40px,5vw,72px)' }}>
        <div className="vac-photo" data-reveal="1">
          <Photo src={images['careers-photo']?.url} alt={images['careers-photo']?.alt || 'Security professional at work in a commercial reception'} label="Security professional at work in a commercial reception — approachable, natural light" />
        </div>
        <div className="vac-box">
          <div className="vac-box__head">
            <h2 id="vac-h" className="h-sec" style={{ fontSize: 'clamp(26px,2.8vw,36px)', lineHeight: 1.1 }}>
              Current vacancies
            </h2>
            <span className="count-chip">{live === 0 ? '0 open' : live === 1 ? '1 listing' : `${live} listings`}</span>
          </div>
          {vacancies.length === 0 ? (
            <div className="empty-box">
              <p>There are no published vacancies at present.</p>
              <p className="body">When an opening is approved, it will be listed here with full details and an online application.</p>
            </div>
          ) : (
            <ul className="vac-list">
              {vacancies.map((v) => (
                <li key={v.slug}>
                  <Link href={`/careers/${v.slug}`} className="vac-item">
                    {v.draft && <DraftTag>DRAFT · STAFF PREVIEW · NOT PUBLISHED</DraftTag>}
                    <span className="vac-item__row">
                      <span className="vac-item__t">{v.title}</span>
                      <span className="vac-item__go" aria-hidden="true">
                        →
                      </span>
                    </span>
                    <span className="vac-item__m">
                      Location: {v.location || 'to be confirmed'} · Type: {v.employmentType || 'to be confirmed'}
                      {v.closesOn ? ` · Closes ${formatDay(v.closesOn)}` : ''}
                    </span>
                    {v.summary && <span className="body" style={{ fontSize: 15 }}>{v.summary}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <ClosingCta s={s} />
    </>
  );
}
