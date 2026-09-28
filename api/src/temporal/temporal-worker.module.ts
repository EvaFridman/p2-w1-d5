import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from 'nestjs-pino';
import { FilesModule } from "../files/files.module.js";
import { ListingsModule } from "../listings/listings.module.js";
import { ViewingsModule } from "../viewings/viewings.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { QueueModule } from "../queue/queue.module.js";
import { RedisModule } from "../redis/redis.module.js";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TasksModule } from "../tasks/tasks.module.js";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        RedisModule,
        FilesModule,
        ListingsModule,
        QueueModule,
        ViewingsModule,
        TasksModule,
        EventEmitterModule.forRoot(),
        LoggerModule.forRoot({
            pinoHttp: {
                level: process.env.LOG_LEVEL ?? "info",
                transport: process.env.LOGDY !== "true" && process.env.NODE_ENV !== "production" ? { target: "pino-pretty", options: { singleLine: true } } : undefined,
                redact: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.passwordHash", "*.refreshToken"],
                autoLogging: true,
                customProps: () => ({
                    process: process.env.LOG_PROCESS ?? "temporal-worker",
                }),
            },
        }),],
})
export class TemporalWorkerModule {}