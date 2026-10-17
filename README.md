# Maddox Security Services — website

A professional security services website with a service-enquiry form, careers with online job applications (private résumé upload), and a staff admin.
**Stack:** Next.js 14 (App Router) frontend · NestJS 10 API · SQLite3 via TypeORM.
Built from the "Maddox Security Services v2 Redesign" design comp (`design-source/`). Every rule, message and piece of copy taken from it is listed in `DATA-MODEL.md`.

```
maddox-security/
├── backend/        NestJS API (src/, package.json, .env.example)
│   ├── uploads/          public site photos (served at /uploads)
│   └── private-uploads/  résumés — never served publicly
├── frontend/       Next.js site + admin (app/, components/, lib/)
├── database/       app.sqlite is created here on first boot
├── design-source/  original .dc.html comps (v1 + v2), support.js, image-slot.js
├── DATA-MODEL.md   what was extracted from the design
├── package.json    root scripts
└── README.md
```

## Run it

```bash
npm install                               # root (concurrently)
npm run install:all                       # backend + frontend dependencies
cp backend/.env.example backend/.env      # set SESSION_SECRET, admin login, optional SMTP
cp frontend/.env.example frontend/.env.local
npm run dev                               # API on :4000, site on :3000
```

On first boot the API creates `database/app.sqlite` and seeds content from the design. Seeding never overwrites your edits.
- **Settings:** business details.
- **Services:** the five services. Guard, Commercial, Event and Access Control are published; Mobile Patrol is a **draft**, as in the design.
- **Content:** the hero strip and the 3 enquiry steps.
- **Drafts:** the 5 candidate sectors and the 4 credential rows.
- **Admin account:** its credentials are printed to the console.

- **Site:** http://localhost:3000
- **Admin:** http://localhost:3000/admin, also linked as "Staff sign-in" in the footer.
  - Default login: `admin@maddoxsecurity.local` / `MaddoxAdmin#2026`.
  - Change it in `backend/.env` before first boot, or later under **Account**.
- **Tests:** `npm test` runs 10 business-rule checks: both forms' rules with the design's exact messages, résumé type/size/byte checks, vacancy open/closed rules, references, CSV safety, cookie/CSRF helpers, the credential publish rule and the seed data.

## What's built

### Public site (v2 design)
| Page | Highlights |
|---|---|
| `/` Home | **Hero:** navy with the 6-column rule grid, "Professional Security. *Confidence* for Your Business.", the 3-item strip, a photo slot and the "PREFER TO TALK?" phone card.<br>**Sections:** statement; services bento (first service as the tall photo card, the gold "NOT SURE YET?" card); "How an enquiry works" with a sticky intro; wide photo; "The company"; "Environments we can discuss" (only once sectors are published); careers teaser; closing CTA. |
| `/services` | Page hero, featured first service and the "ALL SERVICES" accordion (overview, "Helpful to share", **Discuss {service}** → `/contact?service=…`). Links like `/services#svc-event` open that panel and scroll to it. |
| `/industries` | Published sectors as alternating photo/text rows. With none published, it shows the design's "Start with the service, then tell us about the site." with service links. |
| `/company` | Wide photo, approach text, the approved company profile (from Settings), credentials (only verified rows publicly) and the contact-details card. |
| `/careers` | Photo and "Current vacancies", with a count chip and the design's empty state "There are no published vacancies at present." |
| `/careers/[slug]` | Vacancy (location/type chips, about the role, requirements) with the **application form**. Missing or closed vacancies show "This vacancy is no longer available." |
| `/contact` | "Request a Security Service Assessment": the 3-fieldset enquiry form overlaps the hero, with the "CONTACT DIRECTLY" aside and "Looking for a job?". |
| `/privacy`, `/terms` | Approved text from Settings, or the design's "This document is being finalized…" note. |

- **Forms** (both): the design's exact messages.
  - Error summary "There are N problems to fix:" with buttons that focus each field.
  - Outcome messages for server, network, rate-limit and spam errors; the button changes to "Try Again" after a failure.
  - Honeypot field.
  - **Success cards** with a reference (`MSS-E-1001` / `MSS-A-1001`):
    - Enquiry: **Explore Services** / **Return home**.
    - Application: **Back to Careers**.
  - A `?service=` link preselects the service with "Preselected from the service you were viewing — you can change it."
- **Every page:** loading skeleton, error page with retry, the design's 404 ("We couldn't find that page." + two buttons), and a fallback when the API is down.
- **Responsive:** full nav ≥ 1000px; below that, a full-screen dialog menu that closes on Esc and returns focus. The contact form spans two columns ≥ 1100px.
- **Motion:** scroll reveal and hover lifts, all off with `prefers-reduced-motion`.

