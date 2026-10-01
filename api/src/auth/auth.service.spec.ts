import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginBlockService } from '../redis/login-block.service.js';
import { PinoLogger } from 'nestjs-pino';
import { ConflictError, UnauthorizedError } from '../errors/app.exception.js';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;

  const generatedHash = bcrypt.hashSync('Password123!', 10);

  const mockUsersService = {
    findByEmail: jest.fn((email: string) => {
      if (email === 'exists@realty.local') {
        return Promise.resolve({
          id: 1,
          email: 'exists@realty.local',
          passwordHash: generatedHash,
          role: 'agent',
          name: 'Тест',
        });
      }
      return Promise.resolve(null);
    }),
  };

  const mockJwtService = {
    signAsync: jest.fn(() => Promise.resolve('mocked_jwt_token')),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'ACCESS_TTL') return '15m';
      if (key === 'REFRESH_TTL') return '30d';
      return 'mock_secret';
    }),
  };

  const mockPrismaService = {};
  const mockLoginBlockService = {
    getBlockTtl: jest.fn(() => Promise.resolve(0)),
    recordFailure: jest.fn(() => Promise.resolve()),
    clearFailures: jest.fn(() => Promise.resolve()),
  };
  const mockPinoLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LoginBlockService, useValue: mockLoginBlockService },
        { provide: PinoLogger, useValue: mockPinoLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a pair of tokens on valid credentials', async () => {
    const result = await service.login('exists@realty.local', 'Password123!');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.accessToken).toBe('mocked_jwt_token');
  });

  it('should throw UnauthorizedError on invalid password', async () => {
    await expect(
      service.login('exists@realty.local', 'WrongPassword'),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError on invalid email', async () => {
    await expect(
      service.login('nonexistent@realty.local', 'Password123!'),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should throw ConflictError USER_EMAIL_TAKEN on register with a taken email', async () => {
    await expect(
      service.register({
        email: 'exists@realty.local',
        password: 'Password123!',
        name: 'Тест',
        phone: '+79990000000',
      }),
    ).rejects.toMatchObject({
      constructor: ConflictError,
      response: expect.objectContaining({ code: 'USER_EMAIL_TAKEN' }),
    });
  });
});
