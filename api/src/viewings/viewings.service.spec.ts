import { Test, TestingModule } from '@nestjs/testing';
import { ViewingsService } from './viewings.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';

describe('ViewingsService', () => {
  let service: ViewingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViewingsService,
        { provide: PrismaService, useValue: {} },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    service = module.get<ViewingsService>(ViewingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
