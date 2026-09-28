import { Injectable, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { ConfigService } from "@nestjs/config";
import { PinoLogger } from "nestjs-pino";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
    constructor(private readonly configService: ConfigService, private readonly logger: PinoLogger) {
        super({ adapter: new PrismaPg(new Pool({ connectionString: configService.get<string>("DATABASE_URL") })) });
    }

    async onModuleInit() {
        await this.$connect();
        await this.$queryRawUnsafe("SELECT 1");
    }

    async onApplicationShutdown(signal?: string) {
        this.logger.info({ signal }, "Prisma shutdown started");
        await this.$disconnect();
        this.logger.info({ signal }, "Prisma shutdown completed");
    }
}