import { PrismaService } from '../prisma/prisma.service.js';
import { PublisherService } from '../queue/publisher.service.js';
import { CacheService } from '../redis/cache.service.js';

const DAILY_DIGEST_TTL = 2 * 24 * 60 * 60;

export async function dailyDigestTask(
  prisma: PrismaService,
  publisherService: PublisherService,
  cacheService: CacheService,
): Promise<{ processed: number; errors: number }> {
  const now = new Date();
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const date = now.toISOString().slice(0, 10);

  const [viewings, statusChanges] = await Promise.all([
    prisma.viewings.findMany({
      where: {
        createdAt: {
          gte: from,
          lt: now,
        },
      },
      select: {
        listing: {
          select: {
            agentId: true,
          },
        },
      },
    }),
    prisma.listingStatusHistory.findMany({
      where: {
        createdAt: {
          gte: from,
          lt: now,
        },
      },
      select: {
        agentId: true,
      },
    }),
  ]);

  const agentIds = new Set<number>();

  for (const viewing of viewings) {
    if (!viewing.listing) continue;
    agentIds.add(viewing.listing.agentId);
  }

  for (const statusChange of statusChanges) {
    agentIds.add(statusChange.agentId);
  }

  let processed = 0;
  let errors = 0;

  for (const agentId of agentIds) {
    try {
      const markerKey = `agent-digest:${agentId}:${date}`;
      const marked = await cacheService.setIfNotExists(
        markerKey,
        true,
        DAILY_DIGEST_TTL,
      );

      if (!marked) continue;

      publisherService.publish(
        'agent.digest',
        {
          agentId,
          periodFrom: from.toISOString(),
          periodTo: now.toISOString(),
        },
        {
          messageId: `agent-digest:${agentId}:${date}`,
        },
      );

      processed++;
    } catch {
      errors++;
    }
  }

  return { processed, errors };
}
