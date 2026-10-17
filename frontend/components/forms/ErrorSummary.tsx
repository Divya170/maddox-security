'use client';

import { OUTCOMES } from '@/lib/validation';
import type { Status } from './useSubmission';

/** Design error summary: field list ("Label: message") or an outcome title + body. */
export function ErrorSummary({
  status,
  errors,
  labels,
  ids,
  summaryRef,
}: {
  status: Status;
  errors: Record<string, string>;
  labels: Record<string, string>;
  ids: (k: string) => string;
  summaryRef: React.Ref<HTMLDivElement>;
}) {
  const keys = Object.keys(labels).filter((k) => errors[k]);
  const outcome = OUTCOMES[status];
  if (status !== 'invalid' && !outcome) return null;
  if (status === 'invalid' && !keys.length) return null;
  return (
    <div ref={summaryRef} tabIndex={-1} role="alert" className="err-summary">
      <p>{status === 'invalid' ? (keys.length === 1 ? 'There is 1 problem to fix:' : `There are ${keys.length} problems to fix:`) : outcome[0]}</p>
      {status !== 'invalid' && <p>{outcome[1]}</p>}
      {status === 'invalid' &&
        keys.map((k) => (
          <button key={k} type="button" onClick={() => document.getElementById(ids(k))?.focus()}>
            {labels[k]}: {errors[k]}
          </button>
        ))}
    </div>
  );
}
