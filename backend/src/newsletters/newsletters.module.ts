import { Module } from '@nestjs/common';
import { NewsLettersService } from './newsletters.service';
import { NewslettersController } from './newsletters.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthorizationService } from '../modules/auth/services/authorization.service';
import { PermissionsGuard } from '../modules/auth/guards/permissions.guard';
import { AuthModule } from '../modules/auth/auth.module';
import { StorageService } from '../storage/storage.service';

@Module({
  controllers: [NewslettersController],
  imports: [PrismaModule, AuthModule],
  providers: [
    NewsLettersService,
    AuthorizationService,
    PermissionsGuard,
    StorageService,
  ],
})
export class NewsLettersModule {}
