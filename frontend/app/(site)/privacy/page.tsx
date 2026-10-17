import type { Metadata } from 'next';
import { getSite } from '@/lib/api';
import { LegalPage } from '@/components/site/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default async function PrivacyPage() {
  const { settings: s } = await getSite();
  return <LegalPage title="Privacy Policy" intro={`How ${s.businessName} handles information submitted through this website.`} text={s.privacyPolicy} s={s} />;
}
