import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';

import { ListingPublishedEvent } from './listing-published.event.js';

@Injectable()
export class ListingPublishedListener {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {}

  @OnEvent(ListingPublishedEvent.eventName)
  async handle(event: ListingPublishedEvent) {
    const webUrl = this.configService.get<string>('WEB_URL');
    const secret = this.configService.get<string>('REVALIDATE_SECRET');

    if (!webUrl || !secret) {
      this.logger.error(
        'Cannot revalidate public site: WEB_URL or REVALIDATE_SECRET is not configured',
      );
      return;
    }

    try {
      const startedAt = Date.now();

      const response = await fetch(`${webUrl}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ tag: 'listings' }),
      });

      const durationMs = Date.now() - startedAt;

      if (durationMs > 1000) {
        this.logger.warn(
          {
            listingId: event.listingId,
            durationMs,
          },
          'Public site revalidation was slow',
        );
      }

      if (!response.ok) {
        await response.text();

        this.logger.error(
          {
            listingId: event.listingId,
            status: response.status,
          },
          'Public site revalidation failed',
        );
        return;
      }

      this.logger.info(
        {
          listingId: event.listingId,
          durationMs,
        },
        'Public site cache revalidated',
      );
    } catch (error) {
      this.logger.error(
        {
          listingId: event.listingId,
          err: error,
        },
        'Public site revalidation request failed',
      );
    }
  }
}
