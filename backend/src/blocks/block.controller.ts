import { Controller, Get, UseGuards } from '@nestjs/common';
import { BlockService } from './block.service';
import { RequirePermission } from '../modules/auth/decorators/permissions.decorator';
import { Action } from '../modules/auth/enum/actions';
import { Resource } from '../modules/auth/enum/resources';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { PermissionsGuard } from '../modules/auth/guards/permissions.guard';
import type { BlockDefinitionDTO } from '@shared/types/block.types';

@Controller('blocks')
@UseGuards(JwtGuard, PermissionsGuard)
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Get('definitions')
  @RequirePermission(Action.TEMPLATE_VIEW_COPY, Resource.TEMPLATES)
  listDefinitions(): BlockDefinitionDTO[] {
    return this.blockService.listDefinitions();
  }
}
