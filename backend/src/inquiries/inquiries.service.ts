import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, LessThan, Repository } from 'typeorm';
import { createHash } from 'crypto';
import { Inquiry } from './inquiry.entity';
import { INQUIRY_STATUS_LABELS, INQUIRY_STATUSES, InquiryInput, InquiryStatus, UNSURE, validateInquiry } from './inquiry-validation';
import { csvSafe, isHoneypot, publicRef } from '../common/forms';
import { FieldErrors } from '../common/submission-error';
import { NotifierService } from '../common/notifier.service';
import { SettingsService } from '../settings/settings.service';
import { ServicesService } from '../services/services.service';
import { clampInt } from '../common/utils';

const MAX_NOTIFY_ATTEMPTS = 5;
const DAY_MS = 86_400_000;

export interface InquiryQuery {
  q?: string;
  status?: string;
  service?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

export const hashIp = (ip: string) => (ip ? createHash('sha256').update(`${process.env.SESSION_SECRET || 'dev'}:${ip}`).digest('hex').slice(0, 32) : '');

@Injectable()
export class InquiriesService implements OnModuleInit, OnModuleDestroy {
  // Logs never include names, emails, phone numbers or message text.
  private readonly logger = new Logger('Inquiries');
  private timers: ReturnType<typeof setInterval>[] = [];

  constructor(
    @InjectRepository(Inquiry) private readonly repo: Repository<Inquiry>,
    private readonly dataSource: DataSource,
    private readonly settings: SettingsService,
    private readonly services: ServicesService,
    private readonly notifier: NotifierService,
  ) {}

  onModuleInit() {
    if (this.notifier.configured) this.timers.push(setInterval(() => void this.retryOutbox(), 2 * 60_000));
    if (this.retentionMonths() > 0) this.timers.push(setInterval(() => void this.purgeExpired(), DAY_MS));
  }

  onModuleDestroy() {
    this.timers.forEach(clearInterval);
  }

  retentionMonths() {
    return clampInt(process.env.RETENTION_MONTHS, 0, 120, 0);
  }

  /** Options for the enquiry form: published services (never drafts) + "Not sure yet". */
  async formOptions() {
    const s = await this.settings.get();
    const services = (await this.services.listPublished(false)).map((x) => ({ value: x.slug, label: x.title }));
    return { services: [...services, UNSURE], open: s.inquiriesOpen };
  }

  async submit(input: InquiryInput, meta: { ip: string }) {
    if (isHoneypot(input.website)) {
      this.logger.warn(JSON.stringify({ event: 'inquiry.rejected', reason: 'honeypot' }));
      throw new BadRequestException({ error: 'spam' });
    }
    if (!(await this.settings.get()).inquiriesOpen) throw new ServiceUnavailableException({ error: 'closed' });
    const allowed = (await this.services.listPublished(false)).map((s) => s.slug);
    const { value, errors } = validateInquiry(input, { services: allowed });
    if (Object.keys(errors).length) throw new FieldErrors(errors);

    const row = await this.dataSource.transaction(async (m) => {
      const repo = m.getRepository(Inquiry);
      const saved = await repo.save(
        repo.create({
          ...value,
          consentAt: new Date(),
          status: 'new',
          notes: '',
          ipHash: hashIp(meta.ip),
          notifyStatus: this.notifier.configured ? 'pending' : 'disabled',
          notifyAttempts: 0,
          notifyError: null,
          closedAt: null,
        }),
      );
      saved.publicRef = publicRef('E', saved.id);
      return repo.save(saved);
    });
    this.logger.log(JSON.stringify({ event: 'inquiry.created', ref: row.publicRef, service: row.service }));
    if (this.notifier.configured) void this.notify(row);
    return { id: row.publicRef as string };
  }

  private async notify(x: Inquiry) {
    const labels = await this.services.labels();
    const service = labels.get(x.service) || x.service;
    try {
      await this.notifier.send({
        to: process.env.NOTIFY_TO || (await this.settings.get()).email,
        replyTo: x.email,
        subject: `New service enquiry ${x.publicRef} — ${service} (${x.company})`,
        rows: [
          ['Reference', x.publicRef || String(x.id)],
          ['Company', x.company],
          ['Name', x.name],
          ['Email', x.email],
          ['Phone', x.phone || '—'],
          ['Service', service],
          ['Location', x.location],
          ['Site', x.site || '—'],
        ],
        body: `${x.requirements}${x.message ? `\n\nAdditional message:\n${x.message}` : ''}`,
        link: this.notifier.adminUrl(`/inquiries/${x.id}`),
      });
      await this.repo.update({ id: x.id }, { notifyStatus: 'sent', notifyError: null, notifyAttempts: x.notifyAttempts + 1 });
    } catch (err) {
      this.logger.error(JSON.stringify({ event: 'inquiry.notify_failed', ref: x.publicRef }));
      await this.repo.update({ id: x.id }, { notifyStatus: 'failed', notifyError: (err as Error).message?.slice(0, 240) || 'Unknown error', notifyAttempts: x.notifyAttempts + 1 });
    }
  }

  async retryOutbox() {
    if (!this.notifier.configured) return 0;
    const due = await this.repo.find({
      where: { notifyStatus: In(['pending', 'failed']), notifyAttempts: LessThan(MAX_NOTIFY_ATTEMPTS), createdAt: LessThan(new Date(Date.now() - 60_000)) },
      take: 20,
    });
    for (const x of due) await this.notify(x);
    return due.length;
  }

