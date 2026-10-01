import type { PrismaService } from '../../../prisma/prisma.service.js';
import type { MailService } from '../../../mail/mail.service.js';
import type { MailPayload } from '../mail.consumer.js';
import type {
  UserMailPayload,
  ViewingMailPayload,
  DigestStatusChange,
} from '../../../mail/mail.service.js';

export async function handleAgentDigest(
  payload: MailPayload,
  prisma: PrismaService,
  mailService: MailService,
): Promise<string> {
  const agentId = payload.agentId;
  const periodFrom = payload.periodFrom;
  const periodTo = payload.periodTo;

  if (!agentId || !periodFrom || !periodTo) return 'skipped';

  const from = new Date(periodFrom);
  const to = new Date(periodTo);

  const agent = await prisma.users.findUnique({ where: { id: agentId } });

  if (!agent || !agent.email) return 'skipped';

  const [viewings, statusChanges] = await Promise.all([
    prisma.viewings.findMany({
      where: {
        createdAt: {
          gte: from,
          lt: to,
        },
        listing: {
          agentId,
        },
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.listingStatusHistory.findMany({
      where: {
        agentId,
        createdAt: {
          gte: from,
          lt: to,
        },
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  if (viewings.length === 0 && statusChanges.length === 0) return 'skipped';

  const validStatusChanges = statusChanges.filter(
    (change) => change.listing !== null,
  ) as unknown as DigestStatusChange[];

  await mailService.sendAgentDigest(
    agent as unknown as UserMailPayload,
    { from, to },
    viewings as unknown as ViewingMailPayload[],
    validStatusChanges,
  );

  return 'processed';
}
