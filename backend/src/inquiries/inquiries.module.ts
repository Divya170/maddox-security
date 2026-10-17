import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inquiry } from './inquiry.entity';
import { InquiriesService } from './inquiries.service';
import { AdminInquiriesController, InquiriesController } from './inquiries.controller';
import { SettingsModule } from '../settings/settings.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [TypeOrmModule.forFeature([Inquiry]), SettingsModule, ServicesModule],
  providers: [InquiriesService],
  controllers: [InquiriesController, AdminInquiriesController],
  exports: [InquiriesService],
})
export class InquiriesModule {}
