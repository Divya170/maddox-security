import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Singleton (id = 1): business details, legal text and switches. */
@Entity('settings')
export class Settings {
  @PrimaryColumn()
  id: number;

  @Column({ default: 'Maddox Security Services' })
  businessName: string;

  @Column({ default: '' })
  contactName: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  addressLine1: string | null;

  @Column({ type: 'varchar', nullable: true })
  addressLine2: string | null;

  /** Footer statement ("Professional security services for organizations.") */
  @Column({ default: '' })
  tagline: string;

  /** Owner-approved company background, approach and standards. Empty = only the design's two paragraphs. */
  @Column({ type: 'text', default: '' })
  companyProfile: string;

  /** Approved legal text. Empty = "This document is being finalized…" */
  @Column({ type: 'text', default: '' })
  privacyPolicy: string;

  @Column({ type: 'text', default: '' })
  termsOfUse: string;

  /** Text of the staff preview banner. */
  @Column({ type: 'text', default: '' })
  reviewNote: string;

  /** When off the enquiry form asks visitors to call or email instead. */
  @Column({ default: true })
  inquiriesOpen: boolean;

  /** When off, vacancy pages show details but not the application form. */
  @Column({ default: true })
  applicationsOpen: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
