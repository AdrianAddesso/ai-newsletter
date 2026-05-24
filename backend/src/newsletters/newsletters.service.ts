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
import type {
  CreateNewsletterBody,
  NewsletterEditableBlock,
  UpdateNewsletterBody,
  UpdateNewsletterStatusBody,
} from './newsletters.schemas';
import { validateNewsletterStateLogTransition } from './validators/newsletter.validator';

type StoredBlockField = {
  id: string;
  kind: 'text' | 'label' | 'asset';
  label: string;
  value?: string | null;
  assetId?: string | null;
  assetName?: string | null;
  assetUrl?: string | null;
  keywordText?: string | null;
};

type StoredNewsletterBlock = NewsletterEditableBlock & {
  fields: StoredBlockField[];
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

@Injectable()
export class NewsLettersService {
  private readonly keywordSvgTemplateCache = new Map<string, Promise<string>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
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
            select: { name: true, last_name: true },
          },
        },
      }),
      this.prisma.newsletters.count({ where: { deleted_at: null } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
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
        newsletter_blocks: {
          where: { deleted_at: null },
          orderBy: [{ row: 'asc' }, { grid_column: 'asc' }, { display_order: 'asc' }],
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

    const blocks = await Promise.all(
      newsletter.newsletter_blocks.map((block) => this.toBlockDto(block)),
    );

    return {
      id: newsletter.id,
      creatorUserId: newsletter.created_by_user_id ?? '',
      state: newsletter.state,
      templateId: newsletter.template_id ?? '',
      brandKitId: newsletter.brand_kit_id ?? '',
      blocks,
      comment: null,
      generationRequest: this.readOriginalContent(newsletter.generation_content),
      generationContent: newsletter.generation_content,
      renderedHtml: null,
      createdAt: newsletter.created_at.toISOString(),
      updatedAt: newsletter.updated_at.toISOString(),
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
          publish_date: body.publishDate ? new Date(body.publishDate) : undefined,
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
        await this.replaceBlocks(tx, id, body.blocks);
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
    return this.prisma.newsletters.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async updateStatus(id: string, body: UpdateNewsletterStatusBody) {
    const newsletter = await this.prisma.newsletters.findUnique({
      where: { id },
    });
    if (!newsletter) {
      throw new NotFoundException(`Newsletter ${id} no encontrado`);
    }

    await Promise.all([
      this.prisma.newsletters.update({
        where: { id },
        data: { state: body.state },
      }),
      this.prisma.newsletter_state_log.create({
        data: {
          newsletter_id: id,
          previous_state: body.previousState ?? newsletter.state,
          new_state: body.state,
          reviewed_by_user_id: body.reviewedByUserId ?? null,
          all_commentaries: body.allCommentaries ?? null,
        },
      }),
    ]);

    return this.getById(id);
  }

  getLogs(id: string) {
    return 'Desde logs newsletters con ID' + id;
  }

  async addLog(
    id: string,
    logData: {
      previousState?: newsletter_state;
      newState?: newsletter_state;
      reviewedByUserId?: string;
      allCommentaries?: string;
    },
  ) {
    const newsletter = await this.prisma.newsletters.findUnique({
      where: { id },
    });

    if (!newsletter) {
      throw new BadRequestException('Newsletter no encontrada');
    }

    validateNewsletterStateLogTransition(newsletter.state, logData);

    return this.prisma.newsletter_state_log.create({
      data: {
        newsletter_id: id,
        previous_state: logData.previousState,
        new_state: logData.newState,
        reviewed_by_user_id: logData.reviewedByUserId,
        all_commentaries: logData.allCommentaries,
      },
    });
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

  private async replaceBlocks(
    tx: Prisma.TransactionClient,
    newsletterId: string,
    blocks: NewsletterEditableBlock[],
  ): Promise<void> {
    await tx.newsletter_blocks.deleteMany({ where: { newsletter_id: newsletterId } });

    for (const block of blocks) {
      const persistedBlock = this.toPersistedBlock(block);
      const contentRecord = await tx.block_content.create({
        data: {
          content: JSON.stringify(persistedBlock),
          display_order: block.displayOrder ?? null,
          must_fill: block.mustFill ?? false,
          type: this.toBlockContentType(block),
        },
        select: { id: true },
      });

      await tx.newsletter_blocks.create({
        data: {
          newsletter_id: newsletterId,
          block_content_id: contentRecord.id,
          display_order: block.displayOrder ?? null,
          row: block.row ?? null,
          grid_column: block.gridColumn ?? null,
        },
      });

      const assetFields = block.fields.filter(
        (field) => field.kind === 'asset' && field.assetId,
      );

      for (const field of assetFields) {
        await tx.assets_block.create({
          data: {
            block_id: contentRecord.id,
            asset_id: field.assetId as string,
            keyword_text: field.keywordText ?? null,
          },
        });
      }
    }
  }

  private toPersistedBlock(block: NewsletterEditableBlock): NewsletterEditableBlock {
    return {
      ...block,
      fields: block.fields.map((field) => {
        if (field.kind !== 'asset') {
          return field;
        }

        return {
          id: field.id,
          kind: field.kind,
          label: field.label,
          assetId: field.assetId ?? null,
          assetName: field.assetName ?? null,
          keywordText: field.keywordText ?? null,
        };
      }),
    };
  }

  private async toBlockDto(block: {
    display_order: number | null;
    row: number | null;
    grid_column: number | null;
    block_content: {
      id: string;
      content: string | null;
      display_order: number | null;
      must_fill: boolean;
      type: block_content_type;
      assets_block: {
        keyword_text: string | null;
        assets: {
          id: string;
          name: string;
          type: asset_type;
          bucket: string;
          object_key: string;
        };
      }[];
    };
  }): Promise<StoredNewsletterBlock> {
    const parsed = this.parseStoredBlock(block.block_content.content);
    const assetUrls = new Map<
      string,
      { name: string; url: string; keywordText: string | null }
    >();

    await Promise.all(
      block.block_content.assets_block.map(async (assetBlock) => {
        assetUrls.set(assetBlock.assets.id, {
          name: assetBlock.assets.name,
          url: await this.getAssetPreviewUrl(
            {
              type: assetBlock.assets.type,
              bucket: assetBlock.assets.bucket,
              objectKey: assetBlock.assets.object_key,
            },
            assetBlock.keyword_text,
          ),
          keywordText: assetBlock.keyword_text,
        });
      }),
    );

    return {
      ...parsed,
      id: parsed.id || block.block_content.id,
      row: block.row ?? parsed.row,
      gridColumn: block.grid_column ?? parsed.gridColumn,
      displayOrder: block.display_order ?? parsed.displayOrder,
      fields: parsed.fields.map((field) => {
        if (field.kind !== 'asset' || !field.assetId) {
          return field;
        }

        const storedAsset = assetUrls.get(field.assetId);

        return {
          ...field,
          assetName: storedAsset?.name ?? field.assetName ?? null,
          assetUrl: storedAsset?.url ?? null,
          keywordText: storedAsset?.keywordText ?? field.keywordText ?? null,
        };
      }),
    };
  }

  private parseStoredBlock(content: string | null): StoredNewsletterBlock {
    if (!content) {
      return this.emptyStoredBlock();
    }

    try {
      const parsed = JSON.parse(content) as StoredNewsletterBlock;

      if (!parsed.type || !Array.isArray(parsed.fields)) {
        return this.emptyStoredBlock();
      }

      return parsed;
    } catch {
      return this.emptyStoredBlock();
    }
  }

  private emptyStoredBlock(): StoredNewsletterBlock {
    return {
      id: '',
      type: 'textCenterBackgroundFull',
      name: 'Bloque',
      content: null,
      row: 0,
      gridColumn: 0,
      displayOrder: 0,
      mustFill: false,
      comment: null,
      fields: [],
    };
  }

  private toBlockContentType(block: NewsletterEditableBlock): block_content_type {
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

  private isBlockContentType(value: string | undefined): value is block_content_type {
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

  private applyKeywordText(svgTemplate: string, keywordText: string | null): string {
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

  private readOriginalContent(value: Prisma.JsonValue): Prisma.JsonValue | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const originalContent = value.originalContent;

    return originalContent === undefined ? null : originalContent;
  }

  private async resolveUserId(userId: string | undefined): Promise<string | null> {
    if (!userId || !uuidPattern.test(userId)) {
      return null;
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    return user?.id ?? null;
  }
}
