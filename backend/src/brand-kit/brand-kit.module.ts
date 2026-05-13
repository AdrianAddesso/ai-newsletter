import { Module } from '@nestjs/common';
import { BrandKitController } from './brand-kit.controller';
import { BrandKitService } from './brand-kit.service';
import { AuthModule } from '../modules/auth/auth.module';
import { AuthorizationService } from '../modules/auth/services/authorization.service';
import { PermissionsGuard } from '../modules/auth/guards/permissions.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageService } from '../storage/storage.service';

@Module({
  controllers: [BrandKitController],
  imports: [PrismaModule,AuthModule],
  providers: [
    BrandKitService,
    AuthorizationService,
    PermissionsGuard,
    StorageService,
  ],
})
export class BrandKitModule {}
