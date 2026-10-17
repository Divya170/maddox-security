import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * A security service. Published services drive the home bento, the services accordion,
 * the industries links, the footer and the enquiry form. Unpublished = draft (visible only in staff preview).
 */
@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  /** Form value and anchor (guard, commercial, event, access, …) — fixed after creation. */
  @Index({ unique: true })
  @Column()
  slug: string;

  @Column()
  title: string;

  /** Card + list summary */
  @Column({ type: 'text', default: '' })
  summary: string;

  /** "OVERVIEW" in the expanded panel (falls back to the summary) */
  @Column({ type: 'text', default: '' })
  overview: string;

  /** Headline when this service is featured first on the Services page */
  @Column({ default: '' })
  featureHeadline: string;

  @Column({ type: 'varchar', nullable: true })
  image: string | null;

  @Column({ default: '' })
  imageAlt: string;

  /** Placeholder caption until a photo is uploaded */
  @Column({ default: '' })
  imageLabel: string;

  @Column({ default: false })
  published: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
