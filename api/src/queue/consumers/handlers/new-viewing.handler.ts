import type { PrismaService } from '../../../prisma/prisma.service.js';
import type { MailService } from '../../../mail/mail.service.js';
import type { MailPayload } from '../mail.consumer.js';
import type {
  ListingMailPayload,
  ViewingMailPayload,
} from '../../../mail/mail.service.js';

export async function handleNewViewing(
  payload: MailPayload,
  prisma: PrismaService,
  mailService: MailService,
): Promise<string> {
  const viewingId = payload.viewingId;

  if (!viewingId) return 'skipped';

  const viewing = await prisma.viewings.findUnique({
    where: { id: viewingId },
    include: {
      listing: {
        include: {
          agent: true,
          district: true,
          photos: { orderBy: { position: 'asc' } },
        },
      },
    },
  });

  if (!viewing || viewing.notifiedAt) return 'skipped';

  if (!viewing.listing) return 'skipped';

  await mailService.sendNewViewingNotice(
    viewing.listing as unknown as ListingMailPayload,
    viewing as unknown as ViewingMailPayload,
  );

  await prisma.viewings.update({
    where: { id: viewing.id },
    data: { notifiedAt: new Date() },
  });

  return 'processed';
}
