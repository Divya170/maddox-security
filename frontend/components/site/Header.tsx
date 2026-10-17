'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { NAV } from '@/lib/links';
import { Logo } from './Logo';

export function Header({ phone, telHref }: { phone: string | null; telHref: string | null }) {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  // Full-screen dialog menu: focus Close on open, return focus to Menu on close, Esc closes, body scroll locked.
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      closeBtn.current?.focus();
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
      window.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener('keydown', onKey);
      };
    }
    if (wasOpen.current) menuBtn.current?.focus();
  }, [open]);

  const current = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <header className={`hdr${scrolled ? ' is-scrolled' : ''}`}>
        <div className="hdr__in">
          <Logo />
          <nav className="nav" aria-label="Main">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={current(n.href) ? 'page' : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/contact" className="btn btn-light btn--chip hdr__cta">
              Request a Consultation
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </Link>
            <button ref={menuBtn} type="button" className="menu-btn" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="mobile-menu">
              <i aria-hidden="true">
                <span />
                <span />
              </i>
              Menu
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Site menu" className="mmenu">
          <div className="mmenu__top">
            <span style={{ font: '800 17px/1 var(--f-d)', letterSpacing: '.22em' }}>MADDOX</span>
            <button ref={closeBtn} type="button" className="mmenu__close" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <nav aria-label="Main">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={current(n.href) ? 'page' : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <Link href="/contact" className="btn btn-light mmenu__cta">
            Request a Consultation
          </Link>
          {telHref && (
            <a href={telHref} className="mmenu__tel">
              {phone}
            </a>
          )}
        </div>
      )}
    </>
  );
}
