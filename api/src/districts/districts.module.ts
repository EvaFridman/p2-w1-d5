import { Module } from '@nestjs/common';
import { DistrictsService } from './districts.service.js';
import { DistrictsController } from './districts.controller.js';

@Module({
  controllers: [DistrictsController],
  providers: [DistrictsService],
  exports: [DistrictsService],
})
export class DistrictsModule {}
