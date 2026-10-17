import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { ApplicationStatus } from './career-validation';

/** Table `applications` — job applications. Résumé files live in a private folder, never under /uploads. */
@Entity('applications')
@Index(['status', 'createdAt'])
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  /** MSS-A-1001 */
  @Index({ unique: true })
  @Column({ name: 'public_ref', type: 'varchar', nullable: true })
  publicRef: string | null;

  @Index()
  @Column({ name: 'vacancy_id', type: 'integer', nullable: true })
  vacancyId: number | null;

  /** Snapshot of the title applied for (kept if the vacancy is later deleted) */
  @Column({ name: 'vacancy_title' })
  vacancyTitle: string;

  @Column({ name: 'full_name', type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 24, default: '' })
  phone: string;

  @Column({ type: 'text', default: '' })
  experience: string;

  @Column({ type: 'text', default: '' })
  cover: string;

  /** Random stored file name inside PRIVATE_UPLOAD_DIR (null = no résumé) */
  @Column({ name: 'resume_file', type: 'varchar', nullable: true })
  resumeFile: string | null;

  @Column({ name: 'resume_name', type: 'varchar', nullable: true })
  resumeName: string | null;

  @Column({ name: 'resume_type', type: 'varchar', nullable: true })
  resumeType: string | null;

  @Column({ name: 'resume_size', type: 'integer', default: 0 })
  resumeSize: number;

  @Column({ name: 'consent_at', type: 'datetime' })
  consentAt: Date;

  @Column({ type: 'varchar', default: 'new' })
  status: ApplicationStatus;

  @Column({ type: 'text', default: '' })
  notes: string;

  @Column({ name: 'ip_hash', default: '' })
  ipHash: string;

  @Column({ name: 'notify_status', default: 'pending' })
  notifyStatus: 'pending' | 'sent' | 'failed' | 'disabled';

  @Column({ name: 'notify_attempts', default: 0 })
  notifyAttempts: number;

  @Column({ name: 'closed_at', type: 'datetime', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
