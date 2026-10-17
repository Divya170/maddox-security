'use client';

import { useRef, useState } from 'react';
import { ClientApiError } from '@/lib/client-api';
import type { Errors } from '@/lib/validation';

export type Status = 'idle' | 'invalid' | 'submitting' | 'success' | 'server' | 'network' | 'ratelimit' | 'spam' | 'closed' | 'vacancy_closed';

/** Maps an API failure onto the design's outcomes. */
export function outcomeOf(err: unknown): { status: Status; errors: Errors } {
  const e = err as ClientApiError;
  if (e?.status === 422 && Object.keys(e.errors || {}).length) return { status: 'invalid', errors: e.errors };
  if (e?.status === 413) return { status: 'invalid', errors: { resume: 'The file is larger than 5 MB. Upload a smaller file.' } };
  if (e?.status === 429) return { status: 'ratelimit', errors: {} };
  if (e?.status === 400 && e.code === 'spam') return { status: 'spam', errors: {} };
  if (e?.status === 503) return { status: 'closed', errors: {} };
  if (e?.status === 410 || e?.status === 404) return { status: 'vacancy_closed', errors: {} };
  if (e?.status === 0) return { status: 'network', errors: {} };
  return { status: 'server', errors: {} };
}

/** Shared state machine for the enquiry and application forms (design run()/formVals()). */
export function useSubmission() {
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const [ref, setRef] = useState('');
  const summaryRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  const focusSummary = () => setTimeout(() => summaryRef.current?.focus(), 0);

  return {
    status,
    errors,
    ref,
    summaryRef,
    doneRef,
    busy: status === 'submitting',
    invalid(errs: Errors) {
      setErrors(errs);
      setStatus('invalid');
      focusSummary();
    },
    start() {
      setErrors({});
      setStatus('submitting');
    },
    done(reference: string) {
      setRef(reference);
      setStatus('success');
      setTimeout(() => {
        const h = doneRef.current;
        if (!h) return;
        window.scrollTo({ top: Math.max(0, h.getBoundingClientRect().top + window.scrollY - 140) });
        h.focus({ preventScroll: true });
      }, 0);
    },
    fail(err: unknown) {
      const o = outcomeOf(err);
      setErrors(o.errors);
      setStatus(o.status);
      focusSummary();
    },
    reset() {
      setErrors({});
      setRef('');
      setStatus('idle');
    },
  };
}
