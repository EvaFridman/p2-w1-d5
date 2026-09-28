import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { FilesService } from "../files/files.service.js";
import { ListingsService } from "../listings/listings.service.js";
import { ViewingsService } from "../viewings/viewings.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { PublisherService } from "../queue/publisher.service.js";
import { CacheService } from "../redis/cache.service.js";
import { withLock } from "./with-lock.js";
import { dailyDigestTask } from "./daily-digest.task.js";

export enum TaskName {
    CLEANUP = "cleanup",
    EXPIRE_LISTINGS = "expire-listings",
    VIEWING_REMINDERS = "viewing-reminders",
    DAILY_DIGEST = "daily-digest",
}

@Injectable()
export class TaskRunnerService {
    constructor(
        private readonly filesService: FilesService,
        private readonly listingsService: ListingsService,
        private readonly viewingsService: ViewingsService,
        private readonly prisma: PrismaService,
        private readonly publisherService: PublisherService,
        private readonly cacheService: CacheService,
        private readonly logger: PinoLogger
    ) {}

    async runCleanup() {
        return withLock(
            TaskName.CLEANUP,
            this.cacheService,
            () => this.filesService.removeOrphaned(),
            this.logger,
        );
    }

    async runExpireListings() {
        return withLock(
            TaskName.EXPIRE_LISTINGS,
            this.cacheService,
            () => this.listingsService.expireOldListings(),
            this.logger,
        );
    }

    async runViewingReminders() {
        return withLock(
            TaskName.VIEWING_REMINDERS,
            this.cacheService,
            () => this.viewingsService.sendUpcomingReminders(),
            this.logger,
        );
    }

    async runDailyDigest() {
        return withLock(
            TaskName.DAILY_DIGEST,
            this.cacheService,
            () => this.runDailyDigestTask(),
            this.logger,
        );
    }

    private runDailyDigestTask() {
        return dailyDigestTask(
            this.prisma,
            this.publisherService,
            this.cacheService,
        );
    }

    async run(name: TaskName) {
        switch (name) {
            case TaskName.CLEANUP:
                return this.runCleanup();
            case TaskName.EXPIRE_LISTINGS:
                return this.runExpireListings();
            case TaskName.VIEWING_REMINDERS:
                return this.runViewingReminders();
            case TaskName.DAILY_DIGEST:
                return this.runDailyDigest();
            default:
                return undefined;
        }
    }

    async getLastSuccess() {
        const result: Record<TaskName, string | null> = {
            [TaskName.CLEANUP]: null,
            [TaskName.EXPIRE_LISTINGS]: null,
            [TaskName.VIEWING_REMINDERS]: null,
            [TaskName.DAILY_DIGEST]: null,
        };

        for (const name of Object.values(TaskName)) {
            result[name] = await this.cacheService.getPersistent<string>(`task:last-success:${name}`);
        }

        return result;
    }
}