import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AreasModule } from './areas/areas.module';
import { AuthModule } from './auth/auth.module';
import { NewsLettersModule } from './newsletters/newsletters.module';
import { TemplatesModule } from './templates/templates.module';
import { AiModule } from './ai/ai.module';
import { BrandKitModule } from './brand-kit/brand-kit.module';
import { AssetsModule } from './assets/assets.module';
import { FontsModule } from './fonts/fonts.module';
import { BlockModule } from './blocks/block.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    AreasModule,
    AuthModule,
    NewsLettersModule,
    TemplatesModule,
    AiModule,
    BrandKitModule,
    AssetsModule,
    FontsModule,
    BlockModule,
    UsersModule,
    NotificationsModule,
    ConfigModule.forRoot({
      isGlobal: true, // no tener que importarlo en cada módulo
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
