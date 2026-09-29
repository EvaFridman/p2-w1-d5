import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import {
  UseGuards,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { WsThrottlerGuard } from './guards/ws-throttler.guard.js';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { PresenceService } from './presence.service.js';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { AppServer, AppSocket } from './realtime.types.js';
import { UnauthorizedError } from '../errors/app.exception.js';
import { WsRolesGuard } from './guards/ws-roles.guard.js';
import { WsExceptionFilter } from './filters/ws-exception.filter.js';
import { CursorMoveDto } from './dto/cursor-move.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { OnEvent } from '@nestjs/event-emitter';
import { ListingPublishedEvent } from '../listings/events/listing-published.event.js';
import { PrismaService } from '../prisma/prisma.service.js';

const ALLOWED_ROOM = /^(queue|listing:\d+)$/;

@WebSocketGateway({
  cors: {
    origin: (requestOrigin, callback) => {
      callback(null, process.env.CLIENT_URL);
    },
    credentials: true,
  },
})
@UseFilters(WsExceptionFilter)
@UseGuards(WsThrottlerGuard)
@Throttle({ ws: { limit: 100, ttl: 1000 } })
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly presenceService: PresenceService,
    private readonly prismaService: PrismaService,
  ) {}

  afterInit(server: Server) {
    const io = server as unknown as AppServer;
    io.use(async (socket: AppSocket, next) => {
      try {
        const token =
          socket.handshake.auth?.token || socket.handshake.query?.token;

        if (!token) {
          const errorInstance = new UnauthorizedError('No access token');
          return next(new Error(errorInstance.message));
        }

        const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
        const payload = await this.jwtService.verifyAsync(cleanToken, {
          secret,
        });

        const dbUser = await this.prismaService.users.findUnique({
          where: { id: Number(payload.sub) },
          select: { name: true },
        });

        socket.data.user = {
          id: payload.sub,
          name: dbUser?.name ?? 'Unknown',
          role: payload.role,
          email: payload.email ?? '',
        };
        next();
      } catch {
        const errorInstance = new UnauthorizedError('Invalid access token');
        next(new Error(errorInstance.message));
      }
    });
  }

  async handleConnection(socket: AppSocket) {
    if (!socket.data.user) return;
    const isFirstTab = this.presenceService.add(socket);
    const onlineList = this.presenceService.getOnlineList();
    socket.emit('presence:online', onlineList);
    if (isFirstTab) socket.broadcast.emit('presence:online', onlineList);
  }

  private leaveCurrentRooms(socket: AppSocket): void {
    const currentRooms = Array.from(socket.rooms);
    for (const current of currentRooms) {
      if (current === socket.id) continue;
      socket.leave(current);
      socket.to(current).emit('presence:left', { id: socket.data.user.id });
    }
  }

  async handleDisconnect(socket: AppSocket) {
    if (!socket.data.user) return;
    this.leaveCurrentRooms(socket);
    const wasLastTab = this.presenceService.remove(socket);
    if (wasLastTab) {
      const typedServer = this.server as unknown as AppServer;
      typedServer.emit('presence:online', this.presenceService.getOnlineList());
    }
  }

  @SubscribeMessage('ping:check')
  handlePing(@ConnectedSocket() rawSocket: Socket) {
    const socket = rawSocket as unknown as AppSocket;
    socket.emit('pong:check');
  }

  @SubscribeMessage('room:join')
  handleRoomJoin(
    @MessageBody() room: string,
    @ConnectedSocket() rawSocket: Socket,
  ) {
    const socket = rawSocket as unknown as AppSocket;
    if (!ALLOWED_ROOM.test(room)) return;
    this.leaveCurrentRooms(socket);
    socket.join(room);
    socket.to(room).emit('presence:joined', socket.data.user);
    const typedServer = this.server as unknown as AppServer;
    socket.emit(
      'presence:room',
      this.presenceService.getRoomMembers(
        typedServer,
        room,
        socket.data.user.id,
      ),
    );
  }

  @SubscribeMessage('room:leave')
  handleRoomLeave(@ConnectedSocket() rawSocket: Socket) {
    const socket = rawSocket as unknown as AppSocket;
    this.leaveCurrentRooms(socket);
  }

  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      exceptionFactory: (errors) =>
        new WsException({ message: 'Validation failed', details: errors }),
    }),
  )
  @SubscribeMessage('cursor:move')
  handleCursorMove(
    @MessageBody() payload: CursorMoveDto,
    @ConnectedSocket() rawSocket: Socket,
  ) {
    const socket = rawSocket as unknown as AppSocket;
    const { room, x, y } = payload;
    if (!socket.rooms.has(room)) return;
    socket.to(room).emit('cursor:moved', { userId: socket.data.user.id, x, y });
  }

  @SubscribeMessage('presence:request')
  handlePresenceRequest(@ConnectedSocket() rawSocket: Socket) {
    const socket = rawSocket as unknown as AppSocket;
    socket.emit('presence:online', this.presenceService.getOnlineList());
  }

  @Roles('moderator')
  @UseGuards(WsRolesGuard)
  @SubscribeMessage('queue:take')
  handleQueueTake(@ConnectedSocket() rawSocket: Socket) {
    const socket = rawSocket as unknown as AppSocket;
    socket.emit('pong:check');
  }

  @OnEvent(ListingPublishedEvent.eventName)
  handleListingPublishedEvent(event: ListingPublishedEvent) {
    const io = this.server as unknown as AppServer;
    io.to(`listing:${event.listingId}`).emit('listing:updated', event);
    io.to('queue').emit('queue:changed', { listingId: event.listingId });
  }
}
