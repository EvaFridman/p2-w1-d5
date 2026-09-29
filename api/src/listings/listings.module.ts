import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service.js';
import { ListingsController } from './listings.controller.js';
import { PdfService } from '../pdf/pdf.service.js';
import { ViewingsModule } from '../viewings/viewings.module.js';
import { ListingPublishedListener } from './events/listing-published.listener.js';

@Module({
  imports: [ViewingsModule],
  controllers: [ListingsController],
  providers: [ListingsService, PdfService, ListingPublishedListener],
  exports: [ListingsService],
})
export class ListingsModule {}
