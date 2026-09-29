import type { Server, Socket } from 'socket.io';
import type { UserRole } from '../generated/prisma/index.js';

export type SocketUser = {
  id: number;
  role: UserRole;
  email: string;
  name: string;
};

export type ClientToServerEvents = {
  'room:join': (room: string) => void;
  'room:leave': () => void;
  'cursor:move': (payload: { room: string; x: number; y: number }) => void;
  'ping:check': () => void;
  'presence:request': () => void;
};

export type ServerToClientEvents = {
  'presence:online': (users: SocketUser[]) => void;
  'presence:left': (user: { id: number }) => void;
  'presence:joined': (user: SocketUser) => void;
  'presence:room': (users: SocketUser[]) => void;
  'cursor:moved': (payload: { userId: number; x: number; y: number }) => void;
  'pong:check': () => void;
  'listing:updated': (event: any) => void;
  'queue:changed': (payload: { listingId: number }) => void;
};

export type SocketData = { user: SocketUser };

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export type RateLimitCounter = { eventCount: number; intervalStart: number };
