import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import type { Channel, ConsumeMessage } from "amqplib";
import { PinoLogger } from 'nestjs-pino';
import { CacheService } from "../../redis/cache.service.js";

@Injectable()
export class ActivityConsumer implements OnModuleInit, OnModuleDestroy {
    private consumerTag?: string;
    constructor(@Inject("RABBITMQ_CHANNEL") private readonly channel: Channel, private readonly cacheService: CacheService, private readonly logger: PinoLogger) {}

    async onModuleInit() {
        await this.channel.prefetch(1);

        const result = await this.channel.consume("activity", async (message) => {
            if (!message) return;
            await this.handleMessage(message);
        });

        this.consumerTag = result.consumerTag;
    }

    async onModuleDestroy() {
        if (this.consumerTag) await this.channel.cancel(this.consumerTag);
    }

    private async handleMessage(message: ConsumeMessage) {
        const startedAt = Date.now();
        const routingKey = message.fields.routingKey;
        const messageId = message.properties.messageId;
        let entityId: number | undefined;
        let result = "processed";

        try {
            const payload = JSON.parse(message.content.toString()) as {
                listingId?: number;
                viewingId?: number;
            };

            entityId = payload.listingId ?? payload.viewingId;

            if (routingKey === "listing.published") {
                if (!messageId) {
                    result = "skipped";
                    this.channel.ack(message);
                    return;
                }

                const sentKey = `sent:${messageId}`;
                const alreadySent = await this.cacheService.get<boolean>(sentKey);

                if (alreadySent) {
                    result = "skipped";
                    this.channel.ack(message);
                    return;
                }

                await this.cacheService.invalidateByTag("listings");
                await this.cacheService.set(sentKey, true, 86400);
            }

            this.channel.ack(message);
        } catch {
            result = message.fields.redelivered ? "dead-lettered" : "retry";
            this.channel.nack(message, false, !message.fields.redelivered);
        } finally {
            this.logger.info(
                {
                    routingKey,
                    messageId: messageId ?? "-",
                    result,
                    entityId: entityId ?? "-",
                    durationMs: Date.now() - startedAt,
                },
                "Activity message processed",
            );
        }
    }
}