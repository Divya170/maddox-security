import { NextRequest, NextResponse } from 'next/server';

/**
 * Staff draft preview toggle: /preview (on) and /preview?off=1 (off).
 * The cookie alone shows nothing — the API only returns drafts when the request also
 * carries a valid admin session, so this is safe to expose.
 */
export function GET(req: NextRequest) {
  const off = req.nextUrl.searchParams.get('off') === '1';
  const next = req.nextUrl.searchParams.get('next') || '/';
  const dest = new URL(next.startsWith('/') && !next.startsWith('//') ? next : '/', req.url);
  const res = NextResponse.redirect(dest);
  if (off) res.cookies.delete('ms_preview');
  else res.cookies.set('ms_preview', '1', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 8 * 3600, secure: process.env.NODE_ENV === 'production' });
  return res;
}
