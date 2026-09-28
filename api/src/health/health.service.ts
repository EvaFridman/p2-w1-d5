import { Injectable, Inject } from "@nestjs/common";
import { Redis } from "ioredis";
import type { Channel } from "amqplib";

@Injectable()
export class HealthService {
    constructor(@Inject("REDIS") private readonly redis: Redis, @Inject("RABBITMQ_CHANNEL") private readonly channel: Channel) {}

    async checkRedis(): Promise<boolean> {
        try {
            return (await this.redis.ping()) === "PONG";
        } catch {
            return false;
        }
    }

    async checkBroker(): Promise<boolean> {
        try {
            await this.channel.checkQueue("mail");
            return true;
        } catch {
            return false;
        }
    }
}