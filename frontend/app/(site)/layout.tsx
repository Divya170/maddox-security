import { getSite } from '@/lib/api';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { Reveal } from '@/components/site/Reveal';

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  let site;
  try {
    site = await getSite();
  } catch {
    return (
      <main id="main">
        <section className="dark">
          <div className="gridlines" aria-hidden="true" />
          <div className="phero">
            <div>
              <p className="pill">SERVICE UNAVAILABLE</p>
              <h1>We’ll be right back.</h1>
            </div>
            <div>
              <p className="intro">The website can’t load its content right now. Please try again in a moment.</p>
              <div>
                <a href="" className="btn btn-light">
                  Try again
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }
  const s = site.settings;
  return (
    <>
      <a href="#main" className="skip">
        Skip to main content
      </a>
      {site.preview && (
        <div role="note" className="review">
          <span>{s.reviewNote || 'Review mode — draft content awaiting owner approval is visible and labelled. It is hidden from the public site.'}</span>
          <a href="/preview?off=1">Exit preview</a>
        </div>
      )}
      <Header phone={s.phone} telHref={s.telHref} />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        {children}
      </main>
      <Footer s={s} services={site.services} />
      <Reveal />
    </>
  );
}
