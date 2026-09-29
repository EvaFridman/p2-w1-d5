import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ListingsController } from './listings.controller.js';
import { ListingsService } from './listings.service.js';
import { ViewingsService } from '../viewings/viewings.service.js';

describe('ListingsController', () => {
  let controller: ListingsController;

  const mockListingsService = {
    findAll: jest.fn(),
    getListingsBundleStream: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    findPhotos: jest.fn(),
    updatePhoto: jest.fn(),
    uploadPhotos: jest.fn(),
    deletePhoto: jest.fn(),
    getListingPdfStream: jest.fn(),
  };

  const mockViewingsService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListingsController],
      providers: [
        { provide: ListingsService, useValue: mockListingsService },
        { provide: ViewingsService, useValue: mockViewingsService },
      ],
    }).compile();

    controller = module.get<ListingsController>(ListingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
