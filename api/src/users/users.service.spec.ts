import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../generated/prisma/index.js';
import { ConflictError, NotFoundError } from '../errors/app.exception.js';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

const prismaError = (code: string, index?: string) =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', {
    code,
    clientVersion: 'test',
    meta: index
      ? { driverAdapterError: { cause: { constraint: { index } } } }
      : undefined,
  });

const userRow = {
  id: 1,
  name: 'Анна',
  email: 'anna@realty.local',
  phone: '+79990000000',
  role: 'client',
  passwordHash: 'hash',
  avatarFileName: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const newUser = {
  name: 'Анна',
  email: 'anna@realty.local',
  phone: '+79990000000',
  role: 'client' as const,
  avatarFileName: null,
};

describe('UsersService', () => {
  let service: UsersService;
  const prisma = {
    users: {
      create: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      update: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: () => 'http://localhost' } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('returns the created user without the password hash', async () => {
      prisma.users.create.mockResolvedValue(userRow);

      const user = await service.create(newUser);

      expect(user).toMatchObject({ id: 1, email: 'anna@realty.local' });
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('throws ConflictError USER_PHONE_TAKEN when the phone is taken', async () => {
      prisma.users.create.mockRejectedValue(
        prismaError('P2002', 'Users_phone_key'),
      );

      await expect(service.create(newUser)).rejects.toMatchObject({
        constructor: ConflictError,
        response: expect.objectContaining({ code: 'USER_PHONE_TAKEN' }),
      });
    });

    it('throws ConflictError USER_EMAIL_TAKEN when the email is taken', async () => {
      prisma.users.create.mockRejectedValue(
        prismaError('P2002', 'Users_email_key'),
      );

      await expect(service.create(newUser)).rejects.toMatchObject({
        constructor: ConflictError,
        response: expect.objectContaining({ code: 'USER_EMAIL_TAKEN' }),
      });
    });
  });

  describe('update', () => {
    it('returns the updated user', async () => {
      prisma.users.update.mockResolvedValue({ ...userRow, name: 'Мария' });

      await expect(service.update(1, { name: 'Мария' })).resolves.toMatchObject(
        { name: 'Мария' },
      );
    });

    it('throws NotFoundError when the user does not exist', async () => {
      prisma.users.update.mockRejectedValue(prismaError('P2025'));

      await expect(service.update(1, { name: 'Мария' })).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('throws ConflictError instead of NotFoundError when the phone is taken', async () => {
      prisma.users.update.mockRejectedValue(
        prismaError('P2002', 'Users_phone_key'),
      );

      await expect(
        service.update(1, { phone: '+79991111111' }),
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });
});
