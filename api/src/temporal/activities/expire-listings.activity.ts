import { TaskRunnerService } from "../../tasks/task-runner.service.js";

export type ExpireListingsResult = {
    processed: number;
    errors: number;
};

export type ExpireListingsActivities = {
    expireListingsActivity: () => Promise<ExpireListingsResult | undefined>;
};

export function createExpireListingsActivities(taskRunner: TaskRunnerService): ExpireListingsActivities {
    return { expireListingsActivity: () => taskRunner.runExpireListings() };
}