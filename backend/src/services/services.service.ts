import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Service } from './service.entity';
import { ServiceInput, validateService } from './service-validation';
import { slugify } from '../common/utils';
import type { ServiceSeed } from '../database/seed-data';

export const UNSURE_LABEL = 'Not sure yet';

@Injectable()
export class ServicesService {
  constructor(@InjectRepository(Service) private readonly repo: Repository<Service>) {}

  /** Services in order, numbered 01, 02, … Drafts (unpublished) are included only for staff preview. */
  async listPublished(includeDrafts = false) {
    const rows: Service[] = await this.repo.find({ where: includeDrafts ? {} : { published: true }, order: { sortOrder: 'ASC', id: 'ASC' } });
    return rows.map((s, i) => ({
      id: s.id,
      num: String(i + 1).padStart(2, '0'),
      slug: s.slug,
      title: s.title,
      summary: s.summary,
      overview: s.overview || s.summary,
      featureHeadline: s.featureHeadline || s.title,
      image: s.image,
      imageAlt: s.imageAlt || `Photo: ${s.title}`,
      imageLabel: s.imageLabel || `Photo — ${s.title}`,
      draft: !s.published,
    }));
  }

  /** slug → title for every service (drafts too, so old enquiries still show a label). */
  async labels(): Promise<Map<string, string>> {
    const rows: Service[] = await this.repo.find();
    return new Map<string, string>(rows.map((r) => [r.slug, r.title]));
  }

  adminList() {
    return this.repo.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  private fail(errors: Record<string, string>): never {
    const n = Object.keys(errors).length;
    throw new BadRequestException({ message: n === 1 ? 'Please correct 1 field.' : `Please correct ${n} fields.`, errors });
  }

  private async uniqueSlug(base: string) {
    const root = base && base !== 'unsure' ? base : 'service';
    let slug = root;
    for (let i = 2; await this.repo.findOne({ where: { slug } }); i++) slug = `${root}-${i}`;
    return slug;
  }

  async create(body: ServiceInput) {
    const { value, errors } = validateService(body);
    if (Object.keys(errors).length) this.fail(errors);
    const max = await this.repo.createQueryBuilder('s').select('MAX(s.sortOrder)', 'max').getRawOne<{ max: number | null }>();
    const slug = await this.uniqueSlug(value.slug || slugify(value.title).slice(0, 40));
    return this.repo.save(this.repo.create({ ...value, slug, sortOrder: (max?.max ?? 0) + 1 }));
  }

  async update(id: number, body: ServiceInput) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Service not found.');
    // slug is fixed after creation so stored enquiries and links keep working
    const { value, errors } = validateService({ ...row, ...body, slug: row.slug });
    if (Object.keys(errors).length) this.fail(errors);
    Object.assign(row, { ...value, slug: row.slug });
    return this.repo.save(row);
  }

  async remove(id: number) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Service not found.');
    await this.repo.remove(row);
    return { ok: true };
  }

  async reorder(ids: number[]) {
    const rows = await this.repo.find({ where: { id: In(ids) } });
    if (rows.length !== ids.length) throw new BadRequestException('Reorder list does not match the services.');
    await Promise.all(ids.map((id, i) => this.repo.update({ id }, { sortOrder: i + 1 })));
    return this.adminList();
  }

  async seed(items: ServiceSeed[]) {
    if ((await this.repo.count()) > 0) return 0;
    await this.repo.save(items.map((s, i) => this.repo.create({ ...s, image: null, imageAlt: '', sortOrder: i + 1 })));
    return items.length;
  }
}
