'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import { formatDay } from '@/lib/format';
import type { AdminVacancy } from '@/lib/types';
import { AdminHeader, ConfirmDialog, EmptyBox, ErrorBox, Field, LoadingRows, Modal, StatusTag } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';

type Form = { title: string; slug: string; location: string; employmentType: string; summary: string; description: string; requirements: string; howToApply: string; closesOn: string; published: boolean };
const EMPTY: Form = { title: '', slug: '', location: '', employmentType: '', summary: '', description: '', requirements: '', howToApply: '', closesOn: '', published: false };
const toForm = (v: AdminVacancy): Form => ({
  title: v.title,
  slug: v.slug,
  location: v.location,
  employmentType: v.employmentType,
  summary: v.summary,
  description: v.description,
  requirements: v.requirements,
  howToApply: v.howToApply,
  closesOn: v.closesOn || '',
  published: v.published,
});

/** Mirrors backend validateVacancy. */
function check(f: Form, isNew: boolean) {
  const e: Record<string, string> = {};
  if (f.title.trim().length < 2) e.title = 'Enter the job title.';
  if (isNew && f.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug)) e.slug = 'Use lowercase letters, numbers and hyphens only.';
  if (f.published) {
    if (!f.location.trim()) e.location = 'Add the location before publishing.';
    if (!f.employmentType.trim()) e.employmentType = 'Add the employment type before publishing.';
    if (f.description.trim().length < 40) e.description = 'Add the approved job description (at least 40 characters) before publishing.';
  }
  return e;
}

