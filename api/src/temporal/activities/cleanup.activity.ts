import { TaskRunnerService } from '../../tasks/task-runner.service.js';

export type CleanupActivities = {
  cleanupActivity: () => Promise<number | undefined>;
};

export function createCleanupActivities(
  taskRunner: TaskRunnerService,
): CleanupActivities {
  return { cleanupActivity: () => taskRunner.runCleanup() };
}
