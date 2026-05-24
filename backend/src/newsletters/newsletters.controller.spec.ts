import { Test, TestingModule } from '@nestjs/testing';
import { NewslettersController } from './newsletters.controller';
import { NewsLettersService } from './newsletters.service';
import { MockAuthGuard } from '../modules/auth/guards/mockup.guard';
import { PermissionsGuard } from '../modules/auth/guards/permissions.guard';

describe('NewslettersController', () => {
  let controller: NewslettersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewslettersController],
      providers: [
        {
          provide: NewsLettersService,
          useValue: {
            getAll: jest.fn(),
            create: jest.fn(),
            getById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            updateStatus: jest.fn(),
            addLog: jest.fn(),
            getLogs: jest.fn(),
            getComments: jest.fn(),
            addComment: jest.fn(),
            updateComment: jest.fn(),
            updateExports: jest.fn(),
            getExports: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(MockAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<NewslettersController>(NewslettersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
