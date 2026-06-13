import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import { basename, extname, relative, resolve, sep } from 'node:path';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { asset_type } from '@prisma/client';
import { AssetsService } from '../src/assets/assets.service';
import { FontsService } from '../src/fonts/fonts.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { StorageService } from '../src/storage/storage.service';

type SeedTarget =
  | { kind: 'asset'; type: asset_type }
  | { kind: 'font' };

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
  providers: [AssetsService, FontsService, StorageService],
})
class AssetSeedScriptModule {}

const assetBucket = process.env.S3_ASSETS_BUCKET?.trim() || 'ai-newsletter-assets';
const fontBucket = process.env.S3_FONTS_BUCKET?.trim() || 'ai-newsletter-fonts';
const sourceDirectory = resolve(process.cwd(), 'assets');

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AssetSeedScriptModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const storage = app.get(StorageService);
    const assets = app.get(AssetsService);
    const fonts = app.get(FontsService);
    const prisma = app.get(PrismaService);
    const filePaths = await listFiles(sourceDirectory);

    let seededAssets = 0;
    let seededFonts = 0;

    for (const absolutePath of filePaths) {
      const relativePath = toRelativePath(absolutePath);
      const target = getTarget(relativePath);
      const storageKey = getStorageKey(relativePath, target);
      const buffer = await readFile(absolutePath);
      const mimeType = getMimeType(absolutePath);

      await storage.uploadObject(
        target.kind === 'font' ? fontBucket : assetBucket,
        storageKey,
        buffer,
        mimeType,
      );

      if (target.kind === 'font') {
        await fonts.upsertSeededFont({
          name: basename(relativePath),
          groupName: getFontGroupName(relativePath),
          storageKey,
          mimeType,
          sizeBytes: buffer.length,
        });
        seededFonts += 1;
        continue;
      }

      const asset = await assets.upsertSeededAsset({
        name: basename(relativePath),
        type: target.type,
        storageKey,
        description: relativePath,
        mimeType,
        sizeBytes: buffer.length,
        fromBrand: true,
      });

      const brandKitName = getBrandKitName(relativePath);

      if (brandKitName) {
        await linkAssetToBrandKit(prisma, asset.id, brandKitName);
      }

      seededAssets += 1;
    }

    Logger.log(
      `Seed completed. Assets: ${seededAssets}. Fonts: ${seededFonts}.`,
      'SeedAssetsScript',
    );
  } finally {
    await app.close();
  }
}

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = resolve(directory, entry.name);
      return entry.isDirectory() ? listFiles(absolutePath) : [absolutePath];
    }),
  );

  return files.flat();
}

function toRelativePath(absolutePath: string): string {
  return relative(sourceDirectory, absolutePath).split(sep).join('/');
}

function getTarget(relativePath: string): SeedTarget {
  if (relativePath.startsWith('fonts/')) {
    return { kind: 'font' };
  }

  if (relativePath.startsWith('shapes/')) {
    return { kind: 'asset', type: asset_type.SHAPE };
  }

  if (relativePath.startsWith('keywords/')) {
    return { kind: 'asset', type: asset_type.KEYWORD };
  }

  if (relativePath.startsWith('blocks/')) {
    return { kind: 'asset', type: asset_type.BLOCK };
  }

  if (relativePath.startsWith('logos/')) {
    return { kind: 'asset', type: asset_type.LOGO };
  }

  if (relativePath.startsWith('lockups/')) {
    return { kind: 'asset', type: asset_type.LOCKUP };
  }

  throw new Error(`Cannot infer asset type from path: ${relativePath}`);
}

function getStorageKey(relativePath: string, target: SeedTarget): string {
  if (target.kind === 'font') {
    const segments = relativePath.split('/');
    return segments.length <= 2
      ? `fonts/nestle/${segments.at(-1)}`
      : `fonts/${normalizeSegment(segments[1])}/${segments.slice(2).join('/')}`;
  }

  if (relativePath.startsWith('keywords/')) {
    return `assets/keywords/${basename(relativePath)}`;
  }

  if (relativePath.startsWith('blocks/')) {
    return `assets/blocks/${basename(relativePath)}`;
  }

  if (relativePath.startsWith('logos/') || relativePath.startsWith('lockups/')) {
    const [rootDirectory, brandSegment, ...rest] = relativePath.split('/');
    const filePath = rest.length ? rest.join('/') : brandSegment;
    const brand = rest.length ? brandSegment : 'nestle';
    return `assets/${rootDirectory}/${normalizeSegment(brand)}/${filePath}`;
  }

  if (relativePath.startsWith('shapes/brands/')) {
    return `assets/shapes/brand/${relativePath.slice('shapes/brands/'.length)}`;
  }

  if (relativePath.startsWith('shapes/mosaics/')) {
    return `assets/shapes/mosaics/${relativePath.slice('shapes/mosaics/'.length)}`;
  }

  return `assets/${relativePath}`;
}

function getMimeType(filePath: string): string {
  const mimeTypes: Record<string, string> = {
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.otf': 'font/otf',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };

  const mimeType = mimeTypes[extname(filePath).toLowerCase()];

  if (!mimeType) {
    throw new Error(`Unsupported file extension for asset seed: ${extname(filePath)}`);
  }

  return mimeType;
}

function getFontGroupName(relativePath: string): string {
  const group = relativePath.split('/')[1] || 'default';
  return toTitleCase(group);
}

function getBrandKitName(relativePath: string): string | null {
  const segments = relativePath.split('/');

  if (relativePath.startsWith('shapes/brands/') && segments[2]) {
    return toTitleCase(segments[2]);
  }

  if (relativePath.startsWith('logos/') || relativePath.startsWith('lockups/')) {
    return toTitleCase(segments[1] || 'default');
  }

  return null;
}

function toTitleCase(value: string): string {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((segment) => `${segment[0]?.toUpperCase() || ''}${segment.slice(1)}`)
    .join(' ');
}

function normalizeSegment(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'default'
  );
}

async function linkAssetToBrandKit(
  prisma: PrismaService,
  assetId: string,
  brandKitName: string,
): Promise<void> {
  const brandKit = await prisma.brand_kit.findFirst({
    where: { name: brandKitName },
    select: { id: true },
  });

  if (!brandKit) {
    throw new Error(
      `Required brand kit "${brandKitName}" is missing. Run database/seed.sql before assets:seed-minio.`,
    );
  }

  await prisma.brandkit_assets.createMany({
    data: [{ brand_kit_id: brandKit.id, asset_id: assetId }],
    skipDuplicates: true,
  });
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  Logger.error(message, undefined, 'SeedAssetsScript');
  process.exitCode = 1;
});
