import type { Metadata } from 'next';
import Link from 'next/link';
import { getSite, getVacancy } from '@/lib/api';
import { formatDay } from '@/lib/format';
import { DraftTag } from '@/components/site/Draft';
import { ApplicationForm } from '@/components/forms/ApplicationForm';

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const v = await getVacancy(params.slug).catch(() => null);
  return { title: v ? `${v.title} — Careers` : 'Vacancy' };
}

export default async function VacancyPage({ params }: Params) {
  const [{ settings: s }, v] = await Promise.all([getSite(), getVacancy(params.slug)]);
  return (
    <section aria-labelledby="vd-h" data-screen-label="Vacancy" className="vacancy">
      <Link href="/careers" className="back">
        <span aria-hidden="true">←</span> All vacancies
      </Link>

      {!v ? (
        <div className="gone">
          <h1 id="vd-h">This vacancy is no longer available.</h1>
          <p>The position may have closed or been removed. Applications can only be submitted for currently published roles.</p>
          <div>
            <Link href="/careers" className="btn btn-outline" style={{ minHeight: 50 }}>
              View current vacancies
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="col" style={{ gap: 16 }}>
            {v.draft && <DraftTag>DRAFT · STAFF PREVIEW · NOT PUBLISHED</DraftTag>}
            <h1 id="vd-h">{v.title}</h1>
            <div className="chips">
              <span>Location: {v.location || 'to be confirmed'}</span>
              <span>Type: {v.employmentType || 'to be confirmed'}</span>
              {v.closesOn && <span>Closes {formatDay(v.closesOn)}</span>}
            </div>
          </div>
          <div className="role">
            <h2>About the role</h2>
            <p>{v.description || '[Approved job description, responsibilities, and requirements appear here once published by the recruitment manager.]'}</p>
            {v.requirements && (
              <>
                <h2>Requirements</h2>
                <p>{v.requirements}</p>
              </>
            )}
            {v.howToApply && (
              <>
                <h2>How to apply</h2>
                <p>{v.howToApply}</p>
              </>
            )}
          </div>

          {v.draft ? (
            <div className="gone">
              <p>Preview only — the application form opens once this vacancy is published.</p>
            </div>
          ) : !v.open ? (
            <div className="gone">
              <p>This vacancy has closed and is no longer accepting applications.</p>
            </div>
          ) : !v.applicationsOpen ? (
            <div className="gone">
              <p>
                Online applications are paused right now. {s.mailHref ? <>Please contact <a href={s.mailHref}>{s.email}</a>.</> : null}
              </p>
            </div>
          ) : (
            <ApplicationForm slug={v.slug} title={v.title} businessName={s.businessName} />
          )}
        </>
      )}
    </section>
  );
}
