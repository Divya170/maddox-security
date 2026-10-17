import { createReadStream, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { randomBytes } from 'crypto';
import type { ResumeKind } from './career-validation';

/**
 * Private résumé storage (design: "Stored privately and seen only by authorized recruitment staff").
 * Outside the public /uploads folder; files are only streamed by the admin download route.
 */
export const PRIVATE_DIR = resolve(process.cwd(), process.env.PRIVATE_UPLOAD_DIR || 'private-uploads/resumes');
mkdirSync(PRIVATE_DIR, { recursive: true });

const SAFE = /^[a-f0-9]{32}\.(pdf|doc|docx)$/;

export function saveResume(buf: Buffer, kind: ResumeKind): string {
  const name = `${randomBytes(16).toString('hex')}.${kind}`;
  writeFileSync(join(PRIVATE_DIR, name), buf, { mode: 0o600 });
  return name;
}

export function openResume(name: string) {
  if (!SAFE.test(name)) return null;
  const p = join(PRIVATE_DIR, name);
  return existsSync(p) ? createReadStream(p) : null;
}

export function deleteResume(name: string | null) {
  if (!name || !SAFE.test(name)) return;
  try {
    unlinkSync(join(PRIVATE_DIR, name));
  } catch {
    /* already gone */
  }
}
