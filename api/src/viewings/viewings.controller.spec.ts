import { Test, TestingModule } from '@nestjs/testing';
import { ViewingsController } from './viewings.controller.js';
import { ViewingsService } from './viewings.service.js';

describe('ViewingsController', () => {
  let controller: ViewingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ViewingsController],
      providers: [{ provide: ViewingsService, useValue: {} }],
    }).compile();

    controller = module.get<ViewingsController>(ViewingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
