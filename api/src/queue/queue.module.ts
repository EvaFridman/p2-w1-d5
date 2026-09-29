import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp from 'amqplib';
import type { Channel, ChannelModel } from 'amqplib';
import { setupTopology } from './topology.js';
import { PublisherService } from './publisher.service.js';
import { PinoLogger } from 'nestjs-pino';

@Global()
@Module({
  providers: [
    {
      provide: 'RABBITMQ_CONNECTION',
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<ChannelModel> => {
        return amqp.connect(config.getOrThrow<string>('RABBITMQ_URL'));
      },
    },
    {
      provide: 'RABBITMQ_CHANNEL',
      inject: ['RABBITMQ_CONNECTION'],
      useFactory: async (connection: ChannelModel): Promise<Channel> => {
        const channel = await connection.createChannel();
        await setupTopology(channel);
        return channel;
      },
    },
    PublisherService,
  ],
  exports: ['RABBITMQ_CONNECTION', 'RABBITMQ_CHANNEL', PublisherService],
})
export class QueueModule implements OnApplicationShutdown {
  constructor(
    @Inject('RABBITMQ_CONNECTION') private readonly connection: ChannelModel,
    @Inject('RABBITMQ_CHANNEL') private readonly channel: Channel,
    private readonly logger: PinoLogger,
  ) {}

  async onApplicationShutdown(signal?: string) {
    this.logger.info({ signal }, 'RabbitMQ shutdown started');
    await this.channel.close();
    await this.connection.close();
    this.logger.info({ signal }, 'RabbitMQ shutdown completed');
  }
}
