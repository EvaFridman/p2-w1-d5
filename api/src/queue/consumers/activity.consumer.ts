import { BeforeApplicationShutdown, Injectable, Inject, OnModuleInit } from "@nestjs/common";
import type { Channel, ConsumeMessage } from "amqplib";
import { PinoLogger } from "nestjs-pino";
import { CacheService } from "../../redis/cache.service.js";

@Injectable()
export class ActivityConsumer implements OnModuleInit, BeforeApplicationShutdown {
    private consumerTag?: string;
    private processingPromise?: Promise<void>;

    constructor(@Inject("RABBITMQ_CHANNEL") private readonly channel: Channel, private readonly cacheService: CacheService, private readonly logger: PinoLogger) {}

    async onModuleInit() {
        await this.channel.prefetch(1);

        const result = await this.channel.consume("activity", async (message) => {
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
        this.logger.info({ signal }, "Activity consumer shutdown started");

        if (this.consumerTag) await this.channel.cancel(this.consumerTag);
        if (this.processingPromise) await this.processingPromise;

        this.logger.info({ signal }, "Activity consumer shutdown completed");
    }

    private async handleMessage(message: ConsumeMessage) {
        let repeated = false;
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
                    repeated = true;
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
            const logData = {
                routingKey,
                messageId: messageId ?? "-",
                result,
                entityId: entityId ?? "-",
                durationMs: Date.now() - startedAt,
            };

            if (repeated || message.fields.redelivered) {
                this.logger.warn(logData, "Repeated activity message delivery");
            } else {
                this.logger.info(logData, "Activity message processed");
            }
        }
    }
}