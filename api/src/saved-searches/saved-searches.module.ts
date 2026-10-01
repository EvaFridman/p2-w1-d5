import { Module } from '@nestjs/common';
import { SavedSearchesService } from './saved-searches.service.js';

@Module({
  providers: [SavedSearchesService],
  exports: [SavedSearchesService],
})
export class SavedSearchesModule {}
