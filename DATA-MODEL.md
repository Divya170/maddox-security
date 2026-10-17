# Maddox Security Services — data model extracted from the design comp

Sources: `design-source/Maddox Security Services v2.dc.html` (**built from this one**) and `Maddox Security Services.dc.html` (v1, reference).
v2 restyles v1: dark navy hero with a 6-column rule grid on every inner page, a bento services grid with a large photo card, scroll-reveal, a contact form card that overlaps the hero, a closing CTA with gold rings and a giant "MADDOX" footer wordmark. Pages, copy, form rules and flags are the same.

## Identity
- Business: Maddox Security Services — contact Chase Maddox · +1 (404) 798-9172 · chase.maddox@outlook.com · 1000 Washington St, Boston, MA 21180.
- Fonts: Manrope 300–800 (display), Inter 400–600 (body).
- Colours: navy `#14232E` (header, heroes, footer, primary buttons), charcoal `#20282D` (text, CTA band, contact aside), page `#F5F4EF`, white cards, field `#FAFAF7` / read-only `#F0EFEA`, image bg `#E7E5DE` / `#22323D`.
  - Lines: `#E4E6E3` / `#D9DEDF` / `#B8C0C3` (inputs) / `#C9CFD1` (dashed empty state).
  - Gold `#B69A62` (rules, bullets, focus ring), gold-light `#D4BC8A` / `#C9AE77` / `#E3D3B0`, bronze `#7A6338` (eyebrows, hover), draft border `#C9B48A`.
  - Text: `#3A454C` / `#4A555C` / `#5A666E` / `#9AA4AA`; on dark `#C9CFD2` / `#D5DADC` / `#E4E7E8` / `#AEB7BC`.
  - Error `#B42318` (text), `#7A1A12` on `#FDF3F2` / `#E8B4AE`; success `#276749` with border `#CFE3D7`.
- Logo: gold-outlined "M" square + "MADDOX" (800, .22em tracking) over "SECURITY SERVICES" (9px, .28em).
- Motion: scroll reveal (opacity + 24px rise, .7s), hover lifts (-2/-4px), service accordion. All off with `prefers-reduced-motion`.
- Breakpoints: full nav + header CTA ≥ 1000px (below: "Menu" button opening a full-screen dialog menu, Esc closes, focus returns); contact form spans 2 columns ≥ 1100px.

## Routes
| Comp | App | Sections |
|---|---|---|
| `#/` | `/` | Hero (eyebrow pill, H1 "Professional Security. Confidence for Your Business.", intro, Request a Consultation / Explore Our Services, 3-item strip, photo with "PREFER TO TALK?" phone card) · statement · services bento (first service as a tall photo card, the others as cards, gold "NOT SURE YET?" card) · "How an enquiry works" (sticky intro + 3 steps) · wide photo · "The company" · industries preview (review only) · careers teaser · closing CTA |
| `#/services` (`/:id`) | `/services` (`#svc-guard`) | Page hero (+ "Discuss Your Requirements") · featured first service (photo + "A professional presence at your premises.") · "ALL SERVICES" accordion (overview, "Helpful to share in your enquiry", "Discuss {service}" → `/contact?service=id`) · closing CTA |
| `#/industries` | `/industries` | Page hero · "Start with the service, then tell us about the site." + service links (public) · "Candidate sectors" (5 alternating rows, **draft — review only**) · closing CTA |
| `#/company` | `/company` | Page hero · wide photo · approach statement + 2 paragraphs (+ draft "approved company profile" placeholder) · credentials & compliance (**draft rows**) · contact details card |
| `#/careers` | `/careers` | Page hero · photo + "Current vacancies" (count chip; empty state "There are no published vacancies at present.") · closing CTA |
| `#/careers/:id` | `/careers/[slug]` | Back link · vacancy (title, location/type chips, "About the role") + application form, or "This vacancy is no longer available." |
| `#/contact` (`?service=`) | `/contact` | Hero "Request a Security Service Assessment" · enquiry form (3 fieldsets) overlapping the hero · "CONTACT DIRECTLY" aside + "Looking for a job?" |
| `#/privacy`, `#/terms` | `/privacy`, `/terms` | Page hero · "This document is being finalized…" until approved text exists |
| other | 404 | Hero "We couldn’t find that page." + Go to the homepage / Contact |

