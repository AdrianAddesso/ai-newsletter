import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { createServer } from 'node:net';

const allowedOrigins = new Set(
  (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);
const localhostOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

async function bootstrap() {
  const port = Number(process.env.PORT ?? 3000);
  if (await isPortInUse(port)) {
    console.error(
      `Backend bootstrap failed: port ${port} is already in use. Stop the existing process or set PORT to a free port.`,
    );
    process.exit(1);
    return;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin(
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) {
      if (
        !origin ||
        allowedOrigins.has(origin) ||
        localhostOriginPattern.test(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
}

void bootstrap().catch((error: unknown) => {
  console.error('Backend bootstrap failed', error);
  process.exit(1);
});

async function isPortInUse(port: number): Promise<boolean> {
  return await new Promise((resolve) => {
    const server = createServer();

    server.once('error', () => {
      resolve(true);
    });

    server.once('listening', () => {
      server.close(() => {
        resolve(false);
      });
    });

    server.listen(port, '::');
  });
}
