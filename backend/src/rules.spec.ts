/**
 * Business-rule checks that run without a database or Nest:
 *   npm run test:validation
 * Covers the enquiry and application rules (the design's exact messages), résumé checks,
 * vacancy rules, references, CSV safety, cookie/CSRF helpers, content/service validation and seed data.
 */
import { strict as assert } from 'assert';
import { csvSafe, isChecked, isHoneypot, publicRef, todayIso } from './common/forms';
import { validateInquiry } from './inquiries/inquiry-validation';
import { isVacancyOpen, resumeError, safeFileName, sniffResume, validateApplication, validateVacancy } from './careers/career-validation';
import { validateService } from './services/service-validation';
import { validateContentFields } from './content/content.validation';
import { CONTENT_TYPE_MAP } from './content/content.schemas';
import { CONTENT_SEED, SERVICES_SEED } from './database/seed-data';
import { parseCookies, sameToken } from './common/cookies';

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
};

const SERVICES = ['guard', 'commercial', 'event', 'access'];
const good = {
  company: 'Harbor Tower LLC', name: 'Dana Ruiz', email: 'Dana@HarborTower.com', phone: '(617) 555-0142', service: 'guard',
  location: 'Boston, MA', site: 'Office building', requirements: 'Front-of-house officer for our lobby on weekdays.', message: '', privacy: 'on', website: '',
};
const enq = (p: object) => validateInquiry({ ...good, ...p }, { services: SERVICES }).errors;

test('a complete enquiry passes and is normalised', () => {
  const { errors, value } = validateInquiry(good, { services: SERVICES });
  assert.deepEqual(errors, {});
  assert.equal(value.email, 'dana@harbortower.com');
  assert.equal(value.service, 'guard');
});

test('empty enquiry returns the design’s messages', () => {
  const { errors } = validateInquiry({}, { services: SERVICES });
  assert.equal(errors.company, 'Enter your company name.');
  assert.equal(errors.name, 'Enter your name.');
  assert.equal(errors.email, 'Enter your business email address.');
  assert.equal(errors.service, 'Select a service type, or choose “Not sure yet”.');
  assert.equal(errors.location, 'Enter a city, town, or general service area.');
  assert.equal(errors.requirements, 'Briefly describe the support you need (at least 20 characters).');
  assert.equal(errors.privacy, 'Confirm the privacy acknowledgement to send your enquiry.');
  assert.equal(errors.phone, undefined, 'phone is optional');
});

test('enquiry formats, enums and limits', () => {
  assert.equal(enq({ email: 'a@b' }).email, 'Enter an email address in the format name@company.com.');
  assert.equal(enq({ phone: '12' }).phone, 'Enter a phone number using digits, spaces, or + ( ) -.');
  assert.equal(enq({ phone: 'call me' }).phone, 'Enter a phone number using digits, spaces, or + ( ) -.');
  assert.equal(enq({ phone: '+1 (404) 798-9172' }).phone, undefined);
  assert.equal(enq({ service: 'unsure' }).service, undefined, '"Not sure yet" is allowed');
  assert.equal(enq({ service: 'patrol' }).service, 'Select a service type, or choose “Not sure yet”.', 'draft services are not selectable');
  assert.equal(enq({ requirements: 'x'.repeat(19) }).requirements, 'Briefly describe the support you need (at least 20 characters).');
  assert.equal(enq({ requirements: 'x'.repeat(2001) }).requirements, 'Use 2,000 characters or fewer.');
  assert.equal(enq({ privacy: false }).privacy, 'Confirm the privacy acknowledgement to send your enquiry.');
  assert.equal(isChecked('on'), true);
  assert.equal(isChecked(''), false);
});

const pdf = (size = 2000) => ({ originalname: 'cv.pdf', size, buffer: Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(16)]) });
const docx = { originalname: 'cv.docx', size: 1000, buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]) };
const doc = { originalname: 'cv.doc', size: 1000, buffer: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) };

test('application rules and messages', () => {
  const { errors } = validateApplication({});
  assert.equal(errors.fullName, 'Enter your full name.');
  assert.equal(errors.email, 'Enter your email address.');
  assert.equal(errors.privacy, 'Confirm the privacy acknowledgement to submit your application.');
  assert.equal(errors.resume, undefined, 'résumé is optional');
  assert.equal(validateApplication({ fullName: 'A B', email: 'x@y', privacy: true }).errors.email, 'Enter an email address in the format name@example.com.');
  assert.deepEqual(validateApplication({ fullName: 'Sam Lee', email: 'sam@example.com', privacy: 'on' }, pdf()).errors, {});
});

