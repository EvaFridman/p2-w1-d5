import {
  BeforeApplicationShutdown,
  Injectable,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import type { Channel, ConsumeMessage } from 'amqplib';
import { PinoLogger } from 'nestjs-pino';
import { handleAgentDigest } from './handlers/agent-digest.handler.js';
import { handleListingExpired } from './handlers/listing-expired.handler.js';
import { handleNewViewing } from './handlers/new-viewing.handler.js';
import { handleViewingReminder } from './handlers/viewing-reminder.handler.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MailService } from '../../mail/mail.service.js';

export type MailPayload = {
  viewingId?: number;
  listingId?: number;
  agentId?: number;
  title?: string;
  periodFrom?: string;
  periodTo?: string;
};

@Injectable()
export class MailConsumer implements OnModuleInit, BeforeApplicationShutdown {
  private consumerTag?: string;
  private processingPromise?: Promise<void>;

  constructor(
    @Inject('RABBITMQ_CHANNEL') private readonly channel: Channel,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly logger: PinoLogger,
  ) {}

  async onModuleInit() {
    await this.channel.prefetch(1);

    const result = await this.channel.consume('mail', async (message) => {
      if (!message) return;

      this.processingPromise = this.handleMessage(message);

      try {
        await this.processingPromise;
      } finally {
        this.processingPromise = undefined;
      }
    });

    this.consumerTag = result.consumerTag;
  }

  async beforeApplicationShutdown(signal?: string) {
    this.logger.info({ signal }, 'Mail consumer shutdown started');

    if (this.consumerTag) await this.channel.cancel(this.consumerTag);
    if (this.processingPromise) await this.processingPromise;

    this.logger.info({ signal }, 'Mail consumer shutdown completed');
  }

  private async handleMessage(message: ConsumeMessage) {
    const startedAt = Date.now();
    const routingKey = message.fields.routingKey;
    const messageId = message.properties.messageId ?? '-';
    let result = 'processed';

    try {
      const payload = JSON.parse(message.content.toString()) as MailPayload;

      if (routingKey === 'listing.expired') {
        result = await handleListingExpired(
          payload,
          this.prisma,
          this.mailService,
        );
      } else if (routingKey === 'viewing.reminder') {
        result = await handleViewingReminder(
          payload,
          this.prisma,
          this.mailService,
        );
      } else if (routingKey === 'agent.digest') {
        result = await handleAgentDigest(
          payload,
          this.prisma,
          this.mailService,
        );
      } else {
        result = await handleNewViewing(payload, this.prisma, this.mailService);
      }

      this.channel.ack(message);
    } catch {
      result = message.fields.redelivered ? 'dead-lettered' : 'retry';
      this.channel.nack(message, false, !message.fields.redelivered);
    } finally {
      const logData = {
        routingKey,
        messageId,
        result,
        durationMs: Date.now() - startedAt,
      };

      if (message.fields.redelivered) {
        this.logger.warn(logData, 'Repeated mail message delivery');
      } else if (result === 'processed') {
        this.logger.info(logData, 'Mail sent by worker');
      } else {
        this.logger.info(logData, 'Mail message skipped');
      }
    }
  }
}
