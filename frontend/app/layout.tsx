import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Maddox Security Services — Professional Security for Organizations', template: '%s — Maddox Security Services' },
  description: 'Professional security services for organizations: guard services, commercial security, event security and access control. Request a consultation.',
  openGraph: { title: 'Maddox Security Services', description: 'Professional Security. Confidence for Your Business.' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#14232E' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