test('résumé: extension, size and real file type', () => {
  assert.equal(resumeError(pdf()), null);
  assert.equal(resumeError(docx), null);
  assert.equal(resumeError(doc), null);
  assert.equal(resumeError({ ...pdf(), originalname: 'cv.png' }), 'Upload a PDF, DOC, or DOCX file.');
  assert.equal(resumeError(pdf(5 * 1024 * 1024 + 1)), 'The file is larger than 5 MB. Upload a smaller file.');
  assert.equal(resumeError({ ...docx, originalname: 'cv.pdf' }), 'Upload a PDF, DOC, or DOCX file.', 'bytes must match the extension');
  assert.equal(sniffResume(Buffer.from('<html>')), null);
  assert.equal(safeFileName('../../etc/pass wd.pdf'), 'pass wd.pdf');
});

test('vacancies: publish rules and open/closed', () => {
  assert.equal(validateVacancy({ title: '' }).errors.title, 'Enter the job title.');
  const pub = validateVacancy({ title: 'Security Officer', published: true }).errors;
  assert.equal(pub.location, 'Add the location before publishing.');
  assert.equal(pub.description, 'Add the approved job description (at least 40 characters) before publishing.');
  assert.equal(validateVacancy({ title: 'Security Officer', closesOn: '2026-02-30' }).errors.closesOn, 'Enter a valid date.');
  assert.equal(isVacancyOpen({ published: true, closesOn: null }, '2026-10-14'), true);
  assert.equal(isVacancyOpen({ published: true, closesOn: '2026-10-14' }, '2026-10-14'), true, 'open through the closing day');
  assert.equal(isVacancyOpen({ published: true, closesOn: '2026-10-13' }, '2026-10-14'), false);
  assert.equal(isVacancyOpen({ published: false, closesOn: null }, '2026-10-14'), false);
  assert.match(todayIso(new Date('2026-10-14T03:00:00Z')), /^2026-10-13$/, 'Boston is still the 13th at 03:00 UTC');
});

test('honeypot, references and CSV safety', () => {
  assert.equal(isHoneypot('http://spam'), true);
  assert.equal(isHoneypot(''), false);
  assert.equal(publicRef('E', 1), 'MSS-E-1001');
  assert.equal(publicRef('A', 42), 'MSS-A-1042');
  assert.equal(csvSafe('=HYPERLINK()'), `"'=HYPERLINK()"`);
  assert.equal(csvSafe('a "b"'), '"a ""b"""');
});

test('session helpers: cookie parsing and constant-time CSRF compare', () => {
  assert.deepEqual(parseCookies('ms_session=abc.def; ms_csrf=xyz%3D'), { ms_session: 'abc.def', ms_csrf: 'xyz=' });
  assert.equal(sameToken('abc', 'abc'), true);
  assert.equal(sameToken('abc', 'abd'), false);
  assert.equal(sameToken('', ''), false);
});

test('service and content validation', () => {
  assert.equal(validateService({ title: '' }).errors.title, 'Enter a service title.');
  assert.equal(validateService({ title: 'K9', slug: 'unsure' }).errors.slug, '“unsure” is reserved for the form’s “Not sure yet” option.');
  assert.equal(validateService({ title: 'K9', published: true }).errors.summary, 'Add a summary (at least 10 characters) before publishing.');
  const cred = CONTENT_TYPE_MAP.get('credential')!;
  assert.equal(validateContentFields(cred, { label: 'Licensing', detail: '' }, true).errors.detail, 'Add the verified detail before publishing.');
  assert.deepEqual(validateContentFields(cred, { label: 'Licensing', detail: '' }, false).errors, {}, 'drafts may be empty');
});

test('every seeded row passes its own validation; drafts match the design', () => {
  for (const s of SERVICES_SEED) assert.deepEqual(validateService({ ...s }).errors, {}, s.title);
  assert.deepEqual(SERVICES_SEED.filter((s) => !s.published).map((s) => s.slug), ['patrol']);
  for (const [type, rows] of Object.entries(CONTENT_SEED)) {
    const def = CONTENT_TYPE_MAP.get(type)!;
    assert.ok(def, type);
    for (const r of rows) assert.deepEqual(validateContentFields(def, r.fields, r.published ?? true).errors, {}, `${type}: ${JSON.stringify(r.fields).slice(0, 40)}`);
  }
  assert.ok(CONTENT_SEED.industry.every((r) => r.published === false), 'sectors are drafts');
  assert.ok(CONTENT_SEED.credential.every((r) => r.published === false), 'credentials are drafts');
});

console.log(`\n${passed} checks passed`);
