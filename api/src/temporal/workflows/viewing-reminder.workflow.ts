import { proxyActivities } from '@temporalio/workflow';
import type { ViewingReminderActivities } from '../activities/viewing-reminder.activity.js';

const { sendViewingRemindersActivity } =
  proxyActivities<ViewingReminderActivities>({
    startToCloseTimeout: '10 minutes',
  });

export async function viewingReminderWorkflow(): Promise<number | undefined> {
  return sendViewingRemindersActivity();
}