  async resendNotification(id: number) {
    if (!this.notifier.configured) throw new BadRequestException('Email notifications are not configured (set SMTP_HOST in backend/.env).');
    await this.notify({ ...(await this.get(id)), notifyAttempts: 0 } as Inquiry);
    return this.detail(id);
  }

  /** Retention: deletes archived/responded and spam enquiries older than RETENTION_MONTHS (0 = keep). */
  async purgeExpired() {
    const months = this.retentionMonths();
    if (!months) return { deleted: 0, months: 0 };
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const a = await this.repo.delete({ status: In(['archived', 'responded']), closedAt: LessThan(cutoff) });
    const b = await this.repo.delete({ status: 'spam', updatedAt: LessThan(cutoff) });
    return { deleted: (a.affected ?? 0) + (b.affected ?? 0), months };
  }

  // ---------- admin ----------

  private filtered(p: InquiryQuery) {
    const qb = this.repo.createQueryBuilder('x');
    if (p.status && (INQUIRY_STATUSES as readonly string[]).includes(p.status)) qb.andWhere('x.status = :status', { status: p.status });
    else qb.andWhere("x.status != 'spam'");
    if (p.service) qb.andWhere('x.service = :service', { service: p.service });
    const q = (p.q || '').trim().toLowerCase().slice(0, 100);
    if (q) {
      const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      qb.andWhere(
        new Brackets((w) => {
          for (const col of ['publicRef', 'company', 'name', 'email', 'phone', 'location', 'site', 'requirements', 'notes'])
            w.orWhere(`LOWER(COALESCE(x.${col}, '')) LIKE :like ESCAPE '\\'`, { like });
        }),
      );
    }
    qb.orderBy('x.createdAt', p.sort === 'oldest' ? 'ASC' : 'DESC').addOrderBy('x.id', p.sort === 'oldest' ? 'ASC' : 'DESC');
    return qb;
  }

  async counts() {
    const raw = await this.repo.createQueryBuilder('x').select('x.status', 'status').addSelect('COUNT(*)', 'n').groupBy('x.status').getRawMany<{ status: string; n: string }>();
    const out: Record<string, number> = { all: 0 };
    for (const s of INQUIRY_STATUSES) out[s] = 0;
    for (const r of raw) {
      out[r.status] = Number(r.n);
      if (r.status !== 'spam') out.all += Number(r.n);
    }
    return out;
  }

  private async shape(rows: Inquiry[]) {
    const labels = await this.services.labels();
    return rows.map((r) => ({
      ...r,
      ipHash: undefined,
      serviceLabel: r.service === UNSURE.value ? 'Not sure yet' : labels.get(r.service) || r.service,
      statusLabel: INQUIRY_STATUS_LABELS[r.status] || r.status,
    }));
  }

  async list(p: InquiryQuery) {
    const limit = clampInt(p.limit, 1, 100, 10);
    const qb = this.filtered(p);
    const total = await qb.getCount();
    const pages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(clampInt(p.page, 1, 100_000, 1), pages);
    const items = await qb.skip((page - 1) * limit).take(limit).getMany();
    const labels = await this.services.labels();
    return {
      items: await this.shape(items),
      total,
      page,
      pages,
      limit,
      counts: await this.counts(),
      services: [...Array.from(labels.entries()).map(([value, label]) => ({ value, label })), { value: UNSURE.value, label: 'Not sure yet' }],
      notificationsConfigured: this.notifier.configured,
      retentionMonths: this.retentionMonths(),
    };
  }

  async get(id: number) {
    const x = await this.repo.findOne({ where: { id } });
    if (!x) throw new NotFoundException('Enquiry not found.');
    return x;
  }

  async detail(id: number) {
    return (await this.shape([await this.get(id)]))[0];
  }

  async update(id: number, patch: { status?: string; notes?: string }) {
    const x = await this.get(id);
    if (patch.status !== undefined && patch.status !== x.status) {
      x.status = patch.status as InquiryStatus;
      x.closedAt = x.status === 'archived' || x.status === 'responded' ? new Date() : null;
    }
    if (patch.notes !== undefined) x.notes = patch.notes.replace(/\r\n/g, '\n').trim();
    await this.repo.save(x);
    return this.detail(id);
  }

  async remove(id: number) {
    await this.repo.remove(await this.get(id));
    return { ok: true };
  }

  async exportCsv(p: InquiryQuery) {
    const rows = await this.shape(await this.filtered(p).getMany());
    const cols: [string, (r: (typeof rows)[number]) => unknown][] = [
      ['Reference', (r) => r.publicRef],
      ['Received', (r) => new Date(r.createdAt).toISOString()],
      ['Status', (r) => r.statusLabel],
      ['Company', (r) => r.company],
      ['Name', (r) => r.name],
      ['Email', (r) => r.email],
      ['Phone', (r) => r.phone],
      ['Service', (r) => r.serviceLabel],
      ['Location', (r) => r.location],
      ['Site', (r) => r.site],
      ['Requirements', (r) => r.requirements],
      ['Message', (r) => r.message],
      ['Notes', (r) => r.notes],
    ];
    return [cols.map(([c]) => csvSafe(c)).join(','), ...rows.map((r) => cols.map(([, f]) => csvSafe(f(r))).join(','))].join('\r\n');
  }
}
