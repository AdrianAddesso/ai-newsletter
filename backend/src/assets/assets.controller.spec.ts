import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { asset_type } from '@prisma/client';
import { MockAuthGuard } from '../modules/auth/guards/mockup.guard';
import { PermissionsGuard } from '../modules/auth/guards/permissions.guard';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

describe('AssetsController', () => {
  let controller: AssetsController;
  const assetsService = {
    listAssets: jest.fn(),
    uploadAssets: jest.fn(),
    updateAsset: jest.fn(),
    deleteAsset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [
        {
          provide: AssetsService,
          useValue: assetsService,
        },
      ],
    })
      .overrideGuard(MockAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AssetsController>(AssetsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('rejects asset uploads with invalid asset type', () => {
    expect(() => controller.uploadAssets('NOT_VALID', 'Asset', undefined, [])).toThrow(
      BadRequestException,
    );
  });

  it('rejects asset listing with invalid asset type', () => {
    expect(() => controller.listAssets('NOT_VALID')).toThrow(BadRequestException);
  });

  it('rejects asset uploads without files', () => {
    expect(() => controller.uploadAssets('IMAGE', 'Asset', undefined, [])).toThrow(
      BadRequestException,
    );
  });

  it('rejects asset updates without a valid name', () => {
    expect(() =>
      controller.updateAsset('asset-id', { name: '', type: asset_type.IMAGE }),
    ).toThrow(BadRequestException);
  });

  it('rejects asset updates with block type', () => {
    expect(() =>
      controller.updateAsset('asset-id', { name: 'Asset', type: asset_type.BLOCK }),
    ).toThrow(BadRequestException);
  });
});