export default function VacanciesPage() {
  const { toast } = useAdmin();
  const [items, setItems] = useState<AdminVacancy[] | null>(null);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState<{ id?: number; form: Form } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<AdminVacancy | null>(null);

  const load = useCallback(() => {
    setError('');
    api<AdminVacancy[]>('/admin/vacancies', { admin: true })
      .then(setItems)
      .catch((e: ClientApiError) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const setF = <K extends keyof Form>(k: K, v: Form[K]) => setEdit((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!edit) return;
    const fe = check(edit.form, !edit.id);
    setErrors(fe);
    if (Object.keys(fe).length) return document.getElementById(`v-${Object.keys(fe)[0]}`)?.focus();
    setSaving(true);
    const body = { ...edit.form, closesOn: edit.form.closesOn || null };
    try {
      if (edit.id) await api(`/admin/vacancies/${edit.id}`, { method: 'PATCH', admin: true, body });
      else await api('/admin/vacancies', { method: 'POST', admin: true, body });
      toast(edit.id ? 'Vacancy saved.' : 'Vacancy added.');
      setEdit(null);
      load();
    } catch (e) {
      const ce = e as ClientApiError;
      setErrors(ce.errors);
      if (!Object.keys(ce.errors).length) toast(ce.message, true);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (v: AdminVacancy) => {
    try {
      await api(`/admin/vacancies/${v.id}`, { method: 'PATCH', admin: true, body: { published: !v.published } });
      toast(v.published ? `${v.title} moved to drafts.` : `${v.title} published.`);
      load();
    } catch (e) {
      const ce = e as ClientApiError;
      toast(Object.values(ce.errors)[0] || ce.message, true);
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    if (!items) return;
    const next = [...items];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setItems(next);
    try {
      setItems(await api<AdminVacancy[]>('/admin/vacancies/reorder', { method: 'POST', admin: true, body: { ids: next.map((x) => x.id) } }));
    } catch (e) {
      toast((e as ClientApiError).message, true);
      load();
    }
  };

  const f = edit?.form;
  const text = (k: keyof Form, label: string, max: number, help?: string, type = 'text') => (
    <Field id={`v-${k}`} label={label} error={errors[k]} help={help}>
      <input id={`v-${k}`} type={type} className="control" maxLength={max} value={String(f?.[k] ?? '')} onChange={(e) => setF(k, e.target.value as never)} aria-invalid={errors[k] ? true : undefined} />
    </Field>
  );
  const area = (k: keyof Form, label: string, max: number, rows = 4, help?: string) => (
    <Field id={`v-${k}`} label={label} error={errors[k]} help={help ?? `${String(f?.[k] ?? '').length.toLocaleString('en-US')} / ${max.toLocaleString('en-US')}`}>
      <textarea id={`v-${k}`} className="control" rows={rows} maxLength={max} value={String(f?.[k] ?? '')} onChange={(e) => setF(k, e.target.value as never)} aria-invalid={errors[k] ? true : undefined} />
    </Field>
  );

  return (
    <>
      <AdminHeader eyebrow="CAREERS" title="Vacancies">
        <button
          type="button"
          className="abtn"
          onClick={() => {
            setErrors({});
            setEdit({ form: { ...EMPTY } });
          }}
        >
          + Add vacancy
        </button>
      </AdminHeader>
      <p className="alert-info">
        Only approved roles should be published. Published, open vacancies are listed on the Careers page with an online application; drafts show only in staff preview. After the closing date a vacancy page says “This vacancy is no longer available.”
      </p>
      <div className="adm-panel">
        {error ? (
          <ErrorBox message={error} onRetry={load} />
        ) : !items ? (
          <LoadingRows />
        ) : items.length === 0 ? (
          <EmptyBox>No vacancies yet. The Careers page shows “There are no published vacancies at present.”</EmptyBox>
        ) : (
          items.map((v, i) => (
            <div key={v.id} className={`item-row${v.published ? '' : ' is-draft'}`}>
              <div className="col min0" style={{ flex: '1 1 260px', gap: 2 }}>
                <strong>{v.title}</strong>
                <span className="small">
                  {[v.location, v.employmentType, v.closesOn ? `closes ${formatDay(v.closesOn)}` : ''].filter(Boolean).join(' · ') || 'Details to be added'}
                </span>
                <span className="small">
                  <Link href={`/admin/applications`}>{v.applications} application{v.applications === 1 ? '' : 's'}</Link> · /careers/{v.slug}
                </span>
              </div>
              <StatusTag kind={!v.published ? 'draft' : v.open ? 'ok' : 'spam'}>{!v.published ? 'Draft' : v.open ? 'Open' : 'Closed'}</StatusTag>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <button type="button" className="iconbtn" aria-label={`Move ${v.title} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                  ↑
                </button>
                <button type="button" className="iconbtn" aria-label={`Move ${v.title} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                  ↓
                </button>
                <button type="button" className="iconbtn" onClick={() => toggle(v)}>
                  {v.published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={() => {
                    setErrors({});
                    setEdit({ id: v.id, form: toForm(v) });
                  }}
                >
                  Edit
                </button>
                <button type="button" className="iconbtn iconbtn--danger" onClick={() => setDel(v)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {edit && f && (
        <Modal title={edit.id ? `Edit — ${f.title || 'vacancy'}` : 'Add vacancy'} onClose={() => setEdit(null)}>
          <form onSubmit={save} noValidate className="adm-form">
            {text('title', 'Job title *', 100)}
            {!edit.id && (
              <Field id="v-slug" label="URL (optional)" error={errors.slug} help="The vacancy page address: /careers/your-text. Made from the title when empty. Can’t be changed later.">
                <input id="v-slug" className="control" maxLength={60} value={f.slug} autoCapitalize="none" spellCheck={false} onChange={(e) => setF('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))} />
              </Field>
            )}
            <div className="grid-fit" style={{ ['--min' as string]: '200px', ['--gap' as string]: '16px' }}>
              {text('location', 'Location', 100)}
              {text('employmentType', 'Employment type', 60, 'e.g. Full-time, Part-time')}
              {text('closesOn', 'Closing date (optional)', 10, 'Open through this day.', 'date')}
            </div>
            {area('summary', 'One-line summary (careers list)', 300, 2)}
            {area('description', 'About the role (approved description)', 8000, 6)}
            {area('requirements', 'Requirements', 4000, 4)}
            {area('howToApply', 'How to apply (optional note above the form)', 1000, 2)}
            <label className="adm-check">
              <input type="checkbox" checked={f.published} onChange={(e) => setF('published', e.target.checked)} />
              Published (listed on Careers and accepting applications)
            </label>
            <div className="adm-actions">
              <button type="submit" className="abtn" disabled={saving}>
                {saving ? 'Saving…' : 'Save vacancy'}
              </button>
              <button type="button" className="abtn abtn--line" onClick={() => setEdit(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {del && (
        <ConfirmDialog
          title="Delete vacancy?"
          message={`“${del.title}” will be removed from the site. Its ${del.applications} application(s) are kept with the job title. To hide it for now, use Unpublish instead.`}
          onCancel={() => setDel(null)}
          onConfirm={async () => {
            try {
              await api(`/admin/vacancies/${del.id}`, { method: 'DELETE', admin: true });
              toast('Vacancy deleted.');
              setDel(null);
              load();
            } catch (e) {
              toast((e as ClientApiError).message, true);
            }
          }}
        />
      )}
    </>
  );
}
