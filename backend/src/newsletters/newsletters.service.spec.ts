/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { NewsLettersService } from './newsletters.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('NewsLettersService', () => {
  let service: NewsLettersService;
  let prisma: any;

  beforeEach(async () => {
    const mockPrisma = {
      newsletters: {
        findUnique: jest.fn(),
      },
      newsletter_state_log: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsLettersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NewsLettersService>(NewsLettersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addLog', () => {
    describe('APPROVED', () => {
      it('should allow approved log from IN_REVIEW', async () => {
        prisma.newsletters.findUnique.mockResolvedValue({ id: '1', state: 'IN_REVIEW' });
        prisma.newsletter_state_log.create.mockResolvedValue({});

        await expect(service.addLog('1', { previousState: 'IN_REVIEW', newState: 'APPROVED' })).resolves.toBeDefined();
      });

      it('should allow approved log from RESUBMITTED', async () => {
        prisma.newsletters.findUnique.mockResolvedValue({ id: '1', state: 'RESUBMITTED' });
        prisma.newsletter_state_log.create.mockResolvedValue({});

        await expect(service.addLog('1', { previousState: 'RESUBMITTED', newState: 'APPROVED' })).resolves.toBeDefined();
      });
    });

    describe('CHANGES_REQUESTED', () => {
      it('should allow changes requested from IN_REVIEW', async () => {
        prisma.newsletters.findUnique.mockResolvedValue({ id: '1', state: 'IN_REVIEW' });
        prisma.newsletter_state_log.create.mockResolvedValue({});

        await expect(
          service.addLog('1', {
            previousState: 'IN_REVIEW',
            newState: 'CHANGES_REQUESTED',
            allCommentaries: 'Fix layout sizing',
          }),
        ).resolves.toBeDefined();
      });

      it('should allow changes requested from RESUBMITTED', async () => {
        prisma.newsletters.findUnique.mockResolvedValue({ id: '1', state: 'RESUBMITTED' });
        prisma.newsletter_state_log.create.mockResolvedValue({});

        await expect(
          service.addLog('1', {
            previousState: 'RESUBMITTED',
            newState: 'CHANGES_REQUESTED',
            allCommentaries: 'Fix typography',
          }),
        ).resolves.toBeDefined();
      });

      it('should deny changes requested if newsletter is DRAFT', async () => {
        prisma.newsletters.findUnique.mockResolvedValue({ id: '1', state: 'DRAFT' });

        await expect(
          service.addLog('1', {
            previousState: 'DRAFT',
            newState: 'CHANGES_REQUESTED',
            allCommentaries: 'Fix layout sizing',
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should deny changes requested if newsletter is APPROVED', async () => {
        prisma.newsletters.findUnique.mockResolvedValue({ id: '1', state: 'APPROVED' });

        await expect(
          service.addLog('1', {
            previousState: 'APPROVED',
            newState: 'CHANGES_REQUESTED',
            allCommentaries: 'Fix layout sizing',
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should deny changes requested if allCommentaries is missing', async () => {
        prisma.newsletters.findUnique.mockResolvedValue({ id: '1', state: 'IN_REVIEW' });

        await expect(
          service.addLog('1', {
            previousState: 'IN_REVIEW',
            newState: 'CHANGES_REQUESTED',
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should deny changes requested if allCommentaries is empty string', async () => {
        prisma.newsletters.findUnique.mockResolvedValue({ id: '1', state: 'IN_REVIEW' });

        await expect(
          service.addLog('1', {
            previousState: 'IN_REVIEW',
            newState: 'CHANGES_REQUESTED',
            allCommentaries: '   ',
          }),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('EXPORT', () => {
      it('should allow export log if newsletter is APPROVED', async () => {
        prisma.newsletters.findUnique.mockResolvedValue({ id: '1', state: 'APPROVED' });
        prisma.newsletter_state_log.create.mockResolvedValue({});

        await expect(service.addLog('1', { previousState: 'APPROVED', newState: 'APPROVED' })).resolves.toBeDefined();
      });

      it('should deny export log if newsletter is IN_REVIEW', async () => {
        prisma.newsletters.findUnique.mockResolvedValue({ id: '1', state: 'IN_REVIEW' });

        await expect(service.addLog('1', { previousState: 'APPROVED', newState: 'APPROVED' })).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should deny export log if newsletter is CHANGES_REQUESTED', async () => {
        prisma.newsletters.findUnique.mockResolvedValue({ id: '1', state: 'CHANGES_REQUESTED' });

        await expect(service.addLog('1', { previousState: 'APPROVED', newState: 'APPROVED' })).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should deny export log if newsletter is DRAFT', async () => {
        prisma.newsletters.findUnique.mockResolvedValue({ id: '1', state: 'DRAFT' });

        await expect(service.addLog('1', { previousState: 'APPROVED', newState: 'APPROVED' })).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('VALIDATION', () => {
      it('should throw BadRequestException if newsletter does not exist', async () => {
        prisma.newsletters.findUnique.mockResolvedValue(null);

        await expect(service.addLog('999', { previousState: 'DRAFT', newState: 'APPROVED' })).rejects.toThrow(
          BadRequestException,
        );
      });
    });
  });
});