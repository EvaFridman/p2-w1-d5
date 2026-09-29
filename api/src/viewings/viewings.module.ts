import { Module } from '@nestjs/common';
import { ViewingsController } from './viewings.controller.js';
import { ViewingsService } from './viewings.service.js';

@Module({
  controllers: [ViewingsController],
  providers: [ViewingsService],
  exports: [ViewingsService],
})
export class ViewingsModule {}
