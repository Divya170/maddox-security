import { Body, Controller, Delete, Get, Logger, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, Req, Res, StreamableFile, UploadedFile, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { ArrayNotEmpty, IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Request, Response } from 'express';
import { ApplicationQuery, CareersService } from './careers.service';
import { APPLICATION_STATUSES, MAX_RESUME_BYTES, VacancyInput } from './career-validation';
import { SubmissionExceptionFilter } from '../common/submission-error';
import { AuthedRequest, readAdminSession, SessionGuard } from '../common/session';

const rateMax = () => Math.max(1, Number(process.env.RATE_LIMIT_MAX) || 5);
const rateWindowMs = () => Math.max(1, Number(process.env.RATE_LIMIT_WINDOW_MIN) || 10) * 60_000;

/** Public vacancy pages and the application form. */
@Controller('careers')
export class CareersController {
  constructor(
    private readonly careers: CareersService,
    private readonly jwt: JwtService,
  ) {}

  /** GET /api/careers/vacancies/:slug — 404 when missing/closed (drafts only for signed-in staff with ?preview=1) */
  @Get('vacancies/:slug')
  async vacancy(@Req() req: Request, @Param('slug') slug: string, @Query('preview') preview?: string) {
    const staff = preview === '1' && !!(await readAdminSession(req, this.jwt));
    const v = await this.careers.publicGet(slug, staff);
    if (!v) throw new NotFoundException('This vacancy is no longer available.');
    return v;
  }

  /** multipart/form-data with optional "resume" file (PDF/DOC/DOCX ≤ 5 MB) */
  @Post('vacancies/:slug/applications')
  @UseFilters(SubmissionExceptionFilter)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: rateMax, ttl: rateWindowMs } })
  @UseInterceptors(FileInterceptor('resume', { storage: memoryStorage(), limits: { fileSize: MAX_RESUME_BYTES, files: 1, fields: 20, fieldSize: 16 * 1024 } }))
  async apply(@Param('slug') slug: string, @Body() body: Record<string, unknown>, @UploadedFile() resume: Express.Multer.File | undefined, @Req() req: Request) {
    const r = await this.careers.apply(slug, body || {}, resume, { ip: req.ip || '' });
    return { ok: true, ...r };
  }
}

class UpdateApplicationDto {
  @IsOptional() @IsIn(APPLICATION_STATUSES as unknown as string[], { message: 'Choose a valid status.' }) status?: string;
  @IsOptional() @IsString() @MaxLength(5000, { message: 'Keep notes under 5,000 characters.' }) notes?: string;
}
class ReorderDto {
  @IsArray() @ArrayNotEmpty() @IsInt({ each: true }) ids: number[];
}

@Controller('admin/vacancies')
@UseGuards(SessionGuard)
export class AdminVacanciesController {
  constructor(private readonly careers: CareersService) {}

  @Get()
  list() {
    return this.careers.adminVacancies();
  }

  @Post()
  create(@Body() body: VacancyInput) {
    return this.careers.createVacancy(body);
  }

  @Post('reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.careers.reorderVacancies(dto.ids);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: VacancyInput) {
    return this.careers.updateVacancy(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.careers.removeVacancy(id);
  }
}

@Controller('admin/applications')
@UseGuards(SessionGuard)
export class AdminApplicationsController {
  private readonly audit = new Logger('ApplicationAccess');
  constructor(private readonly careers: CareersService) {}

  @Get()
  list(@Req() req: AuthedRequest, @Query() q: ApplicationQuery) {
    this.audit.log(JSON.stringify({ event: 'applications.list', admin: req.admin.sub }));
    return this.careers.listApplications(q);
  }

  @Get('counts')
  counts() {
    return this.careers.counts();
  }

  @Get('export.csv')
  async export(@Req() req: AuthedRequest, @Res() res: Response, @Query() q: ApplicationQuery) {
    this.audit.log(JSON.stringify({ event: 'applications.export', admin: req.admin.sub }));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="maddox-applications-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('﻿' + (await this.careers.exportCsv(q)));
  }

  @Get(':id')
  get(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    this.audit.log(JSON.stringify({ event: 'application.view', admin: req.admin.sub, id }));
    return this.careers.applicationDetail(id);
  }

  /** Streams the private résumé as an attachment (never inline, never cached). */
  @Get(':id/resume')
  async resume(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number, @Res({ passthrough: true }) res: Response) {
    this.audit.log(JSON.stringify({ event: 'application.resume_download', admin: req.admin.sub, id }));
    const f = await this.careers.resume(id);
    res.setHeader('Content-Type', f.type);
    res.setHeader('Content-Disposition', `attachment; filename="${f.name.replace(/"/g, '')}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(f.stream);
  }

  @Patch(':id')
  update(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateApplicationDto) {
    this.audit.log(JSON.stringify({ event: 'application.update', admin: req.admin.sub, id, fields: Object.keys(dto) }));
    return this.careers.updateApplication(id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    this.audit.log(JSON.stringify({ event: 'application.delete', admin: req.admin.sub, id }));
    return this.careers.removeApplication(id);
  }
}
