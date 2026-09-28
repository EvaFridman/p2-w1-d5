import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { UsersService } from '../users/users.service.js';
import { DistrictsService } from '../districts/districts.service.js';
import { CacheService } from '../redis/cache.service.js';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator.js';
import { TaskRunnerService } from '../tasks/task-runner.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthService } from './health.service.js';

@ApiTags('Здоровье')
@Controller('health')
@Public()
@SkipThrottle({
    api: true,
    login: true,
    register: true,
    upload: true,
    viewing: true,
    viewingPublic: true,
    ws: true,
})
export class HealthController {
    constructor(
        private readonly usersService: UsersService,
        private readonly districtsService: DistrictsService,
        private readonly cacheService: CacheService,
        private readonly taskRunnerService: TaskRunnerService,
        private readonly healthCheckService: HealthCheckService,
        private readonly prismaHealthIndicator: PrismaHealthIndicator,
        private readonly prisma: PrismaService,
        private readonly healthService: HealthService,
    ) {}

    @ApiOperation({ summary: "Проверка, что процесс бэкенда запущен" })
    @ApiResponse({ status: 200, description: "Процесс бэкенда работает" })
    @Get("live")
    getLive() {
        return { status: "ok" };
    }

    @ApiOperation({ summary: "Проверка готовности зависимостей бэкенда" })
    @ApiResponse({ status: 200, description: "Все зависимости доступны" })
    @ApiResponse({ status: 503, description: "Одна или несколько зависимостей недоступны" })
    @HealthCheck()
    @Get("ready")
    checkReady() {
        return this.healthCheckService.check([
            () => this.prismaHealthIndicator.pingCheck("database", this.prisma),
            async () => {
                const available = await this.healthService.checkRedis();

                return {
                    redis: {
                        status: available ? "up" : "down",
                    },
                };
            },
        ]);
    }

    @ApiOperation({ summary: 'Проверка работоспособности бэкенда, базы данных, Redis и RabbitMQ' })
    @ApiResponse({ status: 200, description: 'Статус бэкенда успешно получен' })
    @Get()
    async getHealth() {
        const districtsCount = await this.districtsService.count();
        const usersCount = await this.usersService.count();
        const redis = await this.healthService.checkRedis();
        const broker = await this.healthService.checkBroker();
        const cache = this.cacheService.getStats();
        const tasks = await this.taskRunnerService.getLastSuccess();

        return {
            status: "ok",
            districts: districtsCount,
            users: usersCount,
            redis,
            broker,
            cache,
            tasks,
        };
    }
}