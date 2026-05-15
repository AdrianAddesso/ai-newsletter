import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockService } from './block.service';
import { BlockController } from './block.controller';
import { AuthModule } from '../modules/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [BlockService],
  controllers: [BlockController],
  exports: [BlockService],
})
export class BlockModule {}
