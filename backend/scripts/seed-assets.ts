import 'dotenv/config';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { basename, extname, posix, relative, resolve, sep } from 'node:path';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { asset_type } from '@prisma/client';
import { AssetsService } from '../src/assets/assets.service';
import { FontsService } from '../src/fonts/fonts.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { StorageService } from '../src/storage/storage.service';

type AssetSeedTarget =
  | {
      kind: 'asset';
      type: asset_type;
    }
  | {
      kind: 'font';
    };

type SeedFile = {
  absolutePath: string;
  relativePath: string;
  storageKey: string;
  bucket: string;
  objectPrefix: string;
  fileName: string;
  extension: string | null;
  mimeType: string;
  target: AssetSeedTarget;
};

type ScriptOptions = {
  sourceDirectory: string;
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
  ],
  providers: [AssetsService, FontsService, StorageService],
})
class AssetSeedScriptModule {}

const assetBucketName =
  process.env.S3_ASSETS_BUCKET?.trim() || 'ai-newsletter-assets';
const fontBucketName =
  process.env.S3_FONTS_BUCKET?.trim() || 'ai-newsletter-fonts';

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));

  if (!options) {
    printUsage();
    return;
  }

  const app = await NestFactory.createApplicationContext(AssetSeedScriptModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const storageService = app.get(StorageService);
    const assetsService = app.get(AssetsService);
    const fontsService = app.get(FontsService);
    const prisma = app.get(PrismaService);
    await assertDatabaseReady(prisma);
    await ensureAssetBucketPrefixes(storageService, ['assets/images/', 'assets/icons/', 'assets/blocks/']);
    const seedFiles = await discoverSeedFiles(options.sourceDirectory);

    let seededAssets = 0;
    let seededFonts = 0;

    for (const seedFile of seedFiles) {
      const buffer = await readFile(seedFile.absolutePath);

      await storageService.uploadObject(
        seedFile.bucket,
        seedFile.storageKey,
        buffer,
        seedFile.mimeType,
      );

      if (seedFile.target.kind === 'font') {
        await fontsService.upsertSeededFont({
          name: seedFile.fileName,
          groupName: inferFontGroupName(seedFile.relativePath),
          storageKey: seedFile.storageKey,
          mimeType: seedFile.mimeType,
          sizeBytes: buffer.length,
        });
        seededFonts += 1;
        continue;
      }

      const asset = await assetsService.upsertSeededAsset({
        name: seedFile.fileName,
        type: seedFile.target.type,
        storageKey: seedFile.storageKey,
        description: seedFile.relativePath,
        mimeType: seedFile.mimeType,
        sizeBytes: buffer.length,
        fromBrand: true,
      });
      const brandKitName = inferBrandKitName(seedFile.relativePath);

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

function parseArguments(args: string[]): ScriptOptions | null {
  if (args.includes('--help') || args.includes('-h')) {
    return null;
  }

  const sourceDirectory =
    readOption(args, '--source') ?? resolve(process.cwd(), 'assets');

  if (!existsSync(sourceDirectory)) {
    throw new Error(`Assets source directory does not exist: ${sourceDirectory}`);
  }

  return { sourceDirectory };
}

function readOption(args: string[], optionName: string): string | undefined {
  const optionIndex = args.indexOf(optionName);

  if (optionIndex === -1) {
    return undefined;
  }

  return args[optionIndex + 1];
}

async function discoverSeedFiles(sourceDirectory: string): Promise<SeedFile[]> {
  const absoluteSourceDirectory = resolve(sourceDirectory);
  const filePaths = await walkFiles(absoluteSourceDirectory);

  return filePaths.map((absolutePath) =>
    buildSeedFile(absoluteSourceDirectory, absolutePath),
  );
}

async function walkFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedPaths = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = resolve(directory, entry.name);

      if (entry.isDirectory()) {
        return walkFiles(absolutePath);
      }

      return [absolutePath];
    }),
  );

  return nestedPaths.flat();
}

function buildSeedFile(sourceDirectory: string, absolutePath: string): SeedFile {
  const relativePath = relative(sourceDirectory, absolutePath).split(sep).join('/');
  const target = inferSeedTarget(relativePath);
  const storageKey = buildStorageKey(relativePath, target);
  const bucket = target.kind === 'font' ? fontBucketName : assetBucketName;

  return {
    absolutePath,
    relativePath,
    storageKey,
    bucket,
    objectPrefix: getObjectPrefix(storageKey),
    fileName: basename(relativePath),
    extension: getExtension(relativePath),
    mimeType: resolveMimeType(absolutePath),
    target,
  };
}

