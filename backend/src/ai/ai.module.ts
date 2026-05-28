import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthorizationService } from '../modules/auth/services/authorization.service';
import { PermissionsGuard } from '../modules/auth/guards/permissions.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AiController],
  providers: [AiService, AuthorizationService, PermissionsGuard],
})
export class AiModule {}
