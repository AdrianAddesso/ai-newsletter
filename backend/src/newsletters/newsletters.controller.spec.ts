import { Test, TestingModule } from '@nestjs/testing';
import { NewslettersController } from './newsletters.controller';
import { NewsLettersService } from './newsletters.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { PermissionsGuard } from '../modules/auth/guards/permissions.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from '../modules/auth/services/authorization.service';
import { PermissionCacheService } from '../modules/auth/services/permission-cache.service';
import { Action } from '../modules/auth/enum/actions';
import { Role } from '../modules/auth/enum/roles';

describe('NewslettersController', () => {
  let controller: NewslettersController;
  let newslettersService: Record<string, jest.Mock>;
  let prisma: { newsletters: { findUnique: jest.Mock } };
  let authorizationService: { isAuthorized: jest.Mock };
  let permissionCacheService: { getPermissionsForRole: jest.Mock };

  beforeEach(async () => {
    newslettersService = {
      getAll: jest.fn(),
      create: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateStatus: jest.fn(),
      getComments: jest.fn(),
      addComment: jest.fn(),
      updateComment: jest.fn(),
      updateExports: jest.fn(),
      getExports: jest.fn(),
      requestChanges: jest.fn(),
      approveReview: jest.fn(),
    };
    prisma = {
      newsletters: {
        findUnique: jest.fn(),
      },
    };
    authorizationService = {
      isAuthorized: jest.fn(),
    };
    permissionCacheService = {
      getPermissionsForRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewslettersController],
      providers: [
        {
          provide: NewsLettersService,
          useValue: newslettersService,
        },
        { provide: PrismaService, useValue: prisma },
        { provide: AuthorizationService, useValue: authorizationService },
        { provide: PermissionCacheService, useValue: permissionCacheService },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<NewslettersController>(NewslettersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uses REVIEW_REQUEST_PREVIEW when moving a newsletter to IN_REVIEW', async () => {
    permissionCacheService.getPermissionsForRole.mockResolvedValue([
      Action.REVIEW_REQUEST_PREVIEW,
    ]);
    prisma.newsletters.findUnique.mockResolvedValue({
      id: 'newsletter-id',
      created_by_user_id: 'user-id',
      state: 'DRAFT',
      area_id: 'area-1',
    });
    authorizationService.isAuthorized.mockReturnValue(true);
    newslettersService.updateStatus.mockResolvedValue({ id: 'newsletter-id' });

    await controller.updateStatus(
      {
        user: {
          id: 'user-id',
          role: Role.USER,
          area_id: 'area-1',
        },
      },
      { id: 'newsletter-id' },
      { state: 'IN_REVIEW' },
    );

    expect(permissionCacheService.getPermissionsForRole).toHaveBeenCalledWith(
      Role.USER,
    );
    expect(authorizationService.isAuthorized).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-id',
        role: Role.USER,
        area_id: 'area-1',
      }),
      Action.REVIEW_REQUEST_PREVIEW,
      expect.objectContaining({
        id: 'newsletter-id',
        state: 'DRAFT',
      }),
    );
    expect(newslettersService.updateStatus).toHaveBeenCalledWith(
      'newsletter-id',
      { state: 'IN_REVIEW' },
    );
  });

  it('uses REVIEW_FINAL_APPROVE_COMMENT when approving a newsletter', async () => {
    permissionCacheService.getPermissionsForRole.mockResolvedValue([
      Action.REVIEW_FINAL_APPROVE_COMMENT,
    ]);
    prisma.newsletters.findUnique.mockResolvedValue({
      id: 'newsletter-id',
      created_by_user_id: 'user-id',
      state: 'IN_REVIEW',
      area_id: 'area-1',
    });
    authorizationService.isAuthorized.mockReturnValue(true);
    newslettersService.updateStatus.mockResolvedValue({ id: 'newsletter-id' });

    await controller.updateStatus(
      {
        user: {
          id: 'functional-id',
          role: Role.FUNCTIONAL,
          area_id: 'area-1',
        },
      },
      { id: 'newsletter-id' },
      { state: 'APPROVED' },
    );

    expect(authorizationService.isAuthorized).toHaveBeenCalledWith(
      expect.objectContaining({
        role: Role.FUNCTIONAL,
        area_id: 'area-1',
      }),
      Action.REVIEW_FINAL_APPROVE_COMMENT,
      expect.objectContaining({
        id: 'newsletter-id',
        state: 'IN_REVIEW',
      }),
    );
  });

  it('derives the reviewer identity from the authenticated request when requesting changes', async () => {
    permissionCacheService.getPermissionsForRole.mockResolvedValue([
      Action.REVIEW_FINAL_APPROVE_COMMENT,
    ]);
    prisma.newsletters.findUnique.mockResolvedValue({
      id: 'newsletter-id',
      created_by_user_id: 'user-id',
      state: 'IN_REVIEW',
      area_id: 'area-1',
    });
    authorizationService.isAuthorized.mockReturnValue(true);
    newslettersService.requestChanges = jest.fn().mockResolvedValue({ id: 'newsletter-id' });

    await controller.requestChanges(
      {
        user: {
          id: 'functional-id',
          role: Role.FUNCTIONAL,
          area_id: 'area-1',
        },
      },
      { id: 'newsletter-id' },
      {
        blockComments: [{ blockId: 'block-a', content: 'Ajustar hero' }],
      },
    );

    expect(newslettersService.requestChanges).toHaveBeenCalledWith('newsletter-id', {
      reviewedByUserId: 'functional-id',
      blockComments: [{ blockId: 'block-a', content: 'Ajustar hero' }],
    });
  });

  it('derives the reviewer identity from the authenticated request when approving a review', async () => {
    permissionCacheService.getPermissionsForRole.mockResolvedValue([
      Action.REVIEW_FINAL_APPROVE_COMMENT,
    ]);
    prisma.newsletters.findUnique.mockResolvedValue({
      id: 'newsletter-id',
      created_by_user_id: 'user-id',
      state: 'RESUBMITTED',
      area_id: 'area-1',
    });
    authorizationService.isAuthorized.mockReturnValue(true);
    newslettersService.approveReview = jest.fn().mockResolvedValue({ id: 'newsletter-id' });

    await controller.approveReview(
      {
        user: {
          id: 'functional-id',
          role: Role.FUNCTIONAL,
          area_id: 'area-1',
        },
      },
      { id: 'newsletter-id' },
    );

    expect(newslettersService.approveReview).toHaveBeenCalledWith('newsletter-id', {
      reviewedByUserId: 'functional-id',
    });
  });

});