function inferSeedTarget(relativePath: string): AssetSeedTarget {
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

function buildStorageKey(
  relativePath: string,
  target: AssetSeedTarget,
): string {
  if (target.kind === 'font') {
    return buildFontStorageKey(relativePath);
  }

  if (relativePath.startsWith('keywords/')) {
    return `assets/keywords/${basename(relativePath)}`;
  }

  if (relativePath.startsWith('blocks/')) {
    return `assets/blocks/${basename(relativePath)}`;
  }

  if (relativePath.startsWith('logos/')) {
    return buildBrandScopedAssetStorageKey(relativePath, 'logos');
  }

  if (relativePath.startsWith('lockups/')) {
    return buildBrandScopedAssetStorageKey(relativePath, 'lockups');
  }

  if (relativePath.startsWith('shapes/brands/')) {
    return `assets/shapes/brand/${relativePath.slice('shapes/brands/'.length)}`;
  }

  if (relativePath.startsWith('shapes/mosaics/')) {
    return `assets/shapes/mosaics/${relativePath.slice('shapes/mosaics/'.length)}`;
  }

  return `assets/${relativePath}`;
}

function buildFontStorageKey(relativePath: string): string {
  const segments = relativePath.split('/');

  if (segments.length <= 2) {
    return `fonts/nestle/${segments[segments.length - 1]}`;
  }

  const brandSegment = normalizeStoragePathSegment(segments[1]);
  const fileSegments = segments.slice(2).join('/');
  return `fonts/${brandSegment}/${fileSegments}`;
}

function buildBrandScopedAssetStorageKey(
  relativePath: string,
  rootDirectory: 'logos' | 'lockups',
): string {
  const segments = relativePath.split('/');

  if (segments.length <= 2) {
    return `assets/${rootDirectory}/nestle/${segments[segments.length - 1]}`;
  }

  const brandSegment = normalizeStoragePathSegment(segments[1]);
  const fileSegments = segments.slice(2).join('/');
  return `assets/${rootDirectory}/${brandSegment}/${fileSegments}`;
}

function resolveMimeType(filePath: string): string {
  const extension = extname(filePath).toLowerCase();

  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.ttf':
      return 'font/ttf';
    case '.otf':
      return 'font/otf';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    default:
      throw new Error(`Unsupported file extension for asset seed: ${extension}`);
  }
}

function inferFontGroupName(relativePath: string): string {
  const segments = relativePath.split('/');
  const groupSegment = segments.length <= 2 ? 'default' : segments[1];

  if (!groupSegment) {
    return 'Default';
  }

  return groupSegment
    .split(/[-_]+/)
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(' ');
}

function inferBrandKitName(relativePath: string): string | null {
  const segments = relativePath.split('/');

  if (relativePath.startsWith('shapes/brands/') && segments[2]) {
    return humanizeBrandName(segments[2]);
  }

  if (
    (relativePath.startsWith('logos/') || relativePath.startsWith('lockups/')) &&
    segments[1]
  ) {
    return humanizeBrandName(segments.length <= 2 ? 'default' : segments[1]);
  }

  return null;
}

function humanizeBrandName(value: string): string {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(' ');
}

function normalizeStoragePathSegment(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'default'
  );
}

async function assertDatabaseReady(prisma: PrismaService): Promise<void> {
  await assertTableExists(prisma, 'assets');
  await assertTableExists(prisma, 'fonts');
  await assertTableExists(prisma, 'font_groups');
  await assertTableExists(prisma, 'brand_kit');
  await assertTableExists(prisma, 'brandkit_assets');
}

async function assertTableExists(
  prisma: PrismaService,
  tableName: string,
): Promise<void> {
  const result = await prisma.$queryRawUnsafe<Array<{ relation_name: string | null }>>(
    `SELECT to_regclass('public.${tableName}')::text AS relation_name`,
  );

  if (!result[0]?.relation_name) {
    throw new Error(
      `Required table public.${tableName} is missing. Run database/init.sql and database/seed.sql before assets:seed-minio.`,
    );
  }
}

async function linkAssetToBrandKit(
  prisma: PrismaService,
  assetId: string,
  brandKitName: string,
): Promise<void> {
  const brandKit = await prisma.brand_kit.findFirst({
    where: {
      name: brandKitName,
    },
    select: {
      id: true,
    },
  });

  if (!brandKit) {
    throw new Error(
      `Required brand kit "${brandKitName}" is missing. Run database/seed.sql before assets:seed-minio.`,
    );
  }

  await prisma.brandkit_assets.createMany({
    data: [
      {
        brand_kit_id: brandKit.id,
        asset_id: assetId,
      },
    ],
    skipDuplicates: true,
  });
}

async function ensureAssetBucketPrefixes(
  storageService: StorageService,
  prefixes: string[],
): Promise<void> {
  for (const prefix of prefixes) {
    await storageService.uploadObject(
      assetBucketName,
      prefix,
      Buffer.alloc(0),
      'application/x-directory',
    );
  }
}

function getObjectPrefix(storageKey: string): string {
  const objectPrefix = posix.dirname(storageKey);
  return objectPrefix === '.' ? '' : objectPrefix;
}

function getExtension(filePath: string): string | null {
  const extension = extname(filePath).toLowerCase();
  return extension ? extension.slice(1) : null;
}

function printUsage(): void {
  Logger.log(
    'Usage: pnpm --dir backend exec ts-node scripts/seed-assets.ts [--source assets]',
    'SeedAssetsScript',
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  Logger.error(message, undefined, 'SeedAssetsScript');
  process.exitCode = 1;
});
