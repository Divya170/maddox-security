import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** An approved job opening. Unpublished = draft (staff preview only). */
@Entity('vacancies')
export class Vacancy {
  @PrimaryGeneratedColumn()
  id: number;

  /** URL: /careers/{slug} — fixed after creation */
  @Index({ unique: true })
  @Column()
  slug: string;

  @Column()
  title: string;

  @Column({ default: '' })
  location: string;

  /** e.g. Full-time, Part-time, Contract */
  @Column({ default: '' })
  employmentType: string;

  /** One line on the careers list */
  @Column({ type: 'text', default: '' })
  summary: string;

  /** "About the role" — approved job description */
  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'text', default: '' })
  requirements: string;

  @Column({ type: 'text', default: '' })
  howToApply: string;

  /** YYYY-MM-DD; after this date the listing shows "no longer available" */
  @Column({ type: 'varchar', nullable: true })
  closesOn: string | null;

  @Column({ default: false })
  published: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
