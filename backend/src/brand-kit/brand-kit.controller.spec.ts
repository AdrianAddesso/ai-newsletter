import { BadRequestException } from '@nestjs/common';
import {
  brandKitIdParamSchema,
  type BrandKitIdParam,
} from '../common/zod/route-params.schema';
import { ZodValidationPipe } from '../common/zod/zod-validation.pipe';
import { BrandKitController } from './brand-kit.controller';
import { BrandKitService } from './brand-kit.service';

describe('BrandKitController', () => {
  let controller: BrandKitController;
  let brandKitService: {
    getAll: jest.Mock;
    getResources: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    brandKitService = {
      getAll: jest.fn(),
      getResources: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    controller = new BrandKitController(
      brandKitService as unknown as BrandKitService,
        {} as any,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('validates brand kit resource params as UUIDs', () => {
    const pipe = new ZodValidationPipe(brandKitIdParamSchema);

    expect(() =>
      pipe.transform({
        brandKitId: 'invalid-brand-kit-id',
      }),
    ).toThrow(BadRequestException);
  });

  it('delegates resource lookups to the service', async () => {
    const params: BrandKitIdParam = {
      brandKitId: '88a33dad-077b-497d-ade5-a6b5b5c49a30',
    };

    brandKitService.getResources.mockResolvedValue({
      brandKit: { id: params.brandKitId, name: 'Carnation' },
      assets: [],
      colors: [],
      fonts: [],
    });

    await expect(controller.getResources(params)).resolves.toEqual({
      brandKit: { id: params.brandKitId, name: 'Carnation' },
      assets: [],
      colors: [],
      fonts: [],
    });
    expect(brandKitService.getResources).toHaveBeenCalledWith(
      params.brandKitId,
    );
  });
});
