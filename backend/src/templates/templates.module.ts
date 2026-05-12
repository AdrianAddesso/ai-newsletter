import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { AuthorizationService } from '../modules/auth/services/authorization.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [TemplatesController],
  imports: [PrismaModule],
  providers: [TemplatesService, AuthorizationService],
})
export class TemplatesModule {}
