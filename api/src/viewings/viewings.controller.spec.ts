import { jest } from '@jest/globals';

jest.mock('@nestjs/throttler', () => ({
  Throttle:
    () => (target: object, key?: string | symbol, descriptor?: unknown) => {
      return descriptor || target;
    },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ViewingsController } from './viewings.controller.js';
import { ViewingsService } from './viewings.service.js';

describe('ViewingsController', () => {
  let controller: ViewingsController;

  const mockViewingsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ViewingsController],
      providers: [{ provide: ViewingsService, useValue: mockViewingsService }],
    }).compile();

    controller = module.get<ViewingsController>(ViewingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
