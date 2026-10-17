'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError, downloadCsv } from '@/lib/client-api';
import { useDebounced } from '@/lib/hooks';
import { formatShort, INQUIRY_STATUSES } from '@/lib/format';
import type { InquiryList } from '@/lib/types';
import { useAdmin } from '@/components/admin/AdminContext';
import { ErrorBox } from '@/components/admin/ui';
import { Empty, Pager, Skeleton, StatusTabs } from '@/components/admin/ListParts';

const PER = 10;

export default function InquiriesPage() {
  const { toast, refreshCounts } = useAdmin();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [service, setService] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<InquiryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const dq = useDebounced(q, 300);

  const params = useCallback(
    (extra: Record<string, string> = {}) => {
      const p = new URLSearchParams({ q: dq, status, service, sort, ...extra });
      for (const [k, v] of Array.from(p.entries())) if (!v) p.delete(k);
      return p.toString();
    },
    [dq, status, service, sort],
  );

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api<InquiryList>(`/admin/inquiries?${params({ page: String(page), limit: String(PER) })}`, { admin: true })
      .then((d) => {
        setData(d);
        if (d.page !== page) setPage(d.page);
      })
      .catch((e: ClientApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params, page]);
  useEffect(load, [load]);
  useEffect(() => setPage(1), [dq, status, service, sort]);
  useEffect(() => refreshCounts(), [data, refreshCounts]);

  const filtered = !!(q || status || service);
  const items = data?.items || [];

  return (
    <div>
      <div className="adm-head">
        <div>
          <h1 className="adm-h1">Service enquiries</h1>
          <p className="adm-sub">{data ? `${data.counts.all ?? 0} total · ${data.counts.new ?? 0} new` : 'Loading…'}</p>
        </div>
        {data && <StatusTabs tabs={INQUIRY_STATUSES} counts={data.counts} value={status} onChange={setStatus} />}
      </div>

      <div className="adm-filters">
        <div className="field wide">
          <label htmlFor="q">Search company, name, email, phone, location or reference</label>
          <input id="q" type="search" className="control" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="fs">Service</label>
          <select id="fs" className="control" value={service} onChange={(e) => setService(e.target.value)}>
            <option value="">All services</option>
            {(data?.services || []).map((o) => (
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
            onClick={() => downloadCsv(`/admin/inquiries/export.csv?${params()}`, `maddox-enquiries-${new Date().toISOString().slice(0, 10)}.csv`).catch((e: ClientApiError) => toast(e.message, true))}
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && <ErrorBox message={error} onRetry={load} />}
      {loading && !data && !error && <Skeleton label="Loading enquiries" />}
      {data && !error && items.length === 0 && (
        <Empty
          filtered={filtered}
          none="No enquiries yet. Submissions from the contact form appear here."
          onClear={() => {
            setQ('');
            setStatus('');
            setService('');
          }}
        />
      )}

      {data && items.length > 0 && (
        <div aria-busy={loading} style={{ opacity: loading ? 0.6 : 1 }}>
          <div className="ltable-wrap only-wide">
            <table className="ltable">
              <caption className="sr-only">Service enquiries, {sort === 'newest' ? 'newest first' : 'oldest first'}</caption>
              <thead>
                <tr>
                  <th scope="col">Received</th>
                  <th scope="col">Company</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Service</th>
                  <th scope="col">Location</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatShort(x.createdAt)}</td>
                    <td>
                      <Link href={`/admin/inquiries/${x.id}`}>{x.company}</Link>
                      <div className="ref">{x.publicRef}</div>
                    </td>
                    <td>
                      <div>{x.name}</div>
                      <div className="sub">{x.email}</div>
                    </td>
                    <td>{x.serviceLabel}</td>
                    <td>{x.location}</td>
                    <td>
                      <span className={`st st--${x.status}`}>{x.statusLabel}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="lcards only-narrow">
            {items.map((x) => (
              <li key={x.id}>
                <Link href={`/admin/inquiries/${x.id}`} className="lcard">
                  <div className="lcard__top">
                    <span className="lcard__name">{x.company}</span>
                    <span className={`st st--${x.status}`}>{x.statusLabel}</span>
                  </div>
                  <div className="lcard__l">
                    {x.serviceLabel} · {x.location}
                  </div>
                  <div className="lcard__m">
                    {formatShort(x.createdAt)} · {x.name}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pager page={data.page} pages={data.pages} total={data.total} per={PER} onPage={setPage} />
        </div>
      )}
      {data && data.retentionMonths > 0 && <p className="help" style={{ marginTop: 16 }}>Archived, responded and spam enquiries are deleted automatically {data.retentionMonths} months after they were closed.</p>}
    </div>
  );
}
