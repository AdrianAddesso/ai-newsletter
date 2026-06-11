import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  asset_type,
  block_content_type,
  newsletter_state,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import MailComposer from 'nodemailer/lib/mail-composer';
import { renderMjml } from './utils/renderMjml';
import type {
  CreateNewsletterBody,
  NewsletterEditableBlock,
  ReviewBlockComment,
  UpdateNewsletterBody,
  UpdateNewsletterStatusBody,
} from './newsletters.schemas';
import {
  getBlockDefinition,
  getBlockEditFields,
  type NewsletterBlockDto,
  parseBlockValues,
} from '../blocks/newsletter-blocks';
import { Role } from '../modules/auth/enum/roles';
import { NotificationsService } from '../notifications/notifications.service';
import { renderNewsletterEmailBlock } from './email-renderers';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ReviewRequestUser = {
  id?: string;
  role?: Role;
  area?: string;
  area_id?: string;
};

type PersistedNewsletterBlock = Prisma.newsletter_blocksGetPayload<{
  include: {
    block_content: {
      include: {
        assets_block: {
          where: { deleted_at: null };
          include: { assets: true };
        };
      };
    };
  };
}>;

type ExistingEditableBlock = Prisma.newsletter_blocksGetPayload<{
  include: {
    block_content: {
      include: {
        assets_block: {
          where: { deleted_at: null };
        };
      };
    };
  };
}>;

type ReviewLogRecord = Prisma.newsletter_state_logGetPayload<{
  include: {
    users: {
      select: {
        id: true;
        name: true;
        last_name: true;
      };
    };
  };
}>;

type StoredReviewComment = {
  blockId: string;
  content: string;
};

type EmailInlineAttachment = {
  filename: string;
  content: Buffer;
  cid: string;
  contentType?: string;
};

type EmailBlockSnapshotInput = {
  blockId: string;
  dataUrl: string;
  width: number;
  height: number;
};

