import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

const allowedOrigins = new Set(['https://nestle-ai-newsletter.vercel.app']);
const localhostOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

async function bootstrap() {
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

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend running on PORT:${port}`);
}

void bootstrap().catch((error: unknown) => {
  console.error('Backend bootstrap failed', error);
  process.exit(1);
});
