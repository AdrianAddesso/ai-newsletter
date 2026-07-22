import { Logger } from '@nestjs/common';

async function main(): Promise<void> {
  Logger.warn(
    'Asset seeding is disabled in the case-study branch. Seed font/image catalogs manually if needed.',
    'SeedAssetsScript',
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  Logger.error(message, undefined, 'SeedAssetsScript');
  process.exitCode = 1;
});