@Injectable()
export class NewsLettersService {
  private readonly keywordSvgTemplateCache = new Map<string, Promise<string>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.newsletters.findMany({
        skip,
        take: limit,
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
        include: {
          users_newsletters_created_by_user_idTousers: {
            select: { id: true, name: true, last_name: true },
          },
        },
      }),
      this.prisma.newsletters.count({ where: { deleted_at: null } }),
    ]);

    return {
      data: data.map((newsletter) => ({
        id: newsletter.id,
        title: this.resolveNewsletterTitle(
          newsletter.title,
          newsletter.generation_content,
        ),
        creatorUserId: newsletter.created_by_user_id ?? '',
        authorName: this.formatUserName(
          newsletter.users_newsletters_created_by_user_idTousers,
        ),
        state: newsletter.state,
        language: newsletter.language,
        publishDate: newsletter.publish_date?.toISOString() ?? null,
        updatedAt: newsletter.updated_at.toISOString(),
        createdAt: newsletter.created_at.toISOString(),
      })),
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async getReviewInbox(user?: ReviewRequestUser) {
    if (!user?.role || user.role === Role.USER) {
      return [];
    }

    const where: Prisma.newslettersWhereInput = {
      deleted_at: null,
      state: {
        in: [newsletter_state.IN_REVIEW, newsletter_state.RESUBMITTED],
      },
    };

    const newsletters = await this.prisma.newsletters.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      include: {
        areas: {
          select: {
            name: true,
          },
        },
        users_newsletters_created_by_user_idTousers: {
          select: {
            id: true,
            name: true,
            last_name: true,
          },
        },
      },
    });

    return newsletters.map((newsletter) => ({
      id: newsletter.id,
      title: this.resolveNewsletterTitle(
        newsletter.title,
        newsletter.generation_content,
      ),
      author: this.formatUserName(
        newsletter.users_newsletters_created_by_user_idTousers,
      ),
      area: newsletter.areas?.name ?? null,
      status: newsletter.state,
      submittedAt: newsletter.created_at.toISOString(),
      updatedAt: newsletter.updated_at.toISOString(),
    }));
  }

  async create(body: CreateNewsletterBody, requestUserId?: string) {
    const creatorId = await this.resolveUserId(
      body.createdByUserId ?? requestUserId,
    );
    const template = body.templateId
      ? await this.prisma.templates.findFirst({
          where: { id: body.templateId, deleted_at: null },
          select: { id: true, area_id: true },
        })
      : null;

    if (body.templateId && !template) {
      throw new NotFoundException('No se encontro el template solicitado.');
    }

    const newsletter = await this.prisma.$transaction(async (tx) => {
      const created = await tx.newsletters.create({
        data: {
          title: body.title,
          area_id: body.areaId ?? template?.area_id ?? null,
          theme_tag: body.themeTag ?? null,
          publish_date: body.publishDate ? new Date(body.publishDate) : null,
          brand_kit_id: body.brandKitId ?? null,
          template_id: body.templateId ?? null,
          approved_by_user_id: body.approvedByUserId ?? null,
          created_by_user_id: creatorId,
          state: newsletter_state.DRAFT,
          language: body.language,
          format: body.format,
          generation_content: this.toGenerationContentJson(body),
        },
      });

      await this.replaceBlocks(tx, created.id, body.blocks ?? []);

      return created;
    });

    return this.getById(newsletter.id);
  }

  async getById(id: string) {
    const newsletter = await this.prisma.newsletters.findFirst({
      where: { id, deleted_at: null },
      include: {
        areas: {
          select: {
            name: true,
          },
        },
        users_newsletters_created_by_user_idTousers: {
          select: {
            id: true,
            name: true,
            last_name: true,
          },
        },
        newsletter_blocks: {
          where: { deleted_at: null },
          orderBy: [
            { row: 'asc' },
            { grid_column: 'asc' },
            { display_order: 'asc' },
          ],
          include: {
            block_content: {
              include: {
                assets_block: {
                  where: { deleted_at: null },
                  include: { assets: true },
                },
              },
            },
          },
        },
      },
    });

    if (!newsletter) {
      throw new NotFoundException('No se encontro el newsletter solicitado.');
    }

    const reviewLogs = await this.getReviewLogs(newsletter.id);
    const activeBlockComments = this.buildActiveBlockComments(reviewLogs);
    const blocks = await Promise.all(
      newsletter.newsletter_blocks.map((block) =>
        this.toBlockDto(
          block,
          newsletter.state === newsletter_state.CHANGES_REQUESTED
            ? (activeBlockComments.get(block.block_content_id) ?? null)
            : null,
        ),
      ),
    );

    return {
      id: newsletter.id,
      title: this.resolveNewsletterTitle(
        newsletter.title,
        newsletter.generation_content,
      ),
      authorName: this.formatUserName(
        newsletter.users_newsletters_created_by_user_idTousers,
      ),
      area: newsletter.areas?.name ?? null,
      creatorUserId: newsletter.created_by_user_id ?? '',
      state: newsletter.state,
      format: newsletter.format,
      templateId: newsletter.template_id ?? '',
      brandKitId: newsletter.brand_kit_id ?? '',
      blocks,
      comment: null,
      generationRequest: this.readOriginalContent(
        newsletter.generation_content,
      ),
      generationContent: newsletter.generation_content,
      renderedHtml: null,
      createdAt: newsletter.created_at.toISOString(),
      updatedAt: newsletter.updated_at.toISOString(),
      reviewRounds:
        newsletter.state === newsletter_state.APPROVED
          ? []
          : reviewLogs.map((reviewLog) => this.toReviewRound(reviewLog)),
    };
  }

  async update(id: string, body: UpdateNewsletterBody) {
    const existing = await this.prisma.newsletters.findFirst({
      where: { id, deleted_at: null },
      select: { id: true, state: true },
    });

    if (!existing) {
      throw new NotFoundException('No se encontro el newsletter solicitado.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.newsletters.update({
        where: { id },
        data: {
          title: body.title,
          area_id: body.areaId,
          theme_tag: body.themeTag,
          publish_date: body.publishDate
            ? new Date(body.publishDate)
            : undefined,
          brand_kit_id: body.brandKitId,
          template_id: body.templateId,
          approved_by_user_id: body.approvedByUserId,
          state: body.state,
          language: body.language,
          format: body.format,
          generation_content: body.generationContent
            ? this.toGenerationContentJson(body)
            : undefined,
        },
      });

      if (body.blocks) {
        const changedBlockIds = await this.replaceBlocks(tx, id, body.blocks);

        if (
          existing.state === newsletter_state.CHANGES_REQUESTED &&
          changedBlockIds.length > 0
        ) {
          await tx.commentary.updateMany({
            where: {
              block_content_id: {
                in: changedBlockIds,
              },
              deleted_at: null,
              show: true,
            },
            data: {
              deleted_at: new Date(),
              show: false,
            },
          });
        }
      }

      if (body.state && body.state !== existing.state) {
        await tx.newsletter_state_log.create({
          data: {
            newsletter_id: id,
            previous_state: existing.state,
            new_state: body.state,
          },
        });
      }
    });

    return this.getById(id);
  }

  async delete(id: string) {
    const newsletter = await this.prisma.newsletters.findFirst({
      where: { id, deleted_at: null },
      select: { id: true },
    });

    if (!newsletter) {
      throw new NotFoundException(`Newsletter ${id} no encontrado`);
    }

    await this.prisma.newsletters.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await this.notificationsService.notifyNewsletterDeleted(id);

    return { success: true };
  }

  async updateStatus(id: string, body: UpdateNewsletterStatusBody) {
    const newsletter = await this.prisma.newsletters.findUnique({
      where: { id },
    });

    if (!newsletter) {
      throw new NotFoundException(`Newsletter ${id} no encontrado`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.newsletters.update({
        where: { id },
        data: { state: body.state },
      });

      await tx.newsletter_state_log.create({
        data: {
          newsletter_id: id,
          previous_state: body.previousState ?? newsletter.state,
          new_state: body.state,
          reviewed_by_user_id: body.reviewedByUserId ?? null,
          all_commentaries: body.allCommentaries ?? null,
        },
      });
    });
    await this.notificationsService.notifyNewsletterStateChange(id, body.state);

    return this.getById(id);
  }

  async requestChanges(
    id: string,
    payload: {
      reviewedByUserId?: string;
      blockComments: ReviewBlockComment[];
    },
  ) {
    await this.prisma.$transaction(async (tx) => {
      const newsletter = await tx.newsletters.findFirst({
        where: { id, deleted_at: null },
        select: {
          id: true,
          state: true,
          newsletter_blocks: {
            where: { deleted_at: null },
            select: {
              block_content_id: true,
            },
          },
        },
      });

      if (!newsletter) {
        throw new NotFoundException('No se encontro el newsletter solicitado.');
      }

      if (
        newsletter.state !== newsletter_state.IN_REVIEW &&
        newsletter.state !== newsletter_state.RESUBMITTED
      ) {
        throw new BadRequestException(
          'Solo se pueden solicitar cambios para newsletters en revision o reenviados.',
        );
      }

      const normalizedComments = this.normalizeReviewComments(
        payload.blockComments,
      );
      const allowedBlockIds = new Set(
        newsletter.newsletter_blocks.map((block) => block.block_content_id),
      );

      for (const comment of normalizedComments) {
        if (!allowedBlockIds.has(comment.blockId)) {
          throw new BadRequestException(
            'Uno de los comentarios apunta a un bloque inexistente en el newsletter.',
          );
        }
      }

      await tx.newsletter_state_log.create({
        data: {
          newsletter_id: id,
          previous_state: newsletter.state,
          new_state: newsletter_state.CHANGES_REQUESTED,
          reviewed_by_user_id: payload.reviewedByUserId ?? null,
          all_commentaries: JSON.stringify(normalizedComments),
        },
      });

      await tx.commentary.updateMany({
        where: {
          block_content_id: {
            in: newsletter.newsletter_blocks.map(
              (block) => block.block_content_id,
            ),
          },
          deleted_at: null,
        },
        data: {
          deleted_at: new Date(),
          show: false,
        },
      });

      for (const comment of normalizedComments) {
        await tx.commentary.create({
          data: {
            block_content_id: comment.blockId,
            commented_by_user_id: payload.reviewedByUserId ?? null,
            show: true,
            content: comment.content,
          },
        });
      }

      await tx.newsletters.update({
        where: { id },
        data: {
          state: newsletter_state.CHANGES_REQUESTED,
        },
      });
    });

    await this.notificationsService.notifyNewsletterStateChange(
      id,
      newsletter_state.CHANGES_REQUESTED,
    );

    return this.getById(id);
  }

  async approveReview(
    id: string,
    payload: {
      reviewedByUserId?: string;
    },
  ) {
    await this.prisma.$transaction(async (tx) => {
      const newsletter = await tx.newsletters.findFirst({
        where: { id, deleted_at: null },
        select: {
          id: true,
          state: true,
        },
      });

      if (!newsletter) {
        throw new NotFoundException('No se encontro el newsletter solicitado.');
      }

      if (
        newsletter.state !== newsletter_state.IN_REVIEW &&
        newsletter.state !== newsletter_state.RESUBMITTED
      ) {
        throw new BadRequestException(
          'Solo se pueden aprobar newsletters en revision o reenviados.',
        );
      }

      await tx.newsletters.update({
        where: { id },
        data: {
          state: newsletter_state.APPROVED,
          approved_by_user_id: payload.reviewedByUserId ?? null,
        },
      });

      await tx.newsletter_state_log.create({
        data: {
          newsletter_id: id,
          previous_state: newsletter.state,
          new_state: newsletter_state.APPROVED,
          reviewed_by_user_id: payload.reviewedByUserId ?? null,
        },
      });
    });

    await this.notificationsService.notifyNewsletterStateChange(
      id,
      newsletter_state.APPROVED,
    );

    return this.getById(id);
  }

  async discardNewsletter(
    id: string,
    payload: {
      reviewedByUserId?: string;
    },
  ) {
    await this.prisma.$transaction(async (tx) => {
      const newsletter = await tx.newsletters.findFirst({
        where: { id, deleted_at: null },
        select: {
          id: true,
          state: true,
        },
      });

      if (!newsletter) {
        throw new NotFoundException('No se encontro el newsletter solicitado.');
      }

      await tx.newsletters.update({
        where: { id },
        data: {
          state: newsletter_state.DISCARDED,
        },
      });

      await tx.newsletter_state_log.create({
        data: {
          newsletter_id: id,
          previous_state: newsletter.state,
          new_state: newsletter_state.DISCARDED,
          reviewed_by_user_id: payload.reviewedByUserId ?? null,
        },
      });
    });

    await this.notificationsService.notifyNewsletterStateChange(
      id,
      newsletter_state.DISCARDED,
    );

    return this.getById(id);
  }

  getComments(id: string) {
    return 'Desde comments newsletters con ID' + id;
  }

  addComment(id: string) {
    return 'Desde add comment newsletters con ID' + id;
  }

  updateComment(id: string, commentId: string) {
    return `Desde update comment newsletters con ID ${id} y commentId ${commentId}`;
  }

  updateExports(id: string, exportId: string) {
    return `Desde update exports newsletters con ID ${id} y exportId ${exportId}`;
  }

  getExports(id: string) {
    return `Desde export newsletter con ID ${id}`;
  }

  async exportEml(
    id: string,
    snapshots: EmailBlockSnapshotInput[] = [],
  ): Promise<{ filename: string; content: Buffer }> {
    const newsletter = await this.getById(id);
    const attachments = await this.buildEmailInlineAttachments(
      newsletter.blocks,
      snapshots,
    );
    const mjml = this.buildNewsletterEmailMjml(
      newsletter.title || 'Newsletter',
      newsletter.format,
      newsletter.blocks,
      attachments.cidByAssetId,
      attachments.snapshotByBlockId,
    );
    const html = await renderMjml(mjml);
    const content = await this.buildEmlMessage(
      newsletter.title || 'Newsletter Nestle',
      html,
      attachments.files,
    );

    return {
      filename: `${this.toSafeFilename(newsletter.title || 'newsletter')}.eml`,
      content,
    };
  }

  private buildNewsletterEmailMjml(
    title: string,
    format: 'PORTRAIT' | 'LANDSCAPE',
    blocks: NewsletterBlockDto[],
    cidByAssetId: Map<string, string>,
    snapshotByBlockId: Map<
      string,
      {
        cid: string;
        width: number;
        height: number;
      }
    >,
  ): string {
    const rows = this.groupEmailBlocksByRow(blocks);
    const emailWidth = format === 'LANDSCAPE' ? 1400 : 700;

    const body = rows
      .map((rowBlocks) => {
        const columns = rowBlocks
          .map((block) =>
            renderNewsletterEmailBlock(block, {
              cidByAssetId,
              emailWidth,
              snapshotByBlockId,
              fallback: this.renderEmailBlock.bind(this),
            }),
          )
          .join('\n');

        return `
          <mj-section padding="0">
            ${columns}
          </mj-section>
        `;
      })
      .join('\n');

    return `
      <mjml>
        <mj-head>
          <mj-title>${this.escapeHtml(title)}</mj-title>
          <mj-preview>${this.escapeHtml(title)}</mj-preview>
          <mj-attributes>
            <mj-all font-family="Arial, sans-serif" />
            <mj-text color="#30261D" font-size="16px" line-height="1.4" />
          </mj-attributes>
        </mj-head>
        <mj-body background-color="#ffffff" width="${emailWidth}px">
          ${body}
        </mj-body>
      </mjml>
    `;
  }

  private groupEmailBlocksByRow(
    blocks: NewsletterBlockDto[],
  ): NewsletterBlockDto[][] {
    const rows = new Map<number, NewsletterBlockDto[]>();

    for (const block of blocks) {
      rows.set(block.row, [...(rows.get(block.row) ?? []), block]);
    }

    return Array.from(rows.entries())
      .sort(([leftRow], [rightRow]) => leftRow - rightRow)
      .map(([, rowBlocks]) =>
        rowBlocks.sort((left, right) => left.gridColumn - right.gridColumn),
      );
  }

  private renderEmailBlock(
    block: NewsletterBlockDto,
    cidByAssetId: Map<string, string>,
  ): string {
    const values = parseBlockValues(block.content);
    const assetByField = new Map(
      block.assetBindings.map((binding) => [binding.fieldKey, binding]),
    );

    const bgColor = this.escapeHtml(values.bgColor ?? '#ffffff');
    const text =
      values.text ??
      values.title ??
      values.subtitle ??
      values.label ??
      values.bodyText ??
      '';

    const imageBinding =
      assetByField.get('imageAsset') ??
      assetByField.get('backgroundAsset') ??
      assetByField.get('logoAsset') ??
      assetByField.get('leftLogoAsset') ??
      assetByField.get('rightLogoAsset');

    const imageCid = imageBinding
      ? cidByAssetId.get(imageBinding.assetId)
      : undefined;

    const imageUrl = imageCid
      ? `cid:${imageCid}`
      : (imageBinding?.assetUrl ?? '');

    if (block.type === 'ctaFull' || block.type === 'ctaAlternative') {
      const buttonLabel =
        values.buttonLabel ?? values.label ?? 'call to action';
      const href = values.href ?? '';
      const buttonColor = values.buttonColor ?? values.bgColor ?? '#FF595A';
      const buttonTextColor =
        values.buttonTextColor ?? values.textColor ?? '#ffffff';

      return `
        <mj-section background-color="${bgColor}" padding="16px">
          <mj-column>
            <mj-button
              href="${this.escapeHtml(href)}"
              background-color="${this.escapeHtml(buttonColor)}"
              color="${this.escapeHtml(buttonTextColor)}"
              border-radius="8px"
              font-weight="700"
              padding="12px 24px"
            >
              ${this.escapeHtml(buttonLabel)}
            </mj-button>
          </mj-column>
        </mj-section>
      `;
    }

    if (imageUrl) {
      return `
        <mj-section background-color="${bgColor}" padding="0">
          <mj-column>
            <mj-image
              src="${this.escapeHtml(imageUrl)}"
              padding="0"
              fluid-on-mobile="true"
            />
            ${
              text
                ? `<mj-text padding="16px">${this.escapeHtml(text)}</mj-text>`
                : ''
            }
          </mj-column>
        </mj-section>
      `;
    }

    return `
      <mj-section background-color="${bgColor}" padding="16px">
        <mj-column>
          <mj-text>${this.escapeHtml(text)}</mj-text>
        </mj-column>
      </mj-section>
    `;
  }

  private async buildEmailInlineAttachments(
    blocks: NewsletterBlockDto[],
    snapshots: EmailBlockSnapshotInput[] = [],
  ): Promise<{
    files: EmailInlineAttachment[];
    cidByAssetId: Map<string, string>;
    snapshotByBlockId: Map<
      string,
      {
        cid: string;
        width: number;
        height: number;
      }
    >;
  }> {
    const cidByAssetId = new Map<string, string>();
    const snapshotByBlockId = new Map<
      string,
      {
        cid: string;
        width: number;
        height: number;
      }
    >();
    const files: EmailInlineAttachment[] = [];
    const uniqueBindings = new Map<
      string,
      NewsletterBlockDto['assetBindings'][number]
    >();

    let snapshotIndex = 0;
    for (const snapshot of snapshots) {
      const parsedSnapshot = this.dataUrlToBuffer(snapshot.dataUrl);

      if (!parsedSnapshot) {
        continue;
      }

      const cid = `newsletter-block-snapshot-${snapshotIndex}@nestle-ai-newsletter`;

      snapshotByBlockId.set(snapshot.blockId, {
        cid,
        width: snapshot.width,
        height: snapshot.height,
      });
      files.push({
        filename: `block-${snapshot.blockId}.png`,
        content: parsedSnapshot.content,
        cid,
        contentType: parsedSnapshot.contentType,
      });

      snapshotIndex += 1;
    }

    for (const block of blocks) {
      for (const binding of block.assetBindings) {
        if (!binding.bucket || !binding.objectKey) {
          continue;
        }

        if (!uniqueBindings.has(binding.assetId)) {
          uniqueBindings.set(binding.assetId, binding);
        }
      }
    }

    let index = 0;

    for (const binding of uniqueBindings.values()) {
      try {
        const content = await this.storageService.getObjectBuffer(
          binding.bucket!,
          binding.objectKey!,
        );
        const cid = `newsletter-asset-${index}@nestle-ai-newsletter`;
        const filename =
          binding.fileName ||
          `${binding.assetName || `asset-${index}`}.${this.extensionFromMimeType(binding.mimeType)}`;

        cidByAssetId.set(binding.assetId, cid);
        files.push({
          filename,
          content,
          cid,
          contentType: binding.mimeType ?? undefined,
        });

        index += 1;
      } catch {
        continue;
      }
    }

    return {
      files,
      cidByAssetId,
      snapshotByBlockId,
    };
  }

  private dataUrlToBuffer(
    dataUrl: string,
  ): { content: Buffer; contentType: string } | null {
    const match = dataUrl.match(/^data:(image\/png|image\/jpeg);base64,(.+)$/);

    if (!match) {
      return null;
    }

    return {
      contentType: match[1],
      content: Buffer.from(match[2], 'base64'),
    };
  }

  private extensionFromMimeType(mimeType: string | null | undefined): string {
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/jpeg') return 'jpg';
    if (mimeType === 'image/gif') return 'gif';
    if (mimeType === 'image/svg+xml') return 'svg';
    if (mimeType === 'image/webp') return 'webp';

    return 'bin';
  }

  private buildEmlMessage(
    subject: string,
    html: string,
    attachments: EmailInlineAttachment[] = [],
  ): Promise<Buffer> {
    const mail = new MailComposer({
      from: '',
      to: '',
      subject,
      html,
      text: subject,
      headers: {
        'X-Unsent': '1',
      },
      attachments,
    });

    return new Promise((resolve, reject) => {
      mail.compile().build((error, message) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(message);
      });
    });
  }

  private toSafeFilename(value: string): string {
    const sanitized = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '');

    return sanitized || 'newsletter';
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private async replaceBlocks(
    tx: Prisma.TransactionClient,
    newsletterId: string,
    blocks: NewsletterEditableBlock[],
  ): Promise<string[]> {
    const existingBlocks = await tx.newsletter_blocks.findMany({
      where: {
        newsletter_id: newsletterId,
        deleted_at: null,
      },
      include: {
        block_content: {
          include: {
            assets_block: {
              where: { deleted_at: null },
            },
          },
        },
      },
    });
    const existingById = new Map<string, ExistingEditableBlock>(
      existingBlocks.map((block) => [block.block_content_id, block]),
    );
    const retainedBlockIds = new Set<string>();
    const changedBlockIds = new Set<string>();

    for (const block of blocks) {
      const persistedBlock = this.toPersistedBlock(block);
      const matchedBlock = existingById.get(persistedBlock.id);

      if (matchedBlock) {
        retainedBlockIds.add(matchedBlock.block_content_id);

        if (this.hasBlockChanged(matchedBlock, persistedBlock)) {
          changedBlockIds.add(matchedBlock.block_content_id);
        }

        await tx.block_content.update({
          where: {
            id: matchedBlock.block_content_id,
          },
          data: {
            block_type: persistedBlock.type,
            content: persistedBlock.content ?? null,
            display_order: persistedBlock.displayOrder ?? null,
            must_fill: persistedBlock.mustFill ?? false,
            type: this.toBlockContentType(persistedBlock),
            deleted_at: null,
          },
        });

        await tx.newsletter_blocks.updateMany({
          where: {
            newsletter_id: newsletterId,
            block_content_id: matchedBlock.block_content_id,
          },
          data: {
            display_order: persistedBlock.displayOrder ?? null,
            row: persistedBlock.row ?? null,
            grid_column: persistedBlock.gridColumn ?? null,
            deleted_at: null,
          },
        });

        await tx.assets_block.updateMany({
          where: {
            block_id: matchedBlock.block_content_id,
            deleted_at: null,
          },
          data: {
            deleted_at: new Date(),
          },
        });

        await this.createAssetBindings(
          tx,
          matchedBlock.block_content_id,
          persistedBlock.assetBindings ?? [],
        );
        continue;
      }

      const contentRecord = await tx.block_content.create({
        data: {
          block_type: persistedBlock.type,
          content: persistedBlock.content ?? null,
          display_order: persistedBlock.displayOrder ?? null,
          must_fill: persistedBlock.mustFill ?? false,
          type: this.toBlockContentType(persistedBlock),
        },
        select: { id: true },
      });

      retainedBlockIds.add(contentRecord.id);

      await tx.newsletter_blocks.create({
        data: {
          newsletter_id: newsletterId,
          block_content_id: contentRecord.id,
          display_order: persistedBlock.displayOrder ?? null,
          row: persistedBlock.row ?? null,
          grid_column: persistedBlock.gridColumn ?? null,
        },
      });

      await this.createAssetBindings(
        tx,
        contentRecord.id,
        persistedBlock.assetBindings ?? [],
      );
    }

    const removedBlockContentIds = existingBlocks
      .map((block) => block.block_content_id)
      .filter((blockContentId) => !retainedBlockIds.has(blockContentId));

    if (removedBlockContentIds.length === 0) {
      return Array.from(changedBlockIds);
    }

    await tx.newsletter_blocks.updateMany({
      where: {
        newsletter_id: newsletterId,
        block_content_id: {
          in: removedBlockContentIds,
        },
        deleted_at: null,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    await tx.assets_block.updateMany({
      where: {
        block_id: {
          in: removedBlockContentIds,
        },
        deleted_at: null,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    await tx.block_content.updateMany({
      where: {
        id: {
          in: removedBlockContentIds,
        },
        deleted_at: null,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    return Array.from(changedBlockIds);
  }

  private hasBlockChanged(
    existingBlock: ExistingEditableBlock,
    nextBlock: NewsletterEditableBlock,
  ): boolean {
    const currentAssetBindings = existingBlock.block_content.assets_block
      .map((assetBinding) => ({
        fieldKey: assetBinding.field_key,
        assetId: assetBinding.asset_id,
        keywordText: assetBinding.keyword_text ?? null,
      }))
      .sort((left, right) => this.compareAssetBinding(left, right));

    const nextAssetBindings = [...(nextBlock.assetBindings ?? [])]
      .map((assetBinding) => ({
        fieldKey: assetBinding.fieldKey,
        assetId: assetBinding.assetId,
        keywordText: assetBinding.keywordText ?? null,
      }))
      .sort((left, right) => this.compareAssetBinding(left, right));

    return (
      existingBlock.block_content.block_type !== nextBlock.type ||
      (existingBlock.block_content.content ?? null) !==
        (nextBlock.content ?? null) ||
      (existingBlock.display_order ?? null) !==
        (nextBlock.displayOrder ?? null) ||
      (existingBlock.row ?? null) !== (nextBlock.row ?? null) ||
      (existingBlock.grid_column ?? null) !== (nextBlock.gridColumn ?? null) ||
      existingBlock.block_content.must_fill !== (nextBlock.mustFill ?? false) ||
      this.toBlockContentType(nextBlock) !== existingBlock.block_content.type ||
      JSON.stringify(currentAssetBindings) !== JSON.stringify(nextAssetBindings)
    );
  }

  private compareAssetBinding(
    left: { fieldKey: string; assetId: string; keywordText: string | null },
    right: { fieldKey: string; assetId: string; keywordText: string | null },
  ): number {
    const leftKey = `${left.fieldKey}:${left.assetId}:${left.keywordText ?? ''}`;
    const rightKey = `${right.fieldKey}:${right.assetId}:${right.keywordText ?? ''}`;

    return leftKey.localeCompare(rightKey);
  }

  private async createAssetBindings(
    tx: Prisma.TransactionClient,
    blockContentId: string,
    assetBindings: NonNullable<NewsletterEditableBlock['assetBindings']>,
  ): Promise<void> {
    for (const assetBinding of assetBindings) {
      await tx.assets_block.create({
        data: {
          block_id: blockContentId,
          asset_id: assetBinding.assetId,
          field_key: assetBinding.fieldKey,
          keyword_text: assetBinding.keywordText ?? null,
        },
      });
    }
  }

  private toPersistedBlock(
    block: NewsletterEditableBlock,
  ): NewsletterEditableBlock {
    return {
      id: block.id,
      type: block.type,
      category: block.category,
      name: block.name,
      content: block.content ?? null,
      row: block.row,
      gridColumn: block.gridColumn,
      displayOrder: block.displayOrder,
      mustFill: block.mustFill,
      comment: block.comment,
      assetBindings: (block.assetBindings ?? []).map((binding) => ({
        fieldKey: binding.fieldKey,
        assetId: binding.assetId,
        keywordText: binding.keywordText ?? null,
      })),
    };
  }

  private async toBlockDto(
    block: PersistedNewsletterBlock,
    activeComment: string | null,
  ): Promise<NewsletterBlockDto> {
    const editFields = getBlockEditFields(block.block_content.block_type);
    const values = parseBlockValues(block.block_content.content);
    const assetBindings = await Promise.all(
      block.block_content.assets_block.map(async (assetBlock) => {
        return {
          fieldKey: assetBlock.field_key,
          assetId: assetBlock.assets.id,
          assetName: assetBlock.assets.name,
          assetUrl: await this.getAssetPreviewUrl(
            {
              type: assetBlock.assets.type,
              bucket: assetBlock.assets.bucket,
              objectKey: assetBlock.assets.object_key,
            },
            assetBlock.keyword_text,
          ),
          assetType: assetBlock.assets
            .type as NewsletterBlockDto['assetBindings'][number]['assetType'],
          bucket: assetBlock.assets.bucket,
          objectKey: assetBlock.assets.object_key,
          fileName: assetBlock.assets.file_name,
          mimeType: assetBlock.assets.mime_type,
          keywordText: assetBlock.keyword_text,
        };
      }),
    );

    const definitionFields = editFields.map((field) => field.key);
    const filteredValues = Object.fromEntries(
      Object.entries(values).filter(
        ([key]) =>
          definitionFields.includes(key) ||
          key === 'fontId' ||
          key.endsWith('FontSize') ||
          key.endsWith('FontFamily') ||
          key.endsWith('FontId'),
      ),
    );

    return {
      id: block.block_content.id,
      type: block.block_content.block_type,
      category: block.block_content.type,
      name: getBlockDefinition(block.block_content.block_type).label,
      content:
        Object.keys(filteredValues).length > 0
          ? JSON.stringify(filteredValues)
          : null,
      row: block.row ?? 0,
      gridColumn: block.grid_column ?? 0,
      displayOrder:
        block.display_order ?? block.block_content.display_order ?? 0,
      mustFill: block.block_content.must_fill,
      comment: activeComment,
      editFields,
      assetBindings,
    };
  }

  private toReviewRound(reviewLog: ReviewLogRecord) {
    const storedComments = this.parseStoredReviewComments(
      reviewLog.all_commentaries,
    );

    return {
      id: reviewLog.id,
      createdAt: reviewLog.created_at.toISOString(),
      reviewerUserId: reviewLog.users?.id ?? '',
      reviewerName: this.formatUserName(reviewLog.users),
      fromState: reviewLog.previous_state,
      toState: reviewLog.new_state,
      comments: storedComments.map((comment, index) => ({
        id: `${reviewLog.id}-${index}`,
        blockId: comment.blockId,
        content: comment.content,
        commentedAt: reviewLog.created_at.toISOString(),
        commentedByUserId: reviewLog.users?.id ?? '',
        commentedByName: this.formatUserName(reviewLog.users),
        reviewRoundId: reviewLog.id,
      })),
    };
  }

  private buildActiveBlockComments(
    reviewLogs: ReviewLogRecord[],
  ): Map<string, string> {
    const latestReviewLog = reviewLogs[0];

    if (!latestReviewLog) {
      return new Map<string, string>();
    }

    return new Map(
      this.parseStoredReviewComments(latestReviewLog.all_commentaries).map(
        (comment) => [comment.blockId, comment.content],
      ),
    );
  }

  private async getReviewLogs(
    newsletterId: string,
  ): Promise<ReviewLogRecord[]> {
    return this.prisma.newsletter_state_log.findMany({
      where: {
        newsletter_id: newsletterId,
        new_state: newsletter_state.CHANGES_REQUESTED,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  private parseStoredReviewComments(
    rawComments: string | null,
  ): StoredReviewComment[] {
    if (!rawComments) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawComments) as unknown;

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.flatMap((entry) => {
        if (
          !entry ||
          typeof entry !== 'object' ||
          Array.isArray(entry) ||
          typeof entry.blockId !== 'string' ||
          typeof entry.content !== 'string'
        ) {
          return [];
        }

        const normalizedContent = entry.content.trim();

        if (!normalizedContent) {
          return [];
        }

        return [
          {
            blockId: entry.blockId,
            content: normalizedContent,
          },
        ];
      });
    } catch {
      return [];
    }
  }

  private normalizeReviewComments(blockComments: ReviewBlockComment[]) {
    const latestByBlockId = new Map<string, string>();

    for (const blockComment of blockComments) {
      const normalizedContent = blockComment.content.trim();

      if (normalizedContent.length === 0) {
        continue;
      }

      latestByBlockId.set(blockComment.blockId, normalizedContent);
    }

    if (latestByBlockId.size === 0) {
      throw new BadRequestException(
        'Debe indicar al menos un comentario no vacío antes de solicitar cambios.',
      );
    }

    return Array.from(latestByBlockId.entries()).map(([blockId, content]) => ({
      blockId,
      content,
    }));
  }

  private resolveNewsletterTitle(
    title: string | null | undefined,
    generationContent: Prisma.JsonValue | null,
  ): string {
    if (typeof title === 'string' && title.trim().length > 0) {
      return title;
    }

    const originalContent = this.readOriginalContent(generationContent);

    if (
      originalContent &&
      typeof originalContent === 'object' &&
      !Array.isArray(originalContent) &&
      typeof originalContent.topic === 'string' &&
      originalContent.topic.trim().length > 0
    ) {
      return originalContent.topic;
    }

    return title ?? '';
  }

  private formatUserName(
    user: { name: string | null; last_name: string | null } | null | undefined,
  ): string {
    const fullName = [user?.name ?? '', user?.last_name ?? '']
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' ');

    return fullName || 'Sin autor';
  }

  private toBlockContentType(
    block: NewsletterEditableBlock,
  ): block_content_type {
    const category = block.category?.toUpperCase();

    if (this.isBlockContentType(category)) {
      return category;
    }

    if (block.type.toLowerCase().includes('image')) {
      return block_content_type.MULTIMEDIA;
    }

    if (block.type.toLowerCase().includes('header')) {
      return block_content_type.LAYOUT;
    }

    if (block.type.toLowerCase().includes('icon')) {
      return block_content_type.ICONS;
    }

    if (block.type.toLowerCase().includes('cta')) {
      return block_content_type.BASE;
    }

    return block_content_type.CONTENT;
  }

  private isBlockContentType(
    value: string | undefined,
  ): value is block_content_type {
    return (
      value === block_content_type.LAYOUT ||
      value === block_content_type.BASE ||
      value === block_content_type.DIVIDER ||
      value === block_content_type.CONTENT ||
      value === block_content_type.MULTIMEDIA ||
      value === block_content_type.ICONS ||
      value === block_content_type.SPECIAL
    );
  }

  private async getAssetPreviewUrl(
    asset: { type: asset_type; bucket: string; objectKey: string },
    keywordText: string | null,
  ): Promise<string> {
    if (asset.type !== asset_type.KEYWORD) {
      return this.storageService.getSignedUrl(asset.bucket, asset.objectKey);
    }

    const svgTemplate = await this.getKeywordSvgTemplate(
      asset.bucket,
      asset.objectKey,
    );
    const svgMarkup = this.applyKeywordText(svgTemplate, keywordText);

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarkup)}`;
  }

  private applyKeywordText(
    svgTemplate: string,
    keywordText: string | null,
  ): string {
    const text = this.escapeXml(keywordText?.trim() || 'Editar');
    const editableTextPattern =
      /(<text\b[^>]*\bid=(["'])editable-text\2[^>]*>)([\s\S]*?)(<\/text>)/i;

    if (editableTextPattern.test(svgTemplate)) {
      return svgTemplate.replace(editableTextPattern, `$1${text}$4`);
    }

    const textGroupPattern =
      /(<g\b[^>]*\bid=(["'])Text\2[^>]*>)([\s\S]*?)(<\/g>)/i;

    if (!textGroupPattern.test(svgTemplate)) {
      return svgTemplate;
    }

    const textNode = [
      '<text id="editable-text" class="cls-1" x="443.585" y="78.08"',
      ' text-anchor="middle" dominant-baseline="middle"',
      ' font-family="system-ui, sans-serif" font-size="56" font-weight="700">',
      text,
      '</text>',
    ].join('');

    return svgTemplate.replace(textGroupPattern, `$1${textNode}$4`);
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private getKeywordSvgTemplate(
    bucket: string,
    objectKey: string,
  ): Promise<string> {
    const cacheKey = `${bucket}:${objectKey}`;
    const cachedTemplate = this.keywordSvgTemplateCache.get(cacheKey);

    if (cachedTemplate) {
      return cachedTemplate;
    }

    const templatePromise = this.storageService
      .getObjectText(bucket, objectKey)
      .catch((error: unknown) => {
        this.keywordSvgTemplateCache.delete(cacheKey);
        throw error;
      });

    this.keywordSvgTemplateCache.set(cacheKey, templatePromise);
    return templatePromise;
  }

  private toGenerationContentJson(
    body: Pick<CreateNewsletterBody, 'generationContent'>,
  ): Prisma.InputJsonValue | undefined {
    if (!body.generationContent) {
      return undefined;
    }

    return {
      aiContent: body.generationContent.aiContent,
      originalContent: body.generationContent.originalContent,
    } as Prisma.InputJsonValue;
  }

  private readOriginalContent(
    value: Prisma.JsonValue,
  ): Prisma.JsonValue | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const originalContent = value.originalContent;

    return originalContent === undefined ? null : originalContent;
  }

  private async resolveUserId(
    userId: string | undefined,
  ): Promise<string | null> {
    if (!userId || !uuidPattern.test(userId)) {
      return null;
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return null;
    }

    return user.id;
  }
}
