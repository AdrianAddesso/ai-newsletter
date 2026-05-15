import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MockAuthGuard } from '../modules/auth/guards/mockup.guard';

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

  it('applies MockAuthGuard at controller level', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AiController) as Array<
      new (...args: unknown[]) => unknown
    >;

    expect(guards).toContain(MockAuthGuard);
  });

  it('delegates generate newsletter requests to the service', async () => {
    const body = {
      area: 'COMUNICACION_INTERNA' as const,
      templateId: 'weekly-brief',
      brandKitId: 'nestle-corporate',
      topic: 'Tema',
      objective: 'Objetivo',
      audience: 'Audiencia',
      keyMessages: ['Mensaje'],
      tone: 'Cercano',
      linksOrSources: [],
      assetIds: [],
    };

    aiService.generateNewsletter.mockResolvedValue({ blocks: [] });

    await expect(controller.generateNewsletter(body)).resolves.toEqual({
      blocks: [],
    });
    expect(aiService.generateNewsletter).toHaveBeenCalledWith(body);
  });
});
