import { Injectable, Inject } from '@nestjs/common';
import type { Channel } from 'amqplib';

@Injectable()
export class PublisherService {
  constructor(@Inject('RABBITMQ_CHANNEL') private readonly channel: Channel) {}

  publish(routingKey: string, payload: object, options: { messageId: string }) {
    return this.channel.publish(
      'portal',
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
        messageId: options.messageId,
      },
    );
  }
}
