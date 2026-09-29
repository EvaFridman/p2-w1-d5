import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesController } from './favorites.controller.js';
import { FavoritesService } from './favorites.service.js';

describe('FavoritesController', () => {
  let controller: FavoritesController;

  const mockFavoritesService = {
    add: jest.fn(),
    remove: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        { provide: FavoritesService, useValue: mockFavoritesService },
      ],
    }).compile();

    controller = module.get<FavoritesController>(FavoritesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
