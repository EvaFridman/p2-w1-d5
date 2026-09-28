import { Global, Module, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";
import { CacheService } from "./cache.service.js";
import { LoginBlockService } from "./login-block.service.js";
import { PinoLogger } from "nestjs-pino";

class RedisProvider implements OnApplicationShutdown {
    readonly client: Redis;

    constructor(config: ConfigService, private readonly logger: PinoLogger) {
        this.client = new Redis({
            host: config.getOrThrow<string>("REDIS_HOST"),
            port: Number(config.getOrThrow("REDIS_PORT")),
            db: 0,
            maxRetriesPerRequest: 0,
        });
    }

    async onApplicationShutdown(signal?: string) {
        this.logger.info({ signal }, "Redis shutdown started");
        await this.client.quit();
        this.logger.info({ signal }, "Redis shutdown completed");
    }
}

@Global()
@Module({
    providers: [
        {
            provide: "REDIS_PROVIDER",
            inject: [ConfigService, PinoLogger],
            useFactory: (config: ConfigService, logger: PinoLogger) =>
                new RedisProvider(config, logger),
        },
        {
            provide: "REDIS",
            inject: ["REDIS_PROVIDER"],
            useFactory: (provider: RedisProvider) => provider.client,
        },
        CacheService,
        LoginBlockService,
    ],
    exports: ["REDIS", CacheService, LoginBlockService],
})
export class RedisModule {}