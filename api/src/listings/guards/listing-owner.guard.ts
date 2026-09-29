import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UserRole } from '../../generated/prisma/index.js';
import { NotFoundError, ForbiddenError } from '../../errors/app.exception.js';

@Injectable()
export class ListingOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const listingId = parseInt(request.params.id, 10);
    if (isNaN(listingId)) return false;
    if (user.role === UserRole.moderator) return true;
    const listing = await this.prisma.listings.findUnique({
      where: { id: listingId },
      select: { agentId: true },
    });
    if (!listing)
      throw new NotFoundError('Listing not found', null, 'NOT_FOUND');
    if (listing.agentId !== user.id)
      throw new ForbiddenError(
        'Not enough rights access to this listing',
        null,
        'FORBIDDEN',
      );

    return true;
  }
}
