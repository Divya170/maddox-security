import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { InquiryStatus } from './inquiry-validation';

/** Table `inquiries` — one row per "Request a Security Service Assessment" submission. */
@Entity('inquiries')
@Index(['status', 'createdAt'])
export class Inquiry {
  @PrimaryGeneratedColumn()
  id: number;

  /** MSS-E-1001 — set in the same transaction as the insert */
  @Index({ unique: true })
  @Column({ name: 'public_ref', type: 'varchar', nullable: true })
  publicRef: string | null;

  @Column({ type: 'varchar', length: 120 })
  company: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 24, default: '' })
  phone: string;

  /** Service slug or "unsure" */
  @Column()
  service: string;

  @Column({ type: 'varchar', length: 120 })
  location: string;

  /** "Site or service type" (optional) */
  @Column({ type: 'varchar', length: 120, default: '' })
  site: string;

  @Column({ type: 'text' })
  requirements: string;

  @Column({ type: 'text', default: '' })
  message: string;

  /** When the visitor ticked the privacy acknowledgement */
  @Column({ name: 'consent_at', type: 'datetime' })
  consentAt: Date;

  @Column({ type: 'varchar', default: 'new' })
  status: InquiryStatus;

  @Column({ type: 'text', default: '' })
  notes: string;

  @Column({ name: 'ip_hash', default: '' })
  ipHash: string;

  /** pending | sent | failed | disabled (no SMTP) */
  @Column({ name: 'notify_status', default: 'pending' })
  notifyStatus: 'pending' | 'sent' | 'failed' | 'disabled';

  @Column({ name: 'notify_attempts', default: 0 })
  notifyAttempts: number;

  @Column({ name: 'notify_error', type: 'varchar', nullable: true })
  notifyError: string | null;

  @Column({ name: 'closed_at', type: 'datetime', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
