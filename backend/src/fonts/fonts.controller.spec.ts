import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { FontsController } from './fonts.controller';
import { FontsService } from './fonts.service';

describe('FontsController', () => {
  let controller: FontsController;
  const fontsService = {
    uploadFonts: jest.fn(),
    listFonts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FontsController],
      providers: [
        {
          provide: FontsService,
          useValue: fontsService,
        },
      ],
    }).compile();

    controller = module.get<FontsController>(FontsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('rejects font uploads without bearer authentication', () => {
    expect(() => controller.uploadFonts(undefined, 'Lumen', [])).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects font listing without bearer authentication', () => {
    expect(() => controller.listFonts(undefined)).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects font uploads without a group name', () => {
    expect(() => controller.uploadFonts('Bearer token', '   ', [])).toThrow(
      BadRequestException,
    );
  });
});
