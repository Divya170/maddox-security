'use client';

import Link from 'next/link';

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="dark" role="alert">
      <div className="gridlines" aria-hidden="true" />
      <div className="phero">
        <div>
          <p className="pill">SOMETHING WENT WRONG</p>
          <h1>This page didn’t load.</h1>
        </div>
        <div>
          <p className="intro">Please try again. You can still contact us by phone or email.</p>
          <div className="btns">
            <button type="button" className="btn btn-light" onClick={reset}>
              Try again
            </button>
            <Link href="/contact" className="btn btn-ghost-dark">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
