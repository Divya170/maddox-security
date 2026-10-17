import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger, UnprocessableEntityException } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';

/** 422 with field errors — the form maps them onto its fields. */
export class FieldErrors extends UnprocessableEntityException {
  constructor(public readonly fieldErrors: Record<string, string>) {
    super({ ok: false, errors: fieldErrors });
  }
}

/**
 * Shapes every error from the public form endpoints into the codes the forms understand
 * (the design's outcomes): 422 {errors} · 429 ratelimit · 400 spam · 503 closed · 410 gone · 500 server.
 * Internals are never exposed.
 */
@Catch()
export class SubmissionExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Submissions');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof FieldErrors) return void res.status(422).json({ ok: false, errors: exception.fieldErrors });
    if (exception instanceof ThrottlerException) return void res.status(429).json({ ok: false, error: 'ratelimit' });
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse() as { error?: string; message?: string } | string;
      const code = typeof body === 'object' && body?.error ? body.error : '';
      if (status === HttpStatus.PAYLOAD_TOO_LARGE) return void res.status(413).json({ ok: false, error: 'too_large', errors: { resume: 'The file is larger than 5 MB. Upload a smaller file.' } });
      if (status === HttpStatus.BAD_REQUEST && code === 'spam') return void res.status(400).json({ ok: false, error: 'spam' });
      if (status === HttpStatus.SERVICE_UNAVAILABLE) return void res.status(503).json({ ok: false, error: code || 'closed' });
      if (status === HttpStatus.GONE || status === HttpStatus.NOT_FOUND) return void res.status(410).json({ ok: false, error: 'vacancy_closed' });
      if (status === HttpStatus.BAD_REQUEST) return void res.status(400).json({ ok: false, error: 'bad_request' });
    }
    this.logger.error(JSON.stringify({ event: 'submission.server_error', message: (exception as Error)?.message?.slice(0, 200) }));
    res.status(500).json({ ok: false, error: 'server' });
  }
}
