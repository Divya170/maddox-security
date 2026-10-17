import Link from 'next/link';
import type { PublicSettings, Service } from '@/lib/types';
import { NAV, serviceHref } from '@/lib/links';

export function Footer({ s, services }: { s: PublicSettings; services: Service[] }) {
  return (
    <footer className="ftr">
      <div className="ftr__in">
        <div className="ftr__grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {s.tagline && <p className="ftr__lead">{s.tagline}</p>}
            <div>
              <Link href="/contact" className="ftr__btn">
                Request a Consultation <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <nav aria-label="Footer" className="ftr__col">
            <p className="ftr__h">SITE</p>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}>
                {n.label}
              </Link>
            ))}
          </nav>
          {services.length > 0 && (
            <div className="ftr__col">
              <p className="ftr__h">SERVICES</p>
              {services
                .filter((x) => !x.draft)
                .map((x) => (
                  <Link key={x.slug} href={serviceHref(x.slug)}>
                    {x.title}
                  </Link>
                ))}
            </div>
          )}
          <div className="ftr__contact">
            <p className="ftr__h" style={{ marginBottom: 6 }}>
              CONTACT
            </p>
            {(s.addressLine1 || s.addressLine2) && (
              <address>
                {s.addressLine1}
                {s.addressLine1 && s.addressLine2 && <br />}
                {s.addressLine2}
              </address>
            )}
            {s.mailHref && <a href={s.mailHref}>{s.email}</a>}
            {s.telHref && <a href={s.telHref}>{s.phone}</a>}
          </div>
        </div>
        <div className="ftr__bottom">
          <p>
            © {new Date().getFullYear()} {s.businessName}
          </p>
          <div>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms of use</Link>
            <Link href="/admin/login" rel="nofollow">
              Staff sign-in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
