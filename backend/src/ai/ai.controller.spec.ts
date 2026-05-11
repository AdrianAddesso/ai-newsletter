import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

describe('AiController', () => {
  let controller: AiController;
  const aiService = {
    improveText: jest.fn(),
    generateNewsletter: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: aiService,
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('rejects generate newsletter requests without bearer authentication', () => {
    expect(() =>
      controller.generateNewsletter(undefined, {
        area: 'COMUNICACION_INTERNA',
        templateId: 'weekly-brief',
        brandKitId: 'nestle-corporate',
        topic: 'Tema',
        objective: 'Objetivo',
        audience: 'Audiencia',
        keyMessages: ['Mensaje'],
        tone: 'Cercano',
        linksOrSources: [],
        assetIds: [],
      }),
    ).toThrow(UnauthorizedException);
  });
});
