import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import type { Channel, ConsumeMessage } from "amqplib";
import { PinoLogger } from 'nestjs-pino';
import { handleAgentDigest } from "./handlers/agent-digest.handler.js";
import { handleListingExpired } from "./handlers/listing-expired.handler.js";
import { handleNewViewing } from "./handlers/new-viewing.handler.js";
import { handleViewingReminder } from "./handlers/viewing-reminder.handler.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { MailService } from "../../mail/mail.service.js";

export type MailPayload = {
    viewingId?: number;
    listingId?: number;
    agentId?: number;
    title?: string;
    periodFrom?: string;
    periodTo?: string;
};

@Injectable()
export class MailConsumer implements OnModuleInit, OnModuleDestroy {
    private consumerTag?: string;

    constructor(
        @Inject("RABBITMQ_CHANNEL") private readonly channel: Channel,
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
        private readonly logger: PinoLogger
    ) {}

    async onModuleInit() {
        await this.channel.prefetch(1);

        const result = await this.channel.consume("mail", async (message) => {
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
        const messageId = message.properties.messageId ?? "-";
        let result = "processed";

        try {
            const payload = JSON.parse(message.content.toString()) as MailPayload;

            if (routingKey === "listing.expired") {
                result = await handleListingExpired(
                    message,
                    payload,
                    this.prisma,
                    this.mailService,
                    this.channel,
                );
                return;
            }

            if (routingKey === "viewing.reminder") {
                result = await handleViewingReminder(
                    message,
                    payload,
                    this.prisma,
                    this.mailService,
                    this.channel,
                );
                return;
            }

            if (routingKey === "agent.digest") {
                result = await handleAgentDigest(
                    message,
                    payload,
                    this.prisma,
                    this.mailService,
                    this.channel,
                );
                return;
            }

            result = await handleNewViewing(
                message,
                payload,
                this.prisma,
                this.mailService,
                this.channel,
            );
        } catch {
            result = message.fields.redelivered ? "dead-lettered" : "retry";
            this.channel.nack(message, false, !message.fields.redelivered);
        } finally {
            const logData = {
                routingKey,
                messageId,
                result,
                durationMs: Date.now() - startedAt,
            };
        
            if (message.fields.redelivered) {
                this.logger.warn(logData, "Repeated mail message delivery");
            } else if (result === "processed") {
                this.logger.info(logData, "Mail sent by worker");
            } else {
                this.logger.info(logData, "Mail message skipped");
            }
        }
    }
}