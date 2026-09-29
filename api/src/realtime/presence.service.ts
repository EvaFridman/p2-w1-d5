import { Injectable } from '@nestjs/common';
import { AppServer, AppSocket, SocketUser } from './realtime.types.js';

type OnlineUsersEntryType = {
  user: SocketUser;
  socketIds: Set<string>;
};

@Injectable()
export class PresenceService {
  private readonly onlineUsers = new Map<number, OnlineUsersEntryType>();

  add(client: AppSocket): boolean {
    const user = client.data.user;
    if (!user) return false;

    const entry = this.onlineUsers.get(user.id) ?? {
      user,
      socketIds: new Set<string>(),
    };
    entry.socketIds.add(client.id);
    this.onlineUsers.set(user.id, entry);

    return entry.socketIds.size === 1;
  }

  remove(client: AppSocket): boolean {
    const user = client.data.user;
    if (!user) return false;

    const entry = this.onlineUsers.get(user.id);
    if (!entry) return false;

    entry.socketIds.delete(client.id);
    if (entry.socketIds.size === 0) {
      this.onlineUsers.delete(user.id);
      return true;
    }

    return false;
  }

  getOnlineList(): SocketUser[] {
    return Array.from(this.onlineUsers.values()).map(({ user }) => user);
  }

  getRoomMembers(
    server: AppServer,
    room: string,
    selfId: number,
  ): SocketUser[] {
    const socketIds =
      server.sockets.adapter.rooms.get(room) ?? new Set<string>();
    const inRoomUsers = new Map<number, SocketUser>();

    for (const socketId of socketIds) {
      const memberSocket = server.sockets.sockets.get(socketId);
      if (!memberSocket?.data?.user) continue;

      const user = memberSocket.data.user;
      if (user.id !== selfId) inRoomUsers.set(user.id, user);
    }

    return Array.from(inRoomUsers.values());
  }
}
