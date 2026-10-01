import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { NativeConnection, Worker } from '@temporalio/worker';
import { TemporalWorkerModule } from './temporal-worker.module.js';
import { TaskRunnerService } from '../tasks/task-runner.service.js';
import { createCleanupActivities } from './activities/cleanup.activity.js';
import { createExpireListingsActivities } from './activities/expire-listings.activity.js';
import { createViewingReminderActivities } from './activities/viewing-reminder.activity.js';
import { createDailyDigestActivities } from './activities/daily-digest.activity.js';

const TASK_QUEUE = 'scheduled-tasks';

const app = await NestFactory.createApplicationContext(TemporalWorkerModule, {
  bufferLogs: true,
});

app.useLogger(app.get(Logger));

const taskRunner = app.get(TaskRunnerService);

const cleanupActivities = createCleanupActivities(taskRunner);
const expireListingsActivities = createExpireListingsActivities(taskRunner);
const viewingReminderActivities = createViewingReminderActivities(taskRunner);
const dailyDigestActivities = createDailyDigestActivities(taskRunner);

const activities = {
  ...cleanupActivities,
  ...expireListingsActivities,
  ...viewingReminderActivities,
  ...dailyDigestActivities,
};

const connection = await NativeConnection.connect({
  address: process.env.TEMPORAL_ADDRESS,
});

const worker = await Worker.create({
  connection,
  workflowsPath: new URL('./workflows/index.js', import.meta.url).pathname,
  activities,
  taskQueue: TASK_QUEUE,
});

await worker.run();
