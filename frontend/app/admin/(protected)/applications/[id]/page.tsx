'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError, downloadFile } from '@/lib/client-api';
import { APPLICATION_STATUSES, fileSize, formatShort } from '@/lib/format';
import type { Application } from '@/lib/types';
import { useAdmin } from '@/components/admin/AdminContext';
import { ConfirmDialog, ErrorBox } from '@/components/admin/ui';
import { Skeleton } from '@/components/admin/ListParts';
import { RecordSide } from '@/components/admin/RecordSide';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast, refreshCounts } = useAdmin();
  const [a, setA] = useState<Application | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState('');
  const [del, setDel] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(() => {
    setError('');
    api<Application>(`/admin/applications/${encodeURIComponent(id)}`, { admin: true })
      .then(setA)
      .catch((e: ClientApiError) => (e.status === 404 || e.status === 400 ? setMissing(true) : setError(e.message)));
  }, [id]);
  useEffect(load, [load]);

  const save = async (body: { status?: string; notes?: string }) => {
    try {
      const r = await api<Application>(`/admin/applications/${a!.id}`, { method: 'PATCH', body, admin: true });
      setA(r);
      refreshCounts();
      if (body.notes !== undefined) toast('Notes saved.');
      return `Status updated to ${r.statusLabel}.`;
    } catch (e) {
      toast((e as ClientApiError).message, true);
    }
  };

  const download = async () => {
    if (!a) return;
    setDownloading(true);
    try {
      await downloadFile(`/admin/applications/${a.id}/resume`, a.resumeName || `resume-${a.publicRef}`);
    } catch (e) {
      toast((e as ClientApiError).message || 'Download failed.', true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <Link href="/admin/applications" className="backlink">
        ← All applications
      </Link>
      {missing && (
        <div className="adm-panel" style={{ marginTop: 12, padding: 32 }}>
          <h1 className="adm-h1" style={{ fontSize: 24 }}>
            Application not found
          </h1>
          <p style={{ margin: '8px 0 0' }}>It may have been deleted. Return to the list to continue.</p>
        </div>
      )}
      {error && <ErrorBox message={error} onRetry={load} />}
      {!a && !missing && !error && <Skeleton label="Loading application" />}
      {a && (
        <div className="detail">
          <div className="detail__main">
            <div className="detail__head">
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>
                  {a.publicRef} · received {formatShort(a.createdAt)}
                </p>
                <h1>{a.fullName}</h1>
              </div>
              <span className={`st st--${a.status}`}>{a.statusLabel}</span>
            </div>
            <dl className="dfields">
              <div>
                <dt>Position applied for</dt>
                <dd>
                  {a.vacancyTitle}
                  {a.vacancyId === null && ' (vacancy since removed)'}
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${a.email}`}>{a.email}</a>
                </dd>
              </div>
              <div>
                <dt>Telephone</dt>
                <dd>{a.phone || '—'}</dd>
              </div>
              <div>
                <dt>Résumé</dt>
                <dd>
                  {a.hasResume ? (
                    <button type="button" className="textbtn" style={{ padding: 0 }} onClick={download} disabled={downloading}>
                      {downloading ? 'Downloading…' : `Download ${a.resumeName} (${fileSize(a.resumeSize)})`}
                    </button>
                  ) : (
                    'None uploaded'
                  )}
                </dd>
              </div>
              <div className="span">
                <dt>Relevant experience</dt>
                <dd>{a.experience || 'None provided'}</dd>
              </div>
              <div className="span">
                <dt>Cover message</dt>
                <dd>{a.cover || 'None provided'}</dd>
              </div>
              <div>
                <dt>Privacy acknowledgement</dt>
                <dd>Agreed {formatShort(a.consentAt)}</dd>
              </div>
            </dl>
          </div>
          <div className="detail__side">
            <RecordSide status={a.status} statuses={APPLICATION_STATUSES} notes={a.notes} onSave={save} />
            <div className="adm-actions">
              <a href={`mailto:${a.email}?subject=${encodeURIComponent(`Your application — ${a.vacancyTitle}`)}`} className="abtn">
                Email applicant
              </a>
              <button type="button" className="abtn abtn--danger" onClick={() => setDel(true)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {del && a && (
        <ConfirmDialog
          title="Delete this application?"
          message={`${a.publicRef} from ${a.fullName} and any uploaded résumé will be permanently removed. This can’t be undone.`}
          onCancel={() => setDel(false)}
          onConfirm={async () => {
            try {
              await api(`/admin/applications/${a.id}`, { method: 'DELETE', admin: true });
              toast('Application deleted.');
              refreshCounts();
              router.replace('/admin/applications');
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
