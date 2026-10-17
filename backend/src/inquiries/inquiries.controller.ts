import { Body, Controller, Delete, Get, HttpCode, Logger, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UseFilters, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Request, Response } from 'express';
import { InquiriesService, InquiryQuery } from './inquiries.service';
import { INQUIRY_STATUSES } from './inquiry-validation';
import { SubmissionExceptionFilter } from '../common/submission-error';
import { AuthedRequest, SessionGuard } from '../common/session';

export const rateMax = () => Math.max(1, Number(process.env.RATE_LIMIT_MAX) || 5);
export const rateWindowMs = () => Math.max(1, Number(process.env.RATE_LIMIT_WINDOW_MIN) || 10) * 60_000;

/** Public: the "Request a Security Service Assessment" form. */
@Controller('inquiries')
@UseFilters(SubmissionExceptionFilter)
export class InquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Get('options')
  options() {
    return this.inquiries.formOptions();
  }

  /** 201 {ok, id} · 422 {errors} · 429 ratelimit · 400 spam · 503 closed · 500 server */
  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: rateMax, ttl: rateWindowMs } })
  async create(@Body() body: Record<string, unknown>, @Req() req: Request) {
    const r = await this.inquiries.submit(body || {}, { ip: req.ip || '' });
    return { ok: true, ...r };
  }
}

class UpdateInquiryDto {
  @IsOptional() @IsIn(INQUIRY_STATUSES as unknown as string[], { message: 'Choose a valid status.' }) status?: string;
  @IsOptional() @IsString() @MaxLength(5000, { message: 'Keep notes under 5,000 characters.' }) notes?: string;
}

@Controller('admin/inquiries')
@UseGuards(SessionGuard)
export class AdminInquiriesController {
  private readonly audit = new Logger('InquiryAccess');
  constructor(private readonly inquiries: InquiriesService) {}

  @Get()
  list(@Req() req: AuthedRequest, @Query() q: InquiryQuery) {
    this.audit.log(JSON.stringify({ event: 'inquiries.list', admin: req.admin.sub }));
    return this.inquiries.list(q);
  }

  @Get('counts')
  counts() {
    return this.inquiries.counts();
  }

  @Get('export.csv')
  async export(@Req() req: AuthedRequest, @Res() res: Response, @Query() q: InquiryQuery) {
    this.audit.log(JSON.stringify({ event: 'inquiries.export', admin: req.admin.sub }));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="maddox-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('﻿' + (await this.inquiries.exportCsv(q)));
  }

  @Get(':id')
  get(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    this.audit.log(JSON.stringify({ event: 'inquiry.view', admin: req.admin.sub, id }));
    return this.inquiries.detail(id);
  }

  @Patch(':id')
  update(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInquiryDto) {
    this.audit.log(JSON.stringify({ event: 'inquiry.update', admin: req.admin.sub, id, fields: Object.keys(dto) }));
    return this.inquiries.update(id, dto);
  }

  @Post(':id/notify')
  @HttpCode(200)
  resend(@Param('id', ParseIntPipe) id: number) {
    return this.inquiries.resendNotification(id);
  }

  @Delete(':id')
  remove(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    this.audit.log(JSON.stringify({ event: 'inquiry.delete', admin: req.admin.sub, id }));
    return this.inquiries.remove(id);
  }
}