## Content (seeded verbatim)
- **Services** (dedicated table): guard, commercial, event, access (published) + patrol "Mobile Patrol" (**draft**, "awaiting owner confirmation"). Fields: slug, title, summary, overview (defaults to the summary), photo.
- **Hero strip** (3), **enquiry steps** (3), **industries** (5 — drafts: name, body, related services, photo label), **credentials** (Licensing, Insurance, Qualifications, Certifications — drafts until verified details exist).
- **Vacancies** — none in the design. The design's "Security Officer" listing is labelled "SAMPLE LISTING · INTERNAL PREVIEW · NOT A REAL VACANCY" and is **not seeded**.
- **Image slots:** hero-photo, home-band, company-wide, careers-photo; one per service (home card + featured service); one per industry.

## Enquiry form (contact) — exact rules
| Field | Rule → message |
|---|---|
| company | required → "Enter your company name." · ≤120 |
| name | required → "Enter your name." · ≤120 |
| email | required → "Enter your business email address." · `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` → "Enter an email address in the format name@company.com." · ≤160 |
| phone | optional · `/^[0-9+()\-.\s]{7,24}$/` → "Enter a phone number using digits, spaces, or + ( ) -." |
| service | published service id or `unsure` ("Not sure yet — discuss during consultation") → "Select a service type, or choose “Not sure yet”." |
| location | required → "Enter a city, town, or general service area." · ≤120 |
| site | optional ≤120 ("office building, retail unit, event") |
| requirements | ≥20 → "Briefly describe the support you need (at least 20 characters)." · ≤2000 |
| message | optional ≤2000 |
| privacy | checked → "Confirm the privacy acknowledgement to send your enquiry." |
| website | honeypot → rejected with the design's "spam" message |

## Application form (vacancy) — exact rules
| Field | Rule → message |
|---|---|
| fullName | required → "Enter your full name." · ≤120 |
| email | required → "Enter your email address." · format → "Enter an email address in the format name@example.com." · ≤160 |
| phone | optional · same phone rule |
| position | read-only, the vacancy title |
| experience, cover | optional ≤2000 |
| resume | optional · PDF/DOC/DOCX → "Upload a PDF, DOC, or DOCX file." · ≤5 MB → "The file is larger than 5 MB. Upload a smaller file." · "Stored privately and seen only by authorized recruitment staff." |
| privacy | checked → "Confirm the privacy acknowledgement to submit your application." |

Both forms:
- **Error summary:** "There is 1 problem to fix:" / "There are N problems to fix:", with "Label: message" buttons that focus each field.
- **Failure outcomes** (title + body):
  - **server:** "We couldn’t send your submission just now." — "Your details are still here. Please try again, or contact us by phone or email."
  - **network:** "Your connection appears to have dropped." — "Nothing was lost — check your connection and try again."
  - **ratelimit:** "Too many submissions have been received from this connection." — "Please wait a few minutes before trying again, or contact us directly."
  - **spam:** "We couldn’t accept this submission." — "Please try again, or contact us directly by phone or email."
- **Buttons:** "Submit Enquiry" / "Submit Application" → "Sending…" / "Submitting…" → "Try Again" after a failure.
- **Success cards:**
  - Enquiry: "ENQUIRY SENT — Thank you for contacting Maddox Security Services. Your enquiry has been received." + Explore Services / Return home.
  - Application: "APPLICATION RECEIVED — Thank you. Your application for this position has been received by Maddox Security Services." + Back to Careers.

## Flags & simulations
| Prop | Default | Implementation |
|---|---|---|
| `showDrafts` | false | **Draft preview for signed-in staff only.** The admin's "Preview drafts" link sets a cookie, and the API includes drafts only when that request also carries a valid admin session, so drafts are never exposed to the public. The site then shows the review banner and DRAFT labels. |
| `previewVacancy` | false | Not reproduced. Vacancies are real records managed in the admin; there is no sample listing. |
| `submitOutcome` success/server/network/ratelimit | success | Not reproduced. Real API responses drive those states. |

Also not reproduced: the 1.4 s fake submit delay, JS width checks (real CSS breakpoints instead), and `<image-slot>` drag-and-drop (photos are uploaded in the admin).
