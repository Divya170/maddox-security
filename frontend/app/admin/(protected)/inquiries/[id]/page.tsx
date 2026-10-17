'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import { formatShort, INQUIRY_STATUSES, NOTIFY_TEXT } from '@/lib/format';
import type { Inquiry } from '@/lib/types';
import { useAdmin } from '@/components/admin/AdminContext';
import { ConfirmDialog, ErrorBox } from '@/components/admin/ui';
import { Skeleton } from '@/components/admin/ListParts';
import { RecordSide } from '@/components/admin/RecordSide';

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast, refreshCounts } = useAdmin();
  const [x, setX] = useState<Inquiry | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState('');
  const [del, setDel] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(() => {
    setError('');
    api<Inquiry>(`/admin/inquiries/${encodeURIComponent(id)}`, { admin: true })
      .then(setX)
      .catch((e: ClientApiError) => (e.status === 404 || e.status === 400 ? setMissing(true) : setError(e.message)));
  }, [id]);
  useEffect(load, [load]);

  const save = async (body: { status?: string; notes?: string }) => {
    try {
      const r = await api<Inquiry>(`/admin/inquiries/${x!.id}`, { method: 'PATCH', body, admin: true });
      setX(r);
      refreshCounts();
      if (body.notes !== undefined) toast('Notes saved.');
      return `Status updated to ${r.statusLabel}.`;
    } catch (e) {
      toast((e as ClientApiError).message, true);
    }
  };

  const Field = ({ k, children, span }: { k: string; children: React.ReactNode; span?: boolean }) => (
    <div className={span ? 'span' : ''}>
      <dt>{k}</dt>
      <dd>{children}</dd>
    </div>
  );

  return (
    <div>
      <Link href="/admin/inquiries" className="backlink">
        ← All enquiries
      </Link>
      {missing && (
        <div className="adm-panel" style={{ marginTop: 12, padding: 32 }}>
          <h1 className="adm-h1" style={{ fontSize: 24 }}>
            Enquiry not found
          </h1>
          <p style={{ margin: '8px 0 0' }}>It may have been deleted. Return to the list to continue.</p>
        </div>
      )}
      {error && <ErrorBox message={error} onRetry={load} />}
      {!x && !missing && !error && <Skeleton label="Loading enquiry" />}
      {x && (
        <div className="detail">
          <div className="detail__main">
            <div className="detail__head">
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>
                  {x.publicRef} · received {formatShort(x.createdAt)}
                </p>
                <h1>{x.company}</h1>
              </div>
              <span className={`st st--${x.status}`}>{x.statusLabel}</span>
            </div>
            <dl className="dfields">
              <Field k="Contact name">{x.name}</Field>
              <Field k="Business email">
                <a href={`mailto:${x.email}`}>{x.email}</a>
              </Field>
              <Field k="Phone">{x.phone ? <a href={`tel:${x.phone.replace(/[^\d+]/g, '')}`}>{x.phone}</a> : '—'}</Field>
              <Field k="Service type">{x.serviceLabel}</Field>
              <Field k="Coverage location">{x.location}</Field>
              <Field k="Site or service type">{x.site || '—'}</Field>
              <Field k="Service requirements" span>
                {x.requirements}
              </Field>
              <Field k="Additional message" span>
                {x.message || 'None provided'}
              </Field>
              <Field k="Privacy acknowledgement">Agreed {formatShort(x.consentAt)}</Field>
            </dl>
          </div>
          <div className="detail__side">
            <RecordSide status={x.status} statuses={INQUIRY_STATUSES} notes={x.notes} onSave={save} />
            <div className="sidebox">
              <h2 className="h-card">Notification</h2>
              <p>{NOTIFY_TEXT[x.notifyStatus]}</p>
              {x.notifyStatus === 'failed' && (
                <button
                  type="button"
                  className="abtn abtn--line abtn--sm"
                  disabled={retrying}
                  onClick={async () => {
                    setRetrying(true);
                    try {
                      setX(await api<Inquiry>(`/admin/inquiries/${x.id}/notify`, { method: 'POST', admin: true }));
                    } catch (e) {
                      toast((e as ClientApiError).message, true);
                    } finally {
                      setRetrying(false);
                    }
                  }}
                >
                  {retrying ? 'Retrying…' : 'Retry now'}
                </button>
              )}
            </div>
            <div className="adm-actions">
              <a href={`mailto:${x.email}?subject=${encodeURIComponent(`Your security enquiry ${x.publicRef}`)}`} className="abtn">
                Email contact
              </a>
              {x.phone && (
                <a href={`tel:${x.phone.replace(/[^\d+]/g, '')}`} className="abtn abtn--line">
                  Call
                </a>
              )}
              <button type="button" className="abtn abtn--danger" onClick={() => setDel(true)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {del && x && (
        <ConfirmDialog
          title="Delete this enquiry?"
          message={`${x.publicRef} from ${x.company} will be permanently removed. This can’t be undone.`}
          onCancel={() => setDel(false)}
          onConfirm={async () => {
            try {
              await api(`/admin/inquiries/${x.id}`, { method: 'DELETE', admin: true });
              toast('Enquiry deleted.');
              refreshCounts();
              router.replace('/admin/inquiries');
            } catch (e) {
              toast((e as ClientApiError).message, true);
              setDel(false);
            }
          }}
        />
      )}
    </div>
  );
}
