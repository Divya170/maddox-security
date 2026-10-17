import type { Metadata } from 'next';
import { getSite } from '@/lib/api';
import { LegalPage } from '@/components/site/LegalPage';

export const metadata: Metadata = { title: 'Terms of Use' };

export default async function TermsPage() {
  const { settings: s } = await getSite();
  return <LegalPage title="Terms of Use" intro="Terms governing use of this website." text={s.termsOfUse} s={s} />;
}
