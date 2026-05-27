import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import puppeteer from 'puppeteer';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { renderMjml } from '../newsletters/utils/renderMjml';
 
// ── Tipos ─────────────────────────────────────────────────────────────────────
 
export type ExportFormat = 'PDF' | 'JPG' | 'EML';
 
export interface ExportResult {
  url: string;
  fileName: string;
  format: ExportFormat;
}
 
interface BlockContent {
  content: string | null;
  type: string;
  display_order: number | null;
}
 
// ── Helpers MJML ──────────────────────────────────────────────────────────────
 
function blocksToMjml(blocks: BlockContent[]): string {
  const sorted = [...blocks].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );
 
  const sections = sorted
    .map((block) => {
      const text = block.content ?? '';
      const bgColor = block.type === 'CONTENT' ? '#FFFFFF' : '#F8F5F2';
 
      return `
      <mj-section background-color="${bgColor}" padding="16px 24px">
        <mj-column>
          <mj-text font-family="Arial, sans-serif" font-size="16px" color="#30261D" line-height="1.6">
            ${text}
          </mj-text>
        </mj-column>
      </mj-section>`;
    })
    .join('\n');
 
  return `
    <mjml>
      <mj-head>
        <mj-attributes>
          <mj-all font-family="Arial, sans-serif" />
        </mj-attributes>
        <mj-style>
          body { margin: 0; padding: 0; background-color: #F8F5F2; }
        </mj-style>
      </mj-head>
      <mj-body background-color="#F8F5F2" width="680px">
        <mj-section background-color="#FF595A" padding="24px">
          <mj-column>
            <mj-text color="#FFFFFF" font-size="24px" font-weight="bold" font-family="Arial, sans-serif">
              Newsletter Nestlé
            </mj-text>
          </mj-column>
        </mj-section>
        ${sections}
      </mj-body>
    </mjml>
  `;
}
 
// ── Servicio ──────────────────────────────────────────────────────────────────
 
@Injectable()
export class NewsletterExportService {
  private readonly logger = new Logger(NewsletterExportService.name);
 
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}
 
  async exportNewsletter(
    newsletterId: string,
    format: ExportFormat,
    requestedByUserId?: string,
  ): Promise<ExportResult> {
    // 1. Verificar que el newsletter existe y está aprobado
    const newsletter = await this.prisma.newsletters.findUnique({
      where: { id: newsletterId },
    });
 
    if (!newsletter) {
      throw new NotFoundException(`Newsletter ${newsletterId} no encontrado.`);
    }
 
    // 2. Buscar si ya existe un export de ese formato en la DB
    const existingExport = await this.findExistingExport(newsletterId, format);
    if (existingExport) {
      this.logger.log(`Export ${format} ya existe para newsletter ${newsletterId}, devolviendo URL existente.`);
      const url = await this.storageService.getSignedUrl(
        existingExport.bucket,
        existingExport.object_key,
      );
      return { url, fileName: existingExport.file_name, format };
    }
 
    // 3. Buscar los bloques del newsletter
    const blocks = await this.getNewsletterBlocks(newsletterId);
 
    // 4. Generar HTML desde los bloques via MJML
    const mjml = blocksToMjml(blocks);
    const html = await renderMjml(mjml);
 
    // 5. Generar el archivo según el formato
    const { buffer, mimeType, extension } = await this.generateFile(html, format);
 
    // 6. Subir a MinIO
    const bucket = this.storageService.getExportsBucket();
    const objectKey = `exports/${newsletterId}/${randomUUID()}.${extension}`;
    const fileName = `newsletter-${newsletterId}.${extension}`;
 
    await this.storageService.uploadObject(bucket, objectKey, buffer, mimeType);
 
    // 7. Buscar o crear el tipo de export en la DB
    const exportTypeCode = format; // 'PDF' | 'JPG' | 'EML'
    let exportType = await this.prisma.export_types.findUnique({
      where: { code: exportTypeCode },
    });
 
    if (!exportType) {
      exportType = await this.prisma.export_types.create({
        data: {
          code: exportTypeCode,
          name: exportTypeCode,
        },
      });
    }
 
    // 8. Crear registro en exports
    const exportRecord = await this.prisma.exports.create({
      data: {
        export_type_id: exportType.id,
      },
    });
 
    // 9. Guardar referencia en newsletter_exports
    await this.prisma.newsletter_exports.create({
      data: {
        export_id: exportRecord.id,
        newsletter_id: newsletterId,
        bucket,
        object_key: objectKey,
        object_prefix: `exports/${newsletterId}`,
        file_name: fileName,
        extension,
        mime_type: mimeType,
        size_bytes: buffer.length,
        created_by_user_id: requestedByUserId ?? null,
      },
    });
 
    // 10. Devolver URL firmada para descarga
    const url = await this.storageService.getSignedUrl(bucket, objectKey);
    this.logger.log(`Export ${format} generado para newsletter ${newsletterId}.`);
 
    return { url, fileName, format };
  }
 
  // ── Helpers privados ──────────────────────────────────────────────────────
 
  private async findExistingExport(newsletterId: string, format: ExportFormat) {
    return this.prisma.newsletter_exports.findFirst({
      where: {
        newsletter_id: newsletterId,
        deleted_at: null,
        exports: {
          export_types: {
            code: format,
          },
        },
      },
      include: {
        exports: {
          include: { export_types: true },
        },
      },
    });
  }
 
  private async getNewsletterBlocks(newsletterId: string): Promise<BlockContent[]> {
    const newsletterBlocks = await this.prisma.newsletter_blocks.findMany({
      where: {
        newsletter_id: newsletterId,
        deleted_at: null,
      },
      include: {
        block_content: true,
      },
      orderBy: {
        display_order: 'asc',
      },
    });
 
    if (newsletterBlocks.length === 0) {
      throw new NotFoundException(
        `No se encontraron bloques para el newsletter ${newsletterId}.`,
      );
    }
 
    return newsletterBlocks.map((nb) => ({
      content: nb.block_content.content,
      type: nb.block_content.type,
      display_order: nb.display_order,
    }));
  }
 
  private async generateFile(
    html: string,
    format: ExportFormat,
  ): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
    switch (format) {
      case 'PDF':
        return this.generatePdf(html);
      case 'JPG':
        return this.generateJpg(html);
      case 'EML':
        return this.generateEml(html);
      default:
        throw new ServiceUnavailableException(`Formato ${format} no soportado.`);
    }
  }
 
  private async generatePdf(
    html: string,
  ): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
 
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
 
      return {
        buffer: Buffer.from(pdfBuffer),
        mimeType: 'application/pdf',
        extension: 'pdf',
      };
    } finally {
      await browser.close();
    }
  }
 
  private async generateJpg(
    html: string,
  ): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
 
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 680, height: 800 });
      await page.setContent(html, { waitUntil: 'load' });
 
      const screenshotBuffer = await page.screenshot({
        type: 'jpeg',
        quality: 90,
        fullPage: true,
      });
 
      return {
        buffer: Buffer.from(screenshotBuffer),
        mimeType: 'image/jpeg',
        extension: 'jpg',
      };
    } finally {
      await browser.close();
    }
  }
 
  private generateEml(
    html: string,
  ): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
    const emlContent = [
      'X-Unsent: 1',
      'To: ',
      'Subject: Newsletter Nestlé',
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      html,
    ].join('\r\n');
 
    return Promise.resolve({
      buffer: Buffer.from(emlContent, 'utf-8'),
      mimeType: 'message/rfc822',
      extension: 'eml',
    });
  }
}
