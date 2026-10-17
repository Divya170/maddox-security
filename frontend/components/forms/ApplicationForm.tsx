'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { api } from '@/lib/client-api';
import { APP_FIELDS, validateApplicationForm } from '@/lib/validation';
import { SuccessCard } from '@/components/site/Sections';
import { ErrorSummary } from './ErrorSummary';
import { useSubmission } from './useSubmission';

const EMPTY = { fullName: '', email: '', phone: '', experience: '', cover: '', website: '' };

/** "Apply for this position" (design submitApp). Sends multipart/form-data with the optional résumé. */
export function ApplicationForm({ slug, title, businessName }: { slug: string; title: string; businessName: string }) {
  const [v, setV] = useState(EMPTY);
  const [privacy, setPrivacy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const sub = useSubmission();
  const err = sub.errors;
  const id = (k: string) => `a-${k}`;
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((p) => ({ ...p, [k]: e.target.value }));
  const aria = (k: string, extra?: string) => ({
    'aria-invalid': !!err[k],
    'aria-describedby': [extra, err[k] ? `a-${k}-err` : ''].filter(Boolean).join(' ') || undefined,
  });
  const Err = ({ k }: { k: string }) => (err[k] ? <p id={`a-${k}-err`} className="field-err">{err[k]}</p> : null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sub.busy) return;
    const file = fileRef.current?.files?.[0] || null;
    const errs = validateApplicationForm({ ...v, privacy }, file);
    if (Object.keys(errs).length) return sub.invalid(errs);
    const fd = new FormData();
    (Object.keys(v) as (keyof typeof EMPTY)[]).forEach((k) => fd.append(k, String(v[k])));
    fd.append('privacy', privacy ? 'true' : '');
    if (file && file.size) fd.append('resume', file);
    sub.start();
    try {
      const r = await api<{ id: string }>(`/careers/vacancies/${encodeURIComponent(slug)}/applications`, { method: 'POST', form: fd, timeoutMs: 60000 });
      sub.done(r.id);
    } catch (x) {
      sub.fail(x);
    }
  };

  if (sub.status === 'success') {
    return (
      <SuccessCard
        kicker="APPLICATION RECEIVED"
        title={`Thank you. Your application for this position has been received by ${businessName}.`}
        reference={sub.ref}
        headingRef={sub.doneRef}
        actions={
          <Link href="/careers" className="btn btn-outline" style={{ minHeight: 50 }}>
            Back to Careers
          </Link>
        }
      />
    );
  }

  const failed = ['server', 'network', 'ratelimit', 'spam', 'closed', 'vacancy_closed'].includes(sub.status);

  return (
    <form onSubmit={submit} noValidate aria-labelledby="app-h" className="form" style={{ gap: 22 }}>
      <div className="col" style={{ gap: 8 }}>
        <h2 id="app-h" style={{ font: '600 28px/1.15 var(--f-d)', letterSpacing: '-.025em', color: 'var(--navy)' }}>
          Apply for this position
        </h2>
        <p className="req-note">
          Fields marked <span aria-hidden="true" className="req">*</span> are required. Please do not include identity numbers, bank details, or other sensitive personal records.
        </p>
      </div>

      <ErrorSummary status={sub.status} errors={err} labels={APP_FIELDS} ids={id} summaryRef={sub.summaryRef} />

      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" value={v.website} onChange={set('website')} />

      <div className="grid2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))' }}>
        <div className="field">
          <label htmlFor="a-fullName">
            Full name <span aria-hidden="true" className="req">*</span>
          </label>
          <input id="a-fullName" name="fullName" autoComplete="name" maxLength={120} aria-required="true" className="control" value={v.fullName} onChange={set('fullName')} {...aria('fullName')} />
          <Err k="fullName" />
        </div>
        <div className="field">
          <label htmlFor="a-email">
            Email address <span aria-hidden="true" className="req">*</span>
          </label>
          <input id="a-email" name="email" type="email" autoComplete="email" maxLength={160} aria-required="true" className="control" value={v.email} onChange={set('email')} {...aria('email')} />
          <Err k="email" />
        </div>
        <div className="field">
          <label htmlFor="a-phone">
            Telephone <span className="opt">(optional)</span>
          </label>
          <input id="a-phone" name="phone" type="tel" autoComplete="tel" maxLength={24} className="control" value={v.phone} onChange={set('phone')} {...aria('phone')} />
          <Err k="phone" />
        </div>
        <div className="field">
          <label htmlFor="a-position">Position applied for</label>
          <input id="a-position" name="position" value={title} readOnly className="control" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="a-experience">
          Relevant experience <span className="opt">(optional)</span>
        </label>
        <textarea id="a-experience" name="experience" rows={4} maxLength={2000} className="control" value={v.experience} onChange={set('experience')} />
      </div>
      <div className="field">
        <label htmlFor="a-resume">
          Resume <span className="opt">(optional)</span>
        </label>
        <p id="a-resume-help" className="hint hint--md">
          PDF, DOC, or DOCX, up to 5 MB. Stored privately and seen only by authorized recruitment staff.
        </p>
        <input
          ref={fileRef}
          id="a-resume"
          name="resume"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="control"
          {...aria('resume', 'a-resume-help')}
        />
        <Err k="resume" />
      </div>
      <div className="field">
        <label htmlFor="a-cover">
          Short cover message <span className="opt">(optional)</span>
        </label>
        <textarea id="a-cover" name="cover" rows={4} maxLength={2000} className="control" value={v.cover} onChange={set('cover')} />
      </div>
      <div className="field">
        <label className="check">
          <input id="a-privacy" name="privacy" type="checkbox" aria-required="true" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} {...aria('privacy')} />
          <span>
            I agree that {businessName} may use the information I provide to process my application, as described in the <Link href="/privacy">privacy policy</Link>. <span aria-hidden="true" className="req">*</span>
          </span>
        </label>
        <Err k="privacy" />
      </div>
      <div>
        <button type="submit" className="btn btn-navy" style={{ minHeight: 56, padding: '0 30px', fontSize: 16 }} disabled={sub.busy} aria-busy={sub.busy}>
          {sub.busy && <span className="spin" aria-hidden="true" />}
          {sub.busy ? 'Submitting…' : failed ? 'Try Again' : 'Submit Application'}
        </button>
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {sub.busy ? 'Sending…' : ''}
      </div>
    </form>
  );
}
