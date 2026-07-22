import 'dotenv/config';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, extname, isAbsolute, resolve } from 'node:path';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { asset_type } from '@prisma/client';
import { AssetsService } from '../src/assets/assets.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { StorageService } from '../src/storage/storage.service';

type ScriptOptions = {
  filePath: string;
  type: asset_type;
};

type UploadedAssetFileInput = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
  ],
  providers: [AssetsService, StorageService],
})
class AssetUploadScriptModule {}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));

  if (!options) {
    printUsage();
    return;
  }

  const app = await NestFactory.createApplicationContext(
    AssetUploadScriptModule,
    {
      logger: ['error', 'warn', 'log'],
    },
  );

  try {
    const assetsService = app.get(AssetsService);
    const uploadFile = await buildUploadFile(options.filePath);
    const response = await assetsService.uploadAssets(
      [uploadFile],
      options.type,
    );

    Logger.log(
      `Uploaded ${response.assets.length} asset(s) to bucket ${process.env.S3_ASSETS_BUCKET}.`,
      'TestMinioUploadScript',
    );
    response.assets.forEach((asset) => {
      Logger.log(
        `Asset ${asset.id} | ${asset.type} | ${asset.name} | ${asset.url}`,
        'TestMinioUploadScript',
      );
    });
  } finally {
    await app.close();
  }
}

function parseArguments(args: string[]): ScriptOptions | null {
  if (args.includes('--help') || args.includes('-h')) {
    return null;
  }

  const filePath = readOption(args, '--file');
  const rawType = readOption(args, '--type') ?? asset_type.IMAGE;

  if (!filePath) {
    throw new Error('Missing required option: --file <relative-or-absolute-path>');
  }

  if (!Object.values(asset_type).includes(rawType as asset_type)) {
    throw new Error(`Invalid asset type: ${rawType}`);
  }

  return {
    filePath,
    type: rawType as asset_type,
  };
}

function readOption(args: string[], optionName: string): string | undefined {
  const optionIndex = args.indexOf(optionName);

  if (optionIndex === -1) {
    return undefined;
  }

  return args[optionIndex + 1];
}

async function buildUploadFile(
  candidatePath: string,
): Promise<UploadedAssetFileInput> {
  const absolutePath = isAbsolute(candidatePath)
    ? candidatePath
    : resolve(process.cwd(), candidatePath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Asset file does not exist: ${absolutePath}`);
  }

  const buffer = await readFile(absolutePath);

  return {
    originalname: basename(absolutePath),
    mimetype: resolveMimeType(absolutePath),
    size: buffer.length,
    buffer,
  };
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
    default:
      throw new Error(`Unsupported asset extension for test upload: ${extension}`);
  }
}

function printUsage(): void {
  Logger.log(
    'Usage: pnpm --dir backend exec ts-node scripts/test-minio-upload.ts --file assets/logos/sample-logo.png --type LOGO',
    'TestMinioUploadScript',
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  Logger.error(message, undefined, 'TestMinioUploadScript');
  process.exitCode = 1;
});
