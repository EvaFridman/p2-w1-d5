import { TaskRunnerService } from '../../tasks/task-runner.service.js';

export type DailyDigestResult = {
  processed: number;
  errors: number;
};

export type DailyDigestActivities = {
  dailyDigestActivity: () => Promise<DailyDigestResult | undefined>;
};

export function createDailyDigestActivities(
  taskRunner: TaskRunnerService,
): DailyDigestActivities {
  return { dailyDigestActivity: () => taskRunner.runDailyDigest() };
}
