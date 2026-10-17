import Link from 'next/link';

/** Gold-outlined "M" mark + MADDOX / SECURITY SERVICES wordmark (design header). */
export function Logo({ href = '/', label = 'Maddox Security Services — home' }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="logo" aria-label={label}>
      <span className="logo__mark" aria-hidden="true">
        M
      </span>
      <span className="logo__text" aria-hidden="true">
        <span className="logo__name">MADDOX</span>
        <span className="logo__sub">SECURITY SERVICES</span>
      </span>
    </Link>
  );
}
