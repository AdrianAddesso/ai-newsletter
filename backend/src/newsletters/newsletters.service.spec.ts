/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
jest.mock('../notifications/notifications.service', () => ({
  NotificationsService: class NotificationsService {
    notifyNewsletterDeleted = jest.fn()
    notifyNewsletterStateChange = jest.fn()
  },
}))

import { Test, TestingModule } from '@nestjs/testing';
import { NewsLettersService } from './newsletters.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('NewsLettersService', () => {
  let service: NewsLettersService;
  let prisma: any;

  beforeEach(async () => {
    const transactionClient = {
      newsletters: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      newsletter_blocks: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      block_content: {
        create: jest.fn().mockResolvedValue({ id: 'block-content-id' }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      assets_block: {
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      newsletter_state_log: {
        create: jest.fn(),
      },
      commentary: {
        updateMany: jest.fn(),
        create: jest.fn(),
      },
    };
    const runTransaction = (
      callback: (tx: typeof transactionClient) => Promise<unknown>,
    ) => callback(transactionClient);
    const mockPrisma = {
      $transaction: jest.fn(runTransaction),
      newsletters: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      users: {
        findUnique: jest.fn(),
      },
      templates: {
        findFirst: jest.fn(),
      },
      newsletter_state_log: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      __tx: transactionClient,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsLettersService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: StorageService,
          useValue: {
            getSignedUrl: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            notifyNewsletterDeleted: jest.fn(),
            notifyNewsletterStateChange: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NewsLettersService>(NewsLettersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('persists block asset relations when saving newsletter blocks', async () => {
    prisma.newsletters.findFirst
      .mockResolvedValueOnce({ id: 'newsletter-id', state: 'DRAFT' })
      .mockResolvedValueOnce({
        id: 'newsletter-id',
        created_by_user_id: null,
        state: 'DRAFT',
        template_id: null,
        brand_kit_id: null,
        generation_content: null,
        created_at: new Date('2026-05-24T12:00:00.000Z'),
        updated_at: new Date('2026-05-24T12:00:00.000Z'),
        newsletter_blocks: [],
      });

    await service.update('newsletter-id', {
      blocks: [
        {
          id: 'headerLeft-0-0-0',
          type: 'headerLeft',
          name: 'Header Left',
          content: null,
          row: 0,
          gridColumn: 0,
          displayOrder: 0,
          mustFill: false,
          comment: null,
          assetBindings: [
            {
              fieldKey: 'logoAsset',
              assetId: '550e8400-e29b-41d4-a716-446655440001',
              keywordText: 'Hola',
            },
          ],
        },
      ],
    });

    expect(prisma.__tx.assets_block.create).toHaveBeenCalledWith({
      data: {
        block_id: 'block-content-id',
        asset_id: '550e8400-e29b-41d4-a716-446655440001',
        field_key: 'logoAsset',
        keyword_text: 'Hola',
      },
    });
  });

  it('soft deletes previous newsletter block rows before recreating them', async () => {
    prisma.__tx.newsletter_blocks.findMany.mockResolvedValue([
      { block_content_id: 'old-block-content-id' },
    ]);
    prisma.newsletters.findFirst
      .mockResolvedValueOnce({ id: 'newsletter-id', state: 'DRAFT' })
      .mockResolvedValueOnce({
        id: 'newsletter-id',
        created_by_user_id: null,
        state: 'DRAFT',
        template_id: null,
        brand_kit_id: null,
        generation_content: null,
        created_at: new Date('2026-05-24T12:00:00.000Z'),
        updated_at: new Date('2026-05-24T12:00:00.000Z'),
        newsletter_blocks: [],
      });

    await service.update('newsletter-id', {
      blocks: [],
    });

    expect(prisma.__tx.newsletter_blocks.updateMany).toHaveBeenCalledWith({
      where: {
        newsletter_id: 'newsletter-id',
        block_content_id: {
          in: ['old-block-content-id'],
        },
        deleted_at: null,
      },
      data: {
        deleted_at: expect.any(Date) as Date,
      },
    });
    expect(prisma.__tx.assets_block.updateMany).toHaveBeenCalledWith({
      where: {
        block_id: {
          in: ['old-block-content-id'],
        },
        deleted_at: null,
      },
      data: {
        deleted_at: expect.any(Date) as Date,
      },
    });
    expect(prisma.__tx.block_content.updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['old-block-content-id'],
        },
        deleted_at: null,
      },
      data: {
        deleted_at: expect.any(Date) as Date,
      },
    });
  });

  it('marks newsletters as deleted with deleted_at', async () => {
    prisma.newsletters.findFirst.mockResolvedValue({ id: 'newsletter-id' });
    prisma.newsletters.update.mockResolvedValue({
      id: 'newsletter-id',
      deleted_at: new Date('2026-06-03T12:00:00.000Z'),
    });

    await service.delete('newsletter-id');

    expect(prisma.newsletters.findFirst).toHaveBeenCalledWith({
      where: { id: 'newsletter-id', deleted_at: null },
      select: { id: true },
    });
    expect(prisma.newsletters.update).toHaveBeenCalledWith({
      where: { id: 'newsletter-id' },
      data: {
        deleted_at: expect.any(Date) as Date,
      },
    });
  });

  it('clears active comments for blocks changed while the newsletter is in CHANGES_REQUESTED', async () => {
    prisma.__tx.newsletter_blocks.findMany.mockResolvedValue([
      {
        block_content_id: 'block-content-id',
        display_order: 0,
        row: 0,
        grid_column: 0,
        block_content: {
          block_type: 'headerLeft',
          content: '{"headline":"Texto original"}',
          display_order: 0,
          must_fill: false,
          type: 'CONTENT',
          assets_block: [],
        },
      },
    ]);
    prisma.newsletters.findFirst
      .mockResolvedValueOnce({ id: 'newsletter-id', state: 'CHANGES_REQUESTED' })
      .mockResolvedValueOnce({
        id: 'newsletter-id',
        title: 'Newsletter',
        created_by_user_id: null,
        state: 'CHANGES_REQUESTED',
        template_id: null,
        brand_kit_id: null,
        generation_content: null,
        created_at: new Date('2026-05-24T12:00:00.000Z'),
        updated_at: new Date('2026-05-24T12:00:00.000Z'),
        newsletter_blocks: [],
      });

    await service.update('newsletter-id', {
      blocks: [
        {
          id: 'block-content-id',
          type: 'headerLeft',
          name: 'Header Left',
          content: '{"headline":"Texto editado"}',
          row: 0,
          gridColumn: 0,
          displayOrder: 0,
          mustFill: false,
          comment: null,
          assetBindings: [],
        },
      ],
    });

    expect(prisma.__tx.commentary.updateMany).toHaveBeenCalledWith({
      where: {
        block_content_id: {
          in: ['block-content-id'],
        },
        deleted_at: null,
        show: true,
      },
      data: {
        deleted_at: expect.any(Date) as Date,
        show: false,
      },
    });
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

  describe('requestChanges', () => {
    it('stores a review round, updates active block comments, and moves the newsletter to CHANGES_REQUESTED', async () => {
      prisma.__tx.newsletters.findFirst.mockResolvedValue({
        id: 'newsletter-id',
        state: 'IN_REVIEW',
        newsletter_blocks: [
          { block_content_id: 'block-a' },
          { block_content_id: 'block-b' },
        ],
      });
      jest.spyOn(service, 'getById').mockResolvedValue({ id: 'newsletter-id' } as never);

      await service.requestChanges('newsletter-id', {
        reviewedByUserId: 'reviewer-id',
        blockComments: [
          { blockId: 'block-a', content: ' Primer comentario ' },
          { blockId: 'block-a', content: ' Comentario final ' },
          { blockId: 'block-b', content: ' Ajustar CTA ' },
        ],
      });

      expect(prisma.__tx.newsletter_state_log.create).toHaveBeenCalledWith({
        data: {
          newsletter_id: 'newsletter-id',
          previous_state: 'IN_REVIEW',
          new_state: 'CHANGES_REQUESTED',
          reviewed_by_user_id: 'reviewer-id',
          all_commentaries:
            '[{"blockId":"block-a","content":"Comentario final"},{"blockId":"block-b","content":"Ajustar CTA"}]',
        },
      });
      expect(prisma.__tx.commentary.updateMany).toHaveBeenCalledWith({
        where: {
          block_content_id: {
            in: ['block-a', 'block-b'],
          },
          deleted_at: null,
        },
        data: {
          deleted_at: expect.any(Date) as Date,
          show: false,
        },
      });
      expect(prisma.__tx.commentary.create).toHaveBeenNthCalledWith(1, {
        data: {
          block_content_id: 'block-a',
          commented_by_user_id: 'reviewer-id',
          show: true,
          content: 'Comentario final',
        },
      });
      expect(prisma.__tx.commentary.create).toHaveBeenNthCalledWith(2, {
        data: {
          block_content_id: 'block-b',
          commented_by_user_id: 'reviewer-id',
          show: true,
          content: 'Ajustar CTA',
        },
      });
      expect(prisma.__tx.newsletters.update).toHaveBeenCalledWith({
        where: { id: 'newsletter-id' },
        data: {
          state: 'CHANGES_REQUESTED',
        },
      });
    });

    it('rejects requestChanges when the newsletter is not under review', async () => {
      prisma.__tx.newsletters.findFirst.mockResolvedValue({
        id: 'newsletter-id',
        state: 'DRAFT',
        newsletter_blocks: [],
      });

      await expect(
        service.requestChanges('newsletter-id', {
          reviewedByUserId: 'reviewer-id',
          blockComments: [{ blockId: 'block-a', content: 'Ajustar título' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects requestChanges when a comment targets a block outside the newsletter', async () => {
      prisma.__tx.newsletters.findFirst.mockResolvedValue({
        id: 'newsletter-id',
        state: 'RESUBMITTED',
        newsletter_blocks: [{ block_content_id: 'block-a' }],
      });

      await expect(
        service.requestChanges('newsletter-id', {
          reviewedByUserId: 'reviewer-id',
          blockComments: [{ blockId: 'block-z', content: 'Ajustar imagen' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects requestChanges when every comment is blank', async () => {
      prisma.__tx.newsletters.findFirst.mockResolvedValue({
        id: 'newsletter-id',
        state: 'IN_REVIEW',
        newsletter_blocks: [{ block_content_id: 'block-a' }],
      });

      await expect(
        service.requestChanges('newsletter-id', {
          reviewedByUserId: 'reviewer-id',
          blockComments: [{ blockId: 'block-a', content: '   ' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveReview', () => {
    it('moves the newsletter to APPROVED and logs the persisted previous state', async () => {
      prisma.__tx.newsletters.findFirst.mockResolvedValue({
        id: 'newsletter-id',
        state: 'RESUBMITTED',
      });
      jest.spyOn(service, 'getById').mockResolvedValue({ id: 'newsletter-id' } as never);

      await service.approveReview('newsletter-id', {
        reviewedByUserId: 'reviewer-id',
      });

      expect(prisma.__tx.newsletters.update).toHaveBeenCalledWith({
        where: { id: 'newsletter-id' },
        data: {
          state: 'APPROVED',
          approved_by_user_id: 'reviewer-id',
        },
      });
      expect(prisma.__tx.newsletter_state_log.create).toHaveBeenCalledWith({
        data: {
          newsletter_id: 'newsletter-id',
          previous_state: 'RESUBMITTED',
          new_state: 'APPROVED',
          reviewed_by_user_id: 'reviewer-id',
        },
      });
    });

    it('rejects approveReview when the newsletter is not under review', async () => {
      prisma.__tx.newsletters.findFirst.mockResolvedValue({
        id: 'newsletter-id',
        state: 'CHANGES_REQUESTED',
      });

      await expect(
        service.approveReview('newsletter-id', {
          reviewedByUserId: 'reviewer-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
