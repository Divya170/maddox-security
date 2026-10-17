'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import type { AdminSettings } from '@/lib/types';
import { EMAIL_RE, PHONE_RE } from '@/lib/validation';
import { formatShort } from '@/lib/format';
import { AdminHeader, ErrorBox, Field, LoadingRows } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';

type Form = Omit<AdminSettings, 'updatedAt' | 'email' | 'phone' | 'addressLine1' | 'addressLine2'> & { email: string; phone: string; addressLine1: string; addressLine2: string };

const toForm = (s: AdminSettings): Form => ({
  businessName: s.businessName,
  contactName: s.contactName,
  phone: s.phone || '',
  email: s.email || '',
  addressLine1: s.addressLine1 || '',
  addressLine2: s.addressLine2 || '',
  tagline: s.tagline,
  companyProfile: s.companyProfile,
  privacyPolicy: s.privacyPolicy,
  termsOfUse: s.termsOfUse,
  reviewNote: s.reviewNote,
  inquiriesOpen: s.inquiriesOpen,
  applicationsOpen: s.applicationsOpen,
});

function check(f: Form) {
  const e: Record<string, string> = {};
  if (f.businessName.trim().length < 2) e.businessName = 'Enter the business name.';
  if (f.email.trim() && !EMAIL_RE.test(f.email.trim())) e.email = 'Enter an email address in the format name@company.com.';
  if (f.phone.trim() && !PHONE_RE.test(f.phone.trim())) e.phone = 'Enter a phone number using digits, spaces, or + ( ) -.';
  if (f.companyProfile.length > 4000) e.companyProfile = 'Use 4,000 characters or fewer.';
  return e;
}

export default function SettingsPage() {
  const { toast } = useAdmin();
  const [saved, setSaved] = useState<AdminSettings | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(() => {
    setError('');
    api<AdminSettings>('/admin/settings', { admin: true })
      .then((s) => {
        setSaved(s);
        setForm(toForm(s));
      })
      .catch((e: ClientApiError) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
    setDone(false);
    if (errors[k as string])
      setErrors((p) => {
        const n = { ...p };
        delete n[k as string];
        return n;
      });
  };

  const dirty = !!(form && saved && JSON.stringify(form) !== JSON.stringify(toForm(saved)));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const fe = check(form);
    setErrors(fe);
    if (Object.keys(fe).length) return document.getElementById(`st-${Object.keys(fe)[0]}`)?.focus();
    setSaving(true);
    try {
      const s = await api<AdminSettings>('/admin/settings', {
        method: 'PATCH',
        admin: true,
        body: { ...form, email: form.email.trim() || null, phone: form.phone.trim() || null, addressLine1: form.addressLine1.trim() || null, addressLine2: form.addressLine2.trim() || null },
      });
      setSaved(s);
      setForm(toForm(s));
      setDone(true);
      toast('Settings saved.');
    } catch (err) {
      const ce = err as ClientApiError;
      setErrors(ce.errors);
      if (!Object.keys(ce.errors).length) toast(ce.message, true);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!form) return <LoadingRows rows={8} />;

  const text = (k: keyof Form, label: string, opts: { max?: number; help?: string; type?: string } = {}) => (
    <Field id={`st-${k}`} label={label} error={errors[k]} help={opts.help}>
      <input id={`st-${k}`} className="control" type={opts.type || 'text'} maxLength={opts.max || 160} value={String(form[k] ?? '')} onChange={(e) => set(k, e.target.value as never)} aria-invalid={errors[k] ? true : undefined} />
    </Field>
  );
  const area = (k: keyof Form, label: string, max: number, help?: string, rows = 4) => (
    <Field id={`st-${k}`} label={label} error={errors[k]} help={help ?? `${String(form[k]).length.toLocaleString('en-US')} / ${max.toLocaleString('en-US')}`}>
      <textarea id={`st-${k}`} className="control" rows={rows} maxLength={max} value={String(form[k] ?? '')} onChange={(e) => set(k, e.target.value as never)} aria-invalid={errors[k] ? true : undefined} />
    </Field>
  );
  const toggle = (k: 'inquiriesOpen' | 'applicationsOpen', label: string, help: string) => (
    <div>
      <label className="adm-check">
        <input type="checkbox" checked={form[k]} onChange={(e) => set(k, e.target.checked)} />
        {label}
      </label>
      <p className="help" style={{ marginLeft: 30 }}>
        {help}
      </p>
    </div>
  );

  return (
    <>
      <AdminHeader eyebrow="SETTINGS" title="Business & settings">
        {saved && <span className="small">Last saved {formatShort(saved.updatedAt)}</span>}
      </AdminHeader>
      <form onSubmit={save} noValidate className="col" style={{ gap: 20, maxWidth: 900 }}>
        <section className="adm-panel adm-pad adm-form" aria-labelledby="st-pub-h">
          <h2 id="st-pub-h" className="adm-section-h">
            Forms &amp; preview
          </h2>
          {toggle('inquiriesOpen', 'Accept service enquiries online', 'When off, the contact page asks visitors to phone or email and the API rejects submissions.')}
          {toggle('applicationsOpen', 'Accept job applications online', 'When off, vacancy pages still show details but hide the application form.')}
          {area('reviewNote', 'Draft-preview banner text', 600, 'Shown at the top of the site while you use “Preview drafts on site”. Drafts are never shown to visitors.', 2)}
        </section>

        <section className="adm-panel adm-pad adm-form" aria-labelledby="st-co-h">
          <h2 id="st-co-h" className="adm-section-h">
            Business &amp; contact
          </h2>
          <p className="small" style={{ margin: 0 }}>
            Used in the header phone card, contact page, company page, footer and success messages. Leave a field empty to hide it on the site.
          </p>
          <div className="grid-fit" style={{ ['--min' as string]: '260px', ['--gap' as string]: '18px' }}>
            {text('businessName', 'Business name *', { max: 120 })}
            {text('contactName', 'Contact person', { max: 120 })}
            {text('phone', 'Phone', { type: 'tel', max: 24 })}
            {text('email', 'Email', { type: 'email', max: 160, help: 'Also receives new enquiry/application emails unless NOTIFY_TO is set.' })}
            {text('addressLine1', 'Address line 1', { max: 160 })}
            {text('addressLine2', 'Address line 2 (city, state, ZIP)', { max: 160 })}
          </div>
          {text('tagline', 'Footer statement', { max: 160 })}
        </section>

        <section className="adm-panel adm-pad adm-form" aria-labelledby="st-copy-h">
          <h2 id="st-copy-h" className="adm-section-h">
            Company profile &amp; legal
          </h2>
          {area('companyProfile', 'Approved company profile (blank line = new paragraph)', 4000, 'Shown on the Company page after the two standard paragraphs. Empty = only a draft placeholder in staff preview.', 5)}
          {area('privacyPolicy', 'Privacy policy (blank line = new paragraph)', 20000, 'Empty = “This document is being finalized…”', 8)}
          {area('termsOfUse', 'Terms of use (blank line = new paragraph)', 20000, 'Empty = “This document is being finalized…”', 6)}
        </section>

        <div className="adm-actions" style={{ position: 'sticky', bottom: 0, padding: '14px 0', background: 'var(--a-bg)' }}>
          <button type="submit" className="abtn" disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          {dirty && (
            <button type="button" className="abtn abtn--line" onClick={() => saved && setForm(toForm(saved))}>
              Discard changes
            </button>
          )}
          {done && !dirty && (
            <span className="small" role="status">
              ✓ Saved —{' '}
              <a href="/" target="_blank" rel="noreferrer">
                view the site ↗
              </a>
            </span>
          )}
        </div>
      </form>
    </>
  );
}
