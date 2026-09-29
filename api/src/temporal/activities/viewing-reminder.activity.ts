import { TaskRunnerService } from '../../tasks/task-runner.service.js';

export type ViewingReminderActivities = {
  sendViewingRemindersActivity: () => Promise<number | undefined>;
};

export function createViewingReminderActivities(
  taskRunner: TaskRunnerService,
): ViewingReminderActivities {
  return {
    sendViewingRemindersActivity: () => taskRunner.runViewingReminders(),
  };
}
