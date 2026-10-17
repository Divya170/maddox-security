'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/client-api';
import { ENQ_FIELDS, ENQ_IDS, validateEnquiry } from '@/lib/validation';
import type { Opt } from '@/lib/types';
import { SuccessCard } from '@/components/site/Sections';
import { ErrorSummary } from './ErrorSummary';
import { useSubmission } from './useSubmission';

const EMPTY = { company: '', name: '', email: '', phone: '', service: '', location: '', site: '', requirements: '', message: '', website: '' };

interface Props {
  services: Opt[];
  preService: string;
  open: boolean;
  businessName: string;
  phone: string | null;
  telHref: string | null;
  email: string | null;
  mailHref: string | null;
}

export function EnquiryForm({ services, preService, open, businessName, phone, telHref, email, mailHref }: Props) {
  const [v, setV] = useState({ ...EMPTY, service: preService });
  const [privacy, setPrivacy] = useState(false);
  const sub = useSubmission();
  const err = sub.errors;
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((p) => ({ ...p, [k]: e.target.value }));
  const aria = (k: string, extra?: string) => ({
    'aria-invalid': !!err[k],
    'aria-describedby': [extra, err[k] ? `${ENQ_IDS[k] || `f-${k}`}-err` : ''].filter(Boolean).join(' ') || undefined,
  });
  const Err = ({ k }: { k: string }) => (err[k] ? <p id={`${ENQ_IDS[k]}-err`} className="field-err">{err[k]}</p> : null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sub.busy) return;
    const errs = validateEnquiry({ ...v, privacy }, services.map((s) => s.value));
    if (Object.keys(errs).length) return sub.invalid(errs);
    sub.start();
    try {
      const r = await api<{ id: string }>('/inquiries', { method: 'POST', body: { ...v, privacy }, timeoutMs: 20000 });
      sub.done(r.id);
    } catch (x) {
      sub.fail(x);
    }
  };

  const contactLine = (
    <>
      {mailHref && <a href={mailHref}>{email}</a>}
      {mailHref && telHref && ' or '}
      {telHref && <a href={telHref}>{phone}</a>}
    </>
  );

  if (!open) {
    return (
      <div className="form form--shadow paused" role="status">
        <h2>Online enquiries are paused right now.</h2>
        <p className="body">Please contact {businessName} directly at {contactLine}.</p>
      </div>
    );
  }

  if (sub.status === 'success') {
    return (
      <SuccessCard
        shadow
        kicker="ENQUIRY SENT"
        title={`Thank you for contacting ${businessName}. Your enquiry has been received.`}
        reference={sub.ref}
        headingRef={sub.doneRef}
        actions={
          <>
            <Link href="/services" className="btn btn-outline" style={{ minHeight: 50 }}>
              Explore Services
            </Link>
            <Link href="/" className="tlink" style={{ minHeight: 50, padding: '0 12px' }}>
              Return home
            </Link>
          </>
        }
      >
        {(mailHref || telHref) && <p>If you need to add anything, you can reach us at {contactLine}.</p>}
      </SuccessCard>
    );
  }

  const failed = ['server', 'network', 'ratelimit', 'spam', 'closed'].includes(sub.status);

  return (
    <form onSubmit={submit} noValidate aria-labelledby="enq-h" className="form form--shadow">
      <div className="form__head">
        <h2 id="enq-h">Service enquiry</h2>
        <p>
          Fields marked <span aria-hidden="true" className="req">*</span> are required.
        </p>
      </div>

      <ErrorSummary status={sub.status} errors={err} labels={ENQ_FIELDS} ids={(k) => ENQ_IDS[k]} summaryRef={sub.summaryRef} />

      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" value={v.website} onChange={set('website')} />

      <fieldset className="fset">
        <legend>
          <span>1</span>CONTACT INFORMATION
        </legend>
        <div className="grid2">
          <div className="field">
            <label htmlFor="f-company">
              Company name <span aria-hidden="true" className="req">*</span>
            </label>
            <input id="f-company" name="company" autoComplete="organization" maxLength={120} aria-required="true" className="control" value={v.company} onChange={set('company')} {...aria('company')} />
            <Err k="company" />
          </div>
          <div className="field">
            <label htmlFor="f-name">
              Your name <span aria-hidden="true" className="req">*</span>
            </label>
            <input id="f-name" name="name" autoComplete="name" maxLength={120} aria-required="true" className="control" value={v.name} onChange={set('name')} {...aria('name')} />
            <Err k="name" />
          </div>
          <div className="field">
            <label htmlFor="f-email">
              Business email <span aria-hidden="true" className="req">*</span>
            </label>
            <input id="f-email" name="email" type="email" autoComplete="email" maxLength={160} aria-required="true" className="control" value={v.email} onChange={set('email')} {...aria('email')} />
            <Err k="email" />
          </div>
          <div className="field">
            <label htmlFor="f-phone">
              Phone <span className="opt">(optional)</span>
            </label>
            <input id="f-phone" name="phone" type="tel" autoComplete="tel" maxLength={24} className="control" value={v.phone} onChange={set('phone')} {...aria('phone')} />
            <Err k="phone" />
          </div>
        </div>
      </fieldset>

      <fieldset className="fset">
        <legend>
          <span>2</span>SERVICE REQUIREMENTS
        </legend>
        <div className="field">
          <label htmlFor="f-service">
            Service type <span aria-hidden="true" className="req">*</span>
          </label>
          <select id="f-service" name="service" aria-required="true" className="control" value={v.service} onChange={set('service')} {...aria('service', preService ? 'f-service-note' : undefined)}>
            <option value="">Select a service</option>
            {services.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {preService && (
            <p id="f-service-note" className="hint hint--md">
              Preselected from the service you were viewing — you can change it.
            </p>
          )}
          <Err k="service" />
        </div>
        <div className="grid2">
          <div className="field">
            <label htmlFor="f-location">
              Coverage location <span aria-hidden="true" className="req">*</span>
            </label>
            <input id="f-location" name="location" autoComplete="address-level2" maxLength={120} aria-required="true" className="control" value={v.location} onChange={set('location')} {...aria('location', 'f-location-help')} />
            <p id="f-location-help" className="hint">
              City, town, or general service area.
            </p>
            <Err k="location" />
          </div>
          <div className="field">
            <label htmlFor="f-site">
              Site or service type <span className="opt">(optional)</span>
            </label>
            <input id="f-site" name="site" maxLength={120} aria-describedby="f-site-help" className="control" value={v.site} onChange={set('site')} />
            <p id="f-site-help" className="hint">
              For example: office building, retail unit, event.
            </p>
          </div>
        </div>
        <div className="field">
          <label htmlFor="f-req">
            Service requirements <span aria-hidden="true" className="req">*</span>
          </label>
          <p id="f-req-help" className="hint hint--md">
            A general description of the support you need. Please do not include access codes, security credentials, or sensitive operational details.
          </p>
          <textarea id="f-req" name="requirements" rows={5} maxLength={2000} aria-required="true" className="control" value={v.requirements} onChange={set('requirements')} {...aria('requirements', 'f-req-help')} />
          <Err k="requirements" />
        </div>
      </fieldset>

      <fieldset className="fset">
        <legend>
          <span>3</span>ANYTHING ELSE
        </legend>
        <div className="field">
          <label htmlFor="f-msg">
            Additional message <span className="opt">(optional)</span>
          </label>
          <textarea id="f-msg" name="message" rows={3} maxLength={2000} className="control" value={v.message} onChange={set('message')} />
        </div>
        <div className="field">
          <label className="check">
            <input id="f-privacy" name="privacy" type="checkbox" aria-required="true" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} {...aria('privacy')} />
            <span>
              I agree that {businessName} may use these details to respond to my enquiry, as described in the <Link href="/privacy">privacy policy</Link>. <span aria-hidden="true" className="req">*</span>
            </span>
          </label>
          <Err k="privacy" />
        </div>
      </fieldset>

      <div className="submit-row">
        <button type="submit" className="btn btn-navy" disabled={sub.busy} aria-busy={sub.busy}>
          {sub.busy && <span className="spin" aria-hidden="true" />}
          {sub.busy ? 'Sending…' : failed ? 'Try Again' : 'Submit Enquiry'}
        </button>
        {telHref && (
          <p className="small">
            Or call <a href={telHref}>{phone}</a>
          </p>
        )}
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {sub.busy ? 'Sending…' : ''}
      </div>
    </form>
  );
}
