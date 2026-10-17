'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Design reveal(): elements marked data-reveal below the fold fade/rise in once as they
 * enter the viewport. Off with prefers-reduced-motion; without JS everything stays visible.
 */
export function Reveal() {
  const pathname = usePathname();
  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.remove('rv-hidden');
          io.unobserve(e.target);
        }),
      { rootMargin: '0px 0px -8% 0px' },
    );
    const raf = requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        if (el.dataset.revealed) return;
        el.dataset.revealed = '1';
        if (el.getBoundingClientRect().top < window.innerHeight) return;
        el.classList.add('rv-anim', 'rv-hidden');
        io.observe(el);
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [pathname]);
  return null;
}
