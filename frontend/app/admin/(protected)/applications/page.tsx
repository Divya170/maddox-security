'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError, downloadCsv } from '@/lib/client-api';
import { useDebounced } from '@/lib/hooks';
import { APPLICATION_STATUSES, formatShort } from '@/lib/format';
import type { ApplicationList } from '@/lib/types';
import { useAdmin } from '@/components/admin/AdminContext';
import { ErrorBox } from '@/components/admin/ui';
import { Empty, Pager, Skeleton, StatusTabs } from '@/components/admin/ListParts';

const PER = 10;

export default function ApplicationsPage() {
  const { toast, refreshCounts } = useAdmin();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [vacancy, setVacancy] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ApplicationList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const dq = useDebounced(q, 300);

  const params = useCallback(
    (extra: Record<string, string> = {}) => {
      const p = new URLSearchParams({ q: dq, status, vacancy, sort, ...extra });
      for (const [k, v] of Array.from(p.entries())) if (!v) p.delete(k);
      return p.toString();
    },
    [dq, status, vacancy, sort],
  );

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api<ApplicationList>(`/admin/applications?${params({ page: String(page), limit: String(PER) })}`, { admin: true })
      .then((d) => {
        setData(d);
        if (d.page !== page) setPage(d.page);
      })
      .catch((e: ClientApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params, page]);
  useEffect(load, [load]);
  useEffect(() => setPage(1), [dq, status, vacancy, sort]);
  useEffect(() => refreshCounts(), [data, refreshCounts]);

  const items = data?.items || [];
  const filtered = !!(q || status || vacancy);

  return (
    <div>
      <div className="adm-head">
        <div>
          <h1 className="adm-h1">Job applications</h1>
          <p className="adm-sub">{data ? `${data.counts.all ?? 0} total · ${data.counts.new ?? 0} new` : 'Loading…'}</p>
        </div>
        {data && <StatusTabs tabs={APPLICATION_STATUSES} counts={data.counts} value={status} onChange={setStatus} />}
      </div>
      <p className="alert-info">Applications contain personal information. Résumés are stored privately and can only be downloaded here by signed-in staff.</p>

      <div className="adm-filters">
        <div className="field wide">
          <label htmlFor="q">Search name, email, phone, position or reference</label>
          <input id="q" type="search" className="control" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="fv">Vacancy</label>
          <select id="fv" className="control" value={vacancy} onChange={(e) => setVacancy(e.target.value)}>
            <option value="">All vacancies</option>
            {(data?.vacancies || []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="so">Sort</label>
          <select id="so" className="control" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <div className="field" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="abtn abtn--line"
            disabled={!data?.total}
            onClick={() => downloadCsv(`/admin/applications/export.csv?${params()}`, `maddox-applications-${new Date().toISOString().slice(0, 10)}.csv`).catch((e: ClientApiError) => toast(e.message, true))}
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && <ErrorBox message={error} onRetry={load} />}
      {loading && !data && !error && <Skeleton label="Loading applications" />}
      {data && !error && items.length === 0 && (
        <Empty
          filtered={filtered}
          none="No applications yet. They appear here once a vacancy is published and someone applies."
          onClear={() => {
            setQ('');
            setStatus('');
            setVacancy('');
          }}
        />
      )}
      {data && items.length > 0 && (
        <div aria-busy={loading} style={{ opacity: loading ? 0.6 : 1 }}>
          <div className="ltable-wrap only-wide">
            <table className="ltable">
              <caption className="sr-only">Job applications</caption>
              <thead>
                <tr>
                  <th scope="col">Received</th>
                  <th scope="col">Applicant</th>
                  <th scope="col">Position</th>
                  <th scope="col">Résumé</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatShort(a.createdAt)}</td>
                    <td>
                      <Link href={`/admin/applications/${a.id}`}>{a.fullName}</Link>
                      <div className="ref">{a.publicRef}</div>
                    </td>
                    <td>{a.vacancyTitle}</td>
                    <td>{a.hasResume ? 'Attached' : '—'}</td>
                    <td>
                      <span className={`st st--${a.status}`}>{a.statusLabel}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="lcards only-narrow">
            {items.map((a) => (
              <li key={a.id}>
                <Link href={`/admin/applications/${a.id}`} className="lcard">
                  <div className="lcard__top">
                    <span className="lcard__name">{a.fullName}</span>
                    <span className={`st st--${a.status}`}>{a.statusLabel}</span>
                  </div>
                  <div className="lcard__l">{a.vacancyTitle}</div>
                  <div className="lcard__m">
                    {formatShort(a.createdAt)}
                    {a.hasResume ? ' · résumé attached' : ''}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pager page={data.page} pages={data.pages} total={data.total} per={PER} onPage={setPage} />
        </div>
      )}
      {data && data.retentionMonths > 0 && <p className="help" style={{ marginTop: 16 }}>Unsuccessful and archived applications (and their résumés) are deleted automatically {data.retentionMonths} months after they were closed.</p>}
    </div>
  );
}
