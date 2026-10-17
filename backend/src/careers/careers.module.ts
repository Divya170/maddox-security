import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vacancy } from './vacancy.entity';
import { Application } from './application.entity';
import { CareersService } from './careers.service';
import { AdminApplicationsController, AdminVacanciesController, CareersController } from './careers.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Vacancy, Application]), SettingsModule],
  providers: [CareersService],
  controllers: [CareersController, AdminVacanciesController, AdminApplicationsController],
  exports: [CareersService],
})
export class CareersModule {}
