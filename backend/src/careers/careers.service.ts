import { BadRequestException, GoneException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, LessThan, Repository } from 'typeorm';
import { createHash } from 'crypto';
import { Vacancy } from './vacancy.entity';
import { Application } from './application.entity';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUSES,
  ApplicationInput,
  ApplicationStatus,
  isVacancyOpen,
  ResumeFile,
  safeFileName,
  sniffResume,
  RESUME_TYPES,
  validateApplication,
  validateVacancy,
  VacancyInput,
} from './career-validation';
import { deleteResume, openResume, saveResume } from './resume-store';
import { csvSafe, isHoneypot, publicRef, todayIso } from '../common/forms';
import { FieldErrors } from '../common/submission-error';
import { NotifierService } from '../common/notifier.service';
import { SettingsService } from '../settings/settings.service';
import { clampInt, slugify } from '../common/utils';

export interface ApplicationQuery {
  q?: string;
  status?: string;
  vacancy?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

const hashIp = (ip: string) => (ip ? createHash('sha256').update(`${process.env.SESSION_SECRET || 'dev'}:${ip}`).digest('hex').slice(0, 32) : '');

@Injectable()
export class CareersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Careers');
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectRepository(Vacancy) private readonly vacancies: Repository<Vacancy>,
    @InjectRepository(Application) private readonly apps: Repository<Application>,
    private readonly dataSource: DataSource,
    private readonly settings: SettingsService,
    private readonly notifier: NotifierService,
  ) {}

  onModuleInit() {
    if (this.retentionMonths() > 0) this.timer = setInterval(() => void this.purgeExpired(), 86_400_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  retentionMonths() {
    return clampInt(process.env.RETENTION_MONTHS, 0, 120, 0);
  }

  // ---------- public ----------

  private publicShape(v: Vacancy, today: string) {
    return {
      slug: v.slug,
      title: v.title,
      location: v.location,
      employmentType: v.employmentType,
      summary: v.summary,
      closesOn: v.closesOn,
      draft: !v.published,
      open: isVacancyOpen(v, today),
    };
  }

  /** Open vacancies for the careers list (drafts too in staff preview). Closed ones are not listed. */
  async publicList(preview = false) {
    const today = todayIso();
    const rows = await this.vacancies.find({ where: preview ? {} : { published: true }, order: { sortOrder: 'ASC', id: 'ASC' } });
    return rows.filter((v) => !v.published || isVacancyOpen(v, today)).map((v) => this.publicShape(v, today));
  }

  /** One vacancy for its page. Returns null when missing, unpublished (outside preview) or closed. */
  async publicGet(slug: string, preview = false) {
    const v = await this.vacancies.findOne({ where: { slug } });
    if (!v) return null;
    const today = todayIso();
    if (!preview && !isVacancyOpen(v, today)) return null;
    const s = await this.settings.get();
    return { ...this.publicShape(v, today), description: v.description, requirements: v.requirements, howToApply: v.howToApply, applicationsOpen: s.applicationsOpen };
  }

  async apply(slug: string, input: ApplicationInput, file: ResumeFile | undefined, meta: { ip: string }) {
    if (isHoneypot(input.website)) {
      this.logger.warn(JSON.stringify({ event: 'application.rejected', reason: 'honeypot' }));
      throw new BadRequestException({ error: 'spam' });
    }
    const v = await this.vacancies.findOne({ where: { slug } });
    // Design: "Applications can only be submitted for currently published roles."
    if (!v || !isVacancyOpen(v, todayIso())) throw new GoneException({ error: 'vacancy_closed' });
    if (!(await this.settings.get()).applicationsOpen) throw new ServiceUnavailableException({ error: 'closed' });

    const { value, errors } = validateApplication(input, file);
    if (Object.keys(errors).length) throw new FieldErrors(errors);

    const kind = file && file.size ? sniffResume(file.buffer) : null;
    const stored = kind && file ? saveResume(file.buffer, kind) : null;
    try {
      const row = await this.dataSource.transaction(async (m) => {
        const repo = m.getRepository(Application);
        const saved = await repo.save(
          repo.create({
            ...value,
            vacancyId: v.id,
            vacancyTitle: v.title,
            resumeFile: stored,
            resumeName: stored && file ? safeFileName(file.originalname) : null,
            resumeType: kind ? RESUME_TYPES[kind] : null,
            resumeSize: stored && file ? file.size : 0,
            consentAt: new Date(),
            status: 'new',
            notes: '',
            ipHash: hashIp(meta.ip),
            notifyStatus: this.notifier.configured ? 'pending' : 'disabled',
            notifyAttempts: 0,
            closedAt: null,
          }),
        );
        saved.publicRef = publicRef('A', saved.id);
        return repo.save(saved);
      });
      this.logger.log(JSON.stringify({ event: 'application.created', ref: row.publicRef, vacancy: v.slug, resume: !!stored }));
      if (this.notifier.configured) void this.notify(row);
      return { id: row.publicRef as string };
    } catch (err) {
      deleteResume(stored); // don't leave an orphan file if the insert failed
      throw err;
    }
  }

  private async notify(a: Application) {
    try {
      await this.notifier.send({
        to: process.env.CAREERS_NOTIFY_TO || process.env.NOTIFY_TO || (await this.settings.get()).email,
        replyTo: a.email,
        subject: `New application ${a.publicRef} — ${a.vacancyTitle}`,
        rows: [
          ['Reference', a.publicRef || String(a.id)],
          ['Position', a.vacancyTitle],
          ['Name', a.fullName],
          ['Email', a.email],
          ['Phone', a.phone || '—'],
          ['Résumé', a.resumeFile ? 'Attached in the admin (not emailed)' : 'None'],
        ],
        body: [a.experience && `Experience:\n${a.experience}`, a.cover && `Cover message:\n${a.cover}`].filter(Boolean).join('\n\n') || '(No message)',
        link: this.notifier.adminUrl(`/applications/${a.id}`),
      });
      await this.apps.update({ id: a.id }, { notifyStatus: 'sent', notifyAttempts: a.notifyAttempts + 1 });
    } catch {
      this.logger.error(JSON.stringify({ event: 'application.notify_failed', ref: a.publicRef }));
      await this.apps.update({ id: a.id }, { notifyStatus: 'failed', notifyAttempts: a.notifyAttempts + 1 });
    }
  }

  /** Retention: deletes unsuccessful/archived applications (and their résumés) older than RETENTION_MONTHS. */
  async purgeExpired() {
    const months = this.retentionMonths();
    if (!months) return { deleted: 0, months: 0 };
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const old = await this.apps.find({ where: { status: In(['unsuccessful', 'archived']), closedAt: LessThan(cutoff) } });
    for (const a of old) deleteResume(a.resumeFile);
    if (old.length) await this.apps.remove(old);
    this.logger.log(JSON.stringify({ event: 'application.purged', count: old.length, months }));
    return { deleted: old.length, months };
  }

  // ---------- admin: vacancies ----------

  async adminVacancies() {
    const rows = await this.vacancies.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
    const counts = await this.apps.createQueryBuilder('a').select('a.vacancyId', 'id').addSelect('COUNT(*)', 'n').groupBy('a.vacancyId').getRawMany<{ id: number; n: string }>();
    const by = new Map(counts.map((c) => [Number(c.id), Number(c.n)]));
    const today = todayIso();
    return rows.map((v) => ({ ...v, applications: by.get(v.id) || 0, open: isVacancyOpen(v, today) }));
  }

  private fail(errors: Record<string, string>): never {
    const n = Object.keys(errors).length;
    throw new BadRequestException({ message: n === 1 ? 'Please correct 1 field.' : `Please correct ${n} fields.`, errors });
  }

  private async uniqueSlug(base: string) {
    const root = base || 'vacancy';
    let slug = root;
    for (let i = 2; await this.vacancies.findOne({ where: { slug } }); i++) slug = `${root}-${i}`;
    return slug;
  }

  async createVacancy(body: VacancyInput) {
    const { value, errors } = validateVacancy(body);
    if (Object.keys(errors).length) this.fail(errors);
    const max = await this.vacancies.createQueryBuilder('v').select('MAX(v.sortOrder)', 'max').getRawOne<{ max: number | null }>();
    const slug = await this.uniqueSlug(value.slug || slugify(value.title).slice(0, 60));
    return this.vacancies.save(this.vacancies.create({ ...value, slug, sortOrder: (max?.max ?? 0) + 1 }));
  }

  async updateVacancy(id: number, body: VacancyInput) {
    const row = await this.vacancies.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Vacancy not found.');
    const { value, errors } = validateVacancy({ ...row, ...body, slug: row.slug });
    if (Object.keys(errors).length) this.fail(errors);
    Object.assign(row, { ...value, slug: row.slug });
    return this.vacancies.save(row);
  }

  async removeVacancy(id: number) {
    const row = await this.vacancies.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Vacancy not found.');
    // Applications keep their title snapshot; only the link to the vacancy is cleared.
    await this.apps.update({ vacancyId: id }, { vacancyId: null });
    await this.vacancies.remove(row);
    return { ok: true };
  }

  async reorderVacancies(ids: number[]) {
    const rows = await this.vacancies.find({ where: { id: In(ids) } });
    if (rows.length !== ids.length) throw new BadRequestException('Reorder list does not match the vacancies.');
    await Promise.all(ids.map((id, i) => this.vacancies.update({ id }, { sortOrder: i + 1 })));
    return this.adminVacancies();
  }

  // ---------- admin: applications ----------

  private filtered(p: ApplicationQuery) {
    const qb = this.apps.createQueryBuilder('a');
    if (p.status && (APPLICATION_STATUSES as readonly string[]).includes(p.status)) qb.andWhere('a.status = :status', { status: p.status });
    if (p.vacancy) qb.andWhere('a.vacancyId = :v', { v: Number(p.vacancy) || 0 });
    const q = (p.q || '').trim().toLowerCase().slice(0, 100);
    if (q) {
      const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      qb.andWhere(
        new Brackets((w) => {
          for (const col of ['publicRef', 'fullName', 'email', 'phone', 'vacancyTitle', 'notes']) w.orWhere(`LOWER(COALESCE(a.${col}, '')) LIKE :like ESCAPE '\\'`, { like });
        }),
      );
    }
    qb.orderBy('a.createdAt', p.sort === 'oldest' ? 'ASC' : 'DESC').addOrderBy('a.id', p.sort === 'oldest' ? 'ASC' : 'DESC');
    return qb;
  }

  async counts() {
    const raw = await this.apps.createQueryBuilder('a').select('a.status', 'status').addSelect('COUNT(*)', 'n').groupBy('a.status').getRawMany<{ status: string; n: string }>();
    const out: Record<string, number> = { all: 0 };
    for (const s of APPLICATION_STATUSES) out[s] = 0;
    for (const r of raw) {
      out[r.status] = Number(r.n);
      out.all += Number(r.n);
    }
    return out;
  }

  private shape(a: Application) {
    // Internal file name is never sent to the browser.
    const { resumeFile, ipHash: _ip, ...rest } = a;
    return { ...rest, hasResume: !!resumeFile, statusLabel: APPLICATION_STATUS_LABELS[a.status] || a.status };
  }

  async listApplications(p: ApplicationQuery) {
    const limit = clampInt(p.limit, 1, 100, 10);
    const qb = this.filtered(p);
    const total = await qb.getCount();
    const pages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(clampInt(p.page, 1, 100_000, 1), pages);
    const items = await qb.skip((page - 1) * limit).take(limit).getMany();
    const vacancies = (await this.vacancies.find({ order: { sortOrder: 'ASC' } })).map((v) => ({ value: String(v.id), label: v.title }));
    return { items: items.map((a) => this.shape(a)), total, page, pages, limit, counts: await this.counts(), vacancies, retentionMonths: this.retentionMonths() };
  }

  async getApplication(id: number) {
    const a = await this.apps.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Application not found.');
    return a;
  }

  async applicationDetail(id: number) {
    return this.shape(await this.getApplication(id));
  }

  async updateApplication(id: number, patch: { status?: string; notes?: string }) {
    const a = await this.getApplication(id);
    if (patch.status !== undefined && patch.status !== a.status) {
      a.status = patch.status as ApplicationStatus;
      a.closedAt = a.status === 'unsuccessful' || a.status === 'archived' ? new Date() : null;
    }
    if (patch.notes !== undefined) a.notes = patch.notes.replace(/\r\n/g, '\n').trim();
    await this.apps.save(a);
    return this.applicationDetail(id);
  }

  async removeApplication(id: number) {
    const a = await this.getApplication(id);
    deleteResume(a.resumeFile);
    await this.apps.remove(a);
    return { ok: true };
  }

  async resume(id: number) {
    const a = await this.getApplication(id);
    const stream = a.resumeFile ? openResume(a.resumeFile) : null;
    if (!stream) throw new NotFoundException('No résumé is stored for this application.');
    return { stream, name: a.resumeName || `resume-${a.publicRef}`, type: a.resumeType || 'application/octet-stream' };
  }

  async exportCsv(p: ApplicationQuery) {
    const rows = (await this.filtered(p).getMany()).map((a) => this.shape(a));
    const cols: [string, (r: (typeof rows)[number]) => unknown][] = [
      ['Reference', (r) => r.publicRef],
      ['Received', (r) => new Date(r.createdAt).toISOString()],
      ['Status', (r) => r.statusLabel],
      ['Position', (r) => r.vacancyTitle],
      ['Full name', (r) => r.fullName],
      ['Email', (r) => r.email],
      ['Phone', (r) => r.phone],
      ['Experience', (r) => r.experience],
      ['Cover message', (r) => r.cover],
      ['Résumé', (r) => (r.hasResume ? r.resumeName : '')],
      ['Notes', (r) => r.notes],
    ];
    return [cols.map(([c]) => csvSafe(c)).join(','), ...rows.map((r) => cols.map(([, f]) => csvSafe(f(r))).join(','))].join('\r\n');
  }

  async seed(items: VacancyInput[]) {
    if (!items.length || (await this.vacancies.count()) > 0) return 0;
    for (const it of items) await this.createVacancy(it);
    return items.length;
  }
}
