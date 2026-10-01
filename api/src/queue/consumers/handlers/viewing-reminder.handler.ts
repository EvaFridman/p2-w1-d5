import { ViewingStatus } from '../../../generated/prisma/index.js';
import type { PrismaService } from '../../../prisma/prisma.service.js';
import type { MailService } from '../../../mail/mail.service.js';
import type { MailPayload } from '../mail.consumer.js';

import type { ViewingMailPayload } from '../../../mail/mail.service.js';

export async function handleViewingReminder(
  payload: MailPayload,
  prisma: PrismaService,
  mailService: MailService,
): Promise<string> {
  const viewingId = payload.viewingId;

  if (!viewingId) return 'skipped';

  const viewing = await prisma.viewings.findUnique({
    where: { id: viewingId },
    include: { listing: true },
  });

  if (
    !viewing ||
    viewing.status !== ViewingStatus.APPROVED ||
    viewing.reminderSentAt
  ) {
    return 'skipped';
  }

  await mailService.sendViewingReminder(
    viewing as unknown as ViewingMailPayload,
  );

  await prisma.viewings.update({
    where: { id: viewing.id },
    data: { reminderSentAt: new Date() },
  });

  return 'processed';
}
