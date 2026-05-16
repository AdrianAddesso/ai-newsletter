import { Controller, Get, Param } from '@nestjs/common';
import { AreasService } from './areas.service';
import { idParamSchema } from '../common/zod/route-params.schema';
import type { IdParam } from '../common/zod/route-params.schema';
import { ZodValidationPipe } from '../common/zod/zod-validation.pipe';

@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  findAll() {
    return this.areasService.findAll();
  }

  @Get(':id')
  findOne(@Param(new ZodValidationPipe(idParamSchema)) params: IdParam): Promise<{ id: string; name: string } | null> {
    return this.areasService.findOne(params.id);
  }
}
