import { Module } from '@nestjs/common';
import { NewsLettersService } from './newsletters.service';
import { NewslettersController } from './newsletters.controller';
import { StorageService } from '../storage/storage.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthorizationService } from '../modules/auth/services/authorization.service';
import { PermissionsGuard } from '../modules/auth/guards/permissions.guard';
import { AuthModule } from '../modules/auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  controllers: [NewslettersController],
  imports: [PrismaModule, AuthModule, NotificationsModule],
  providers: [
    NewsLettersService, 
    AuthorizationService, 
    PermissionsGuard,
    StorageService,
  ],
})
export class NewsLettersModule {}