### Backend modules
`admin-auth` · `common` · `settings` · `services` · `content` · `inquiries` · `careers` · `uploads`
- **`POST /api/inquiries`** — server validation identical to the form.
  - Only **published** services (or "unsure") are accepted, and the privacy consent time is stored.
  - Honeypot → 400 "spam" (the design's outcome); rate limit 5 per 10 minutes per IP.
  - A setting can pause online enquiries.
- **`POST /api/careers/vacancies/:slug/applications`** — multipart with an optional résumé.
  - **PDF/DOC/DOCX ≤ 5 MB**, checked by extension **and** by the file's real bytes.
  - The file is saved under a random name in a **private folder** that is never served. Staff download it only through an authenticated, audit-logged admin route.
  - Applications only for published, open vacancies (closing date in Boston time). The vacancy title is kept even if the vacancy is deleted.
- **Draft preview (the design's `showDrafts`):**
  - The admin's **Preview drafts on site** link sets a preview cookie.
  - The API returns drafts (unpublished services, sectors, credentials, vacancies, plus the company-profile placeholder) **only if the request also carries a valid admin session**. Visitors can never see drafts.
- **Optional staff emails** for new enquiries and applications over SMTP (résumés are never attached). Enquiry emails are retried by an outbox.
- **Privacy:** audit logs without personal data; IPs stored only as salted hashes; optional retention purge (`RETENTION_MONTHS`) that also deletes résumé files.

### Admin (`/admin`)
- **Enquiries:**
  - Status tabs (New · In progress · Responded · Archived, plus Spam), search, service filter, sort, pagination, CSV export.
  - Detail: every field and the consent time, status and internal notes, notification status with retry, email/call, delete.
- **Applications:**
  - Status tabs (New · Reviewing · Shortlisted · Unsuccessful · Archived), search, vacancy filter, CSV export.
  - Detail with **résumé download**, status, notes, email applicant, delete (which also removes the file).
- **Vacancies:** add, edit, publish/unpublish, reorder and delete.
  - Fields: title, URL, location, type, closing date, summary, description, requirements, how to apply, with the application count.
  - Publishing requires location, type and a real description.
- **Services:** add, edit, publish/draft, reorder, delete, photo upload and featured headline.
- **Content & photos:** hero strip, enquiry steps, sectors (draft → publish), credentials (publishing requires the verified detail) and page photos.
- **Business & settings:** contact details, footer statement, company profile, privacy policy, terms, preview banner text, and switches to pause enquiries or applications.
- **Account:** change your password.
- **Sign-in:** HttpOnly session cookie with a CSRF token, bcrypt-hashed passwords and rate-limited login.

## Missing / not implemented

### Not verified by running
- **Not run end to end.** Package installation was blocked where this was built. It was checked only by TypeScript typechecks of both apps and the 10 backend rule tests. Run `npm run install:all && npm run dev` and test every flow before launch, especially the multipart résumé upload and the draft preview.

### Content to supply or confirm before launch
- **The contact details don't line up:**
  - The phone `+1 (404) 798-9172` is an Atlanta area code, but the office is in Boston.
  - `Boston, MA 21180` is not a valid Boston ZIP (Boston ZIPs start with 021).
  - The `@outlook.com` address is a personal mailbox.
  - All of these are editable in Settings.
- **Sectors and credentials are drafts.** The 5 candidate sectors and the Licensing / Insurance / Qualifications / Certifications rows stay hidden until verified details are added and published.
- **Mobile Patrol is a draft service**, awaiting owner confirmation.
- **No company profile, privacy policy or terms of use.** These pages show the design's "being finalized" text until you add approved wording. A privacy policy is needed before collecting applications.
- **No vacancies.** The design's "Security Officer" listing is explicitly a "SAMPLE … NOT A REAL VACANCY" and is not seeded.
- **No real photos.** Every slot shows its labelled placeholder until a photo is uploaded in the admin.

### Design items replaced or not reproduced
- **Only v2 is built.** v1 has the same pages and logic in an earlier layout.
- **Demo-only switches replaced by real behaviour:**
  - `submitOutcome` (the success/server/network/rate-limit demo switch) — real API responses now drive those states.
  - `previewVacancy` — vacancies are managed in the admin.
  - The 1.4 s fake delay.
- **`showDrafts` is not a public switch.** It became the staff-only preview described above, because the design says drafts are "hidden from the public site".
- **`<image-slot>` drag-and-drop:** replaced by photo uploads in the admin.
- **Service detail URLs:** `#/services/guard` maps to `/services#svc-guard` (one page with anchors).

### Features not in this build
- **No confirmation email** to the person who submitted an enquiry or application. They see the on-screen success card with a reference.
- **No applicant self-service** (status tracking, withdrawing an application).
- **No virus scanning of résumés.** File type is checked by content, but uploads are not scanned. Add ClamAV or a scanning service before production.
- **Single admin role.** There is no separate "recruitment staff" permission, so every admin can see applications, and there is no password reset by email.
- **No CRM or ATS integration.** Export as CSV instead.

### Production hardening
- **Rate limits are in memory.** Use Redis behind a load balancer.
- **The schema uses `synchronize: true`.** Switch to migrations for production.
- **Uploads are on local disk** (`backend/uploads`, `backend/private-uploads`). Use object storage (private bucket for résumés) on multiple servers, and back up `private-uploads` with the database.
- **Not built:** E2E or browser tests, `sitemap.xml` / `robots.txt`, analytics.
