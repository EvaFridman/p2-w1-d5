import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateViewingDto } from './dto/create-viewing.dto.js';
import { ListViewingsDto } from './dto/list-viewings.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { canTransition, getAllowedTransitions } from '../common/viewingStatusTransitions.service.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../errors/app.exception.js';
import { UserRole, ViewingStatus, Prisma } from '../generated/prisma/index.js';
import { PublisherService } from "../queue/publisher.service.js";

@Injectable()
export class ViewingsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly publisherService: PublisherService,
        private readonly logger: PinoLogger,
    ) { }

    private handlePrismaError(error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                throw new NotFoundError('Viewing not found');
            }
        }
        throw error;
    }

    async create(listingId: number, dto: CreateViewingDto) {
        const listing = await this.prisma.listings.findUnique({ where: { id: listingId } });
        if (!listing) throw new NotFoundError('Listing not found');

        const viewing = await this.prisma.viewings.create({
            data: {
                listingId,
                ...dto,
                status: ViewingStatus.CREATED,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
        
        this.logger.info(
            {
                viewingId: viewing.id,
                listingId,
            },
            'Viewing created',
        );
        
        return viewing;
    }

    async findAll(dto: ListViewingsDto, user: { id: number; role: string }) {
        const pageSizeDefault = Number(this.configService.get<number>('PAGE_SIZE_DEFAULT') ?? 20);
        const pageSizeMax = Number(this.configService.get<number>('PAGE_SIZE_MAX') ?? 100);

        const finalPage = (!dto.page || dto.page < 1) ? 1 : dto.page;
        let finalLimit = (!dto.limit || dto.limit < 1) ? pageSizeDefault : dto.limit;
        if (finalLimit > pageSizeMax) finalLimit = pageSizeMax;

        const whereCondition: any = {};
        if (dto.status) whereCondition.status = dto.status.toUpperCase();
        if (dto.listingId) whereCondition.listingId = dto.listingId;

        if (user.role === UserRole.agent) whereCondition.listing = { agentId: user.id };

        const [items, total] = await Promise.all([
            this.prisma.viewings.findMany({
                where: whereCondition,
                skip: (finalPage - 1) * finalLimit,
                take: finalLimit,
                include: { listing: true },
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.viewings.count({ where: whereCondition })
        ]);

        const totalPages = total > 0 ? Math.ceil(total / finalLimit) : 0;

        const itemsWithTransitions = items.map((viewing) => ({ ...viewing, allowedTransitions: getAllowedTransitions(viewing.status) }));

        return { items: itemsWithTransitions, meta: { page: finalPage, limit: finalLimit, total, totalPages } };
    }

    async findOne(id: number, user: { id: number; role: string }) {
        const viewing = await this.prisma.viewings.findUnique({ where: { id }, include: { listing: true } });
        if (!viewing) throw new NotFoundError('Viewing not found');
        if (user.role === UserRole.agent && viewing.listing?.agentId !== user.id) throw new ForbiddenError('You do not have access to this viewing');

        return { ...viewing, allowedTransitions: getAllowedTransitions(viewing.status) };
    }

    async sendUpcomingReminders(): Promise<number> {
        const now = new Date();
        const from = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const to = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    
        const viewings = await this.prisma.viewings.findMany({
            where: {
                status: ViewingStatus.APPROVED,
                preferredAt: {
                    gte: from,
                    lt: to,
                },
                reminderSentAt: null,
            },
            select: { id: true },
        });
    
        for (const viewing of viewings) {
            this.publisherService.publish(
                "viewing.reminder",
                { viewingId: viewing.id },
                { messageId: `viewing-reminder:${viewing.id}` },
            );
        }
    
        return viewings.length;
    }

    async updateStatus(id: number, dto: UpdateStatusDto, user: { id: number; role: string }) {
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const viewing = await tx.viewings.findUnique({ where: { id }, include: { listing: true } });
                if (!viewing) throw new NotFoundError('Viewing not found');
                const previousStatus = viewing.status;
                if (user.role === UserRole.agent && viewing.listing?.agentId !== user.id) throw new ForbiddenError('You do not have access to this viewing');
                if (!canTransition(viewing.status, dto.status)) {
                    const allowed = getAllowedTransitions(viewing.status).join(', ');
                    throw new ConflictError(`Transition from ${viewing.status} to ${dto.status} is not allowed`, allowed as any);
                }

                const updateData: any = { status: dto.status, updatedAt: new Date() };
                const triggerStatuses: ViewingStatus[] = [ViewingStatus.APPROVED, ViewingStatus.REJECTED, ViewingStatus.CLOSED];
                if (triggerStatuses.includes(dto.status)) updateData.notifiedAt = new Date();

                const updatedViewing = await tx.viewings.update({ where: { id }, data: updateData, include: { listing: true } });

                return { updatedViewing, previousStatus };
            });

            const { updatedViewing, previousStatus } = result;

            this.logger.info(
                {
                    viewingId: updatedViewing.id,
                    listingId: updatedViewing.listingId,
                    userId: user.id,
                    fromStatus: previousStatus,
                    toStatus: updatedViewing.status,
                },
                'Viewing status changed',
            );

            this.publisherService.publish("viewing.status-changed", { viewingId: updatedViewing.id }, { messageId: `viewing-status-changed:${updatedViewing.id}` });

            return {
                ...updatedViewing,
                allowedTransitions: getAllowedTransitions(updatedViewing.status),
            };
        } catch (error) {
            this.handlePrismaError(error);
        }
    }
}
