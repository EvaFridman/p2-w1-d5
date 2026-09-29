import { Test, TestingModule } from '@nestjs/testing';
import { DistrictsController } from './districts.controller.js';
import { DistrictsService } from './districts.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('DistrictsController', () => {
  let controller: DistrictsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DistrictsController],
      providers: [
        DistrictsService,
        { provide: PrismaService, useValue: {} },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    controller = module.get<DistrictsController>(DistrictsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
