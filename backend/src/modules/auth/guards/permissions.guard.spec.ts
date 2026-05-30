import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthorizationService } from '../services/authorization.service';
import { ExecutionContext, NotFoundException } from '@nestjs/common';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let prisma: any;
  let authService: any;

  const mockReflector = {
    get: jest.fn(),
  };

  const mockPrismaService = {
    newsletter: {
      findUnique: jest.fn(),
    },
  };

  const mockAuthService = {
    isAuthorized: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuthorizationService, useValue: mockAuthService },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get<Reflector>(Reflector);
    prisma = module.get<PrismaService>(PrismaService);
    authService = module.get<AuthorizationService>(AuthorizationService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const mockContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {
            permissions: ['ACTION1'],
          },
          params: { id: 'res-1' },
        }),
      }),
    } as unknown as ExecutionContext;

    it('should return true if no metadata is present', async () => {
      mockReflector.get.mockReturnValue(null);
      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should return false if user does not have the required permission', async () => {
      mockReflector.get.mockReturnValue({ action: 'ACTION2' });
      const result = await guard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should call authorizationService.isAuthorized with resource if provided', async () => {
      mockReflector.get.mockReturnValue({ action: 'ACTION1', entity: 'newsletter' });
      const mockResource = { id: 'res-1', title: 'Test' };
      mockPrismaService.newsletter.findUnique.mockResolvedValue(mockResource);
      mockAuthService.isAuthorized.mockReturnValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(prisma.newsletter.findUnique).toHaveBeenCalledWith({ where: { id: 'res-1' } });
      expect(authService.isAuthorized).toHaveBeenCalledWith(
        expect.any(Object),
        'ACTION1',
        mockResource
      );
    });

    it('should throw NotFoundException if resource is not found', async () => {
      mockReflector.get.mockReturnValue({ action: 'ACTION1', entity: 'newsletter' });
      mockPrismaService.newsletter.findUnique.mockResolvedValue(null);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(NotFoundException);
    });
  });
});
