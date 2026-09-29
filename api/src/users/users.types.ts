import {
  Users,
  UserRole as PrismaUserRole,
} from '../generated/prisma/index.js';

export type UserRole = PrismaUserRole;

export type User = Users;

export type PublicUser = Omit<User, 'passwordHash'> & { avatarUrl?: string };
