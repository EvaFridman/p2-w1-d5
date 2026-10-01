import { Module } from '@nestjs/common';
import { PublicService } from './public.service.js';
import { PublicController } from './public.controller.js';
import { SavedSearchesModule } from '../saved-searches/saved-searches.module.js';

@Module({
  imports: [SavedSearchesModule],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
