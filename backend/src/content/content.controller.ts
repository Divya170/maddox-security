import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ArrayNotEmpty, IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString } from 'class-validator';
import { ContentService } from './content.service';
import { readAdminSession, SessionGuard } from '../common/session';
import { CareersService } from '../careers/careers.service';
import { SettingsService } from '../settings/settings.service';
import { ServicesService } from '../services/services.service';

class CreateContentDto {
  @IsString() type: string;
  @IsObject() fields: Record<string, unknown>;
  @IsOptional() @IsBoolean() published?: boolean;
}

class UpdateContentDto {
  @IsOptional() @IsObject() fields?: Record<string, unknown>;
  @IsOptional() @IsBoolean() published?: boolean;
}

class ReorderContentDto {
  @IsString() type: string;
  @IsArray() @ArrayNotEmpty() @IsInt({ each: true }) ids: number[];
}

@Controller()
export class SiteController {
  constructor(
    private readonly settings: SettingsService,
    private readonly services: ServicesService,
    private readonly content: ContentService,
    private readonly careers: CareersService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Everything the public pages render, in one call. `?preview=1` includes drafts
   * (unpublished services, sectors, credentials, vacancies) — honoured ONLY when the request
   * also carries a valid admin session cookie, so drafts never reach the public.
   */
  @Get('site')
  async site(@Req() req: Request, @Query('preview') previewParam?: string) {
    const preview = previewParam === '1' && !!(await readAdminSession(req, this.jwt));
    const settings = await this.settings.getPublic();
    const services = await this.services.listPublished(preview);
    const c = await this.content.publicBundle(['strip', 'step', 'industry', 'credential'], preview);
    return {
      preview,
      settings,
      services,
      strip: c.strip.map((x) => String(x.text || '')),
      steps: c.step,
      industries: c.industry,
      credentials: c.credential,
      vacancies: await this.careers.publicList(preview),
      images: await this.content.siteImages(),
    };
  }
}

@Controller('admin/content')
@UseGuards(SessionGuard)
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('types')
  types() {
    return this.content.types();
  }

  @Get('counts')
  counts() {
    return this.content.counts();
  }

  @Get()
  adminList(@Query('type') type: string) {
    return this.content.adminList(type);
  }

  @Post('reorder')
  reorder(@Body() dto: ReorderContentDto) {
    return this.content.reorder(dto.type, dto.ids);
  }

  @Post()
  create(@Body() dto: CreateContentDto) {
    return this.content.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContentDto) {
    return this.content.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.content.remove(id);
  }
}
