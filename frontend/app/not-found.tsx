import Link from 'next/link';

/** Design 404: hero "We couldn’t find that page." + two buttons. */
export default function NotFound() {
  return (
    <main id="main">
      <section className="dark" data-screen-label="Not found">
        <div className="gridlines" aria-hidden="true" />
        <div className="phero">
          <div>
            <p className="pill">PAGE NOT FOUND</p>
            <h1>We couldn’t find that page.</h1>
          </div>
          <div>
            <p className="intro">The page may have moved or no longer exists. Use the links below to continue.</p>
          </div>
        </div>
      </section>
      <section className="state-btns" style={{ paddingBottom: 80 }}>
        <Link href="/" className="btn btn-navy" style={{ minHeight: 54, padding: '0 26px' }}>
          Go to the homepage
        </Link>
        <Link href="/contact" className="btn btn-outline" style={{ minHeight: 54, padding: '0 26px' }}>
          Contact Maddox Security Services
        </Link>
      </section>
    </main>
  );
}
