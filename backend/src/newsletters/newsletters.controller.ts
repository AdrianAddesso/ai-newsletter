import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NewsLettersService } from './newsletters.service';
import {
  idAndCommentIdParamSchema,
  idAndExportIdParamSchema,
  idParamSchema,
} from '../common/zod/route-params.schema';
import type {
  IdAndCommentIdParam,
  IdAndExportIdParam,
  IdParam,
} from '../common/zod/route-params.schema';
import { ZodValidationPipe } from '../common/zod/zod-validation.pipe';
import {
  addNewsletterCommentBodySchema,
  addNewsletterLogBodySchema,
  createNewsletterBodySchema,
  updateNewsletterBodySchema,
  updateNewsletterCommentBodySchema,
  updateNewsletterExportBodySchema,
  updateNewsletterStatusBodySchema,
} from './newsletters.schemas';
import type {
  AddNewsletterCommentBody,
  AddNewsletterLogBody,
  CreateNewsletterBody,
  UpdateNewsletterBody,
  UpdateNewsletterCommentBody,
  UpdateNewsletterExportBody,
  UpdateNewsletterStatusBody,
} from './newsletters.schemas';
import { MockAuthGuard } from '../modules/auth/guards/mockup.guard';
import { PermissionsGuard } from '../modules/auth/guards/permissions.guard';
import { RequirePermission } from '../modules/auth/decorators/permissions.decorator';
import { Action } from '../modules/auth/enum/actions';
import { Resource } from '../modules/auth/enum/resources';

@Controller(Resource.NEWSLETTERS)
@UseGuards(MockAuthGuard, PermissionsGuard)
export class NewslettersController {
  constructor(private readonly newslettersService: NewsLettersService) { }

  @Get()
  getAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    // Los Query params vienen como string, los convertimos a números
    return this.newslettersService.getAll(Number(page), Number(limit));
  }

  @Post()
  @RequirePermission(Action.CONTENT_UPLOAD, Resource.NEWSLETTERS)
  create(
    @Body(new ZodValidationPipe(createNewsletterBodySchema))
    body: CreateNewsletterBody,
  ) {
    void body;
    return this.newslettersService.create();
  }

  @Get(':id')
  getById(@Param(new ZodValidationPipe(idParamSchema)) params: IdParam) {
    return this.newslettersService.getById(params.id);
  }

  @Patch(':id')
  update(
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
    @Body(new ZodValidationPipe(updateNewsletterBodySchema))
    body: UpdateNewsletterBody,
  ) {
    void body;
    return this.newslettersService.update(params.id);
  }

  @Delete(':id')
  delete(@Param(new ZodValidationPipe(idParamSchema)) params: IdParam) {
    return this.newslettersService.delete(params.id);
  }

  @Post(':id/status')
  updateStatus(
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
    @Body(new ZodValidationPipe(updateNewsletterStatusBodySchema))
    body: UpdateNewsletterStatusBody,
  ) {
    void body;
    return this.newslettersService.updateStatus(params.id);
  }

  @Post(':id/logs')
  addLog(
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
    @Body(new ZodValidationPipe(addNewsletterLogBodySchema))
    body: AddNewsletterLogBody,
  ) {
    return this.newslettersService.addLog(params.id, {
      previousState: body.previousState,
      newState: body.newState,
      reviewedByUserId: body.reviewedByUserId,
      allCommentaries: body.allCommentaries,
    });
  }

  @Get(':id/logs')
  getLogs(@Param(new ZodValidationPipe(idParamSchema)) params: IdParam) {
    return this.newslettersService.getLogs(params.id);
  }

  @Get(':id/comments')
  getComments(@Param(new ZodValidationPipe(idParamSchema)) params: IdParam) {
    return this.newslettersService.getComments(params.id);
  }

  @Post(':id/comments')
  addComment(
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
    @Body(new ZodValidationPipe(addNewsletterCommentBodySchema))
    body: AddNewsletterCommentBody,
  ) {
    void body;
    return this.newslettersService.addComment(params.id);
  }

  @Patch(':id/comments/:commentId')
  updateComment(
    @Param(new ZodValidationPipe(idAndCommentIdParamSchema))
    params: IdAndCommentIdParam,
    @Body(new ZodValidationPipe(updateNewsletterCommentBodySchema))
    body: UpdateNewsletterCommentBody,
  ) {
    void body;
    return this.newslettersService.updateComment(params.id, params.commentId);
  }

  @Patch(':id/exports/:exportId')
  updateExports(
    @Param(new ZodValidationPipe(idAndExportIdParamSchema))
    params: IdAndExportIdParam,
    @Body(new ZodValidationPipe(updateNewsletterExportBodySchema))
    body: UpdateNewsletterExportBody,
  ) {
    void body;
    return this.newslettersService.updateExports(params.id, params.exportId);
  }

  @Get(':id/exports')
  getExports(@Param(new ZodValidationPipe(idParamSchema)) params: IdParam) {
    return this.newslettersService.getExports(params.id);
  }

  @Post(':id/logs/approve')
  @RequirePermission(Action.REVIEW_FINAL_APPROVE_COMMENT, Resource.NEWSLETTERS)
  addApprovalLog(
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
    @Body(new ZodValidationPipe(addNewsletterLogBodySchema)) body: AddNewsletterLogBody,
  ) {
    return this.newslettersService.addLog(params.id, {
      previousState: body.previousState,
      newState: 'APPROVED',
      reviewedByUserId: body.reviewedByUserId,
    });
  }

  @Post(':id/logs/request-changes')
  addChangesRequestedLog(
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
    @Body(new ZodValidationPipe(addNewsletterLogBodySchema)) body: AddNewsletterLogBody,
  ) {
    return this.newslettersService.addLog(params.id, {
      previousState: body.previousState,
      newState: 'CHANGES_REQUESTED',
      reviewedByUserId: body.reviewedByUserId,
      allCommentaries: body.allCommentaries,
    });
  }

  @Post(':id/logs/export')
  @RequirePermission(Action.CONTENT_EXPORT_APPROVED, Resource.NEWSLETTERS) 
  addExportLog(
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
    @Body(new ZodValidationPipe(addNewsletterLogBodySchema)) body: AddNewsletterLogBody,
  ) {
    return this.newslettersService.addLog(params.id, {
      previousState: 'APPROVED',
      newState: 'APPROVED',
      reviewedByUserId: body.reviewedByUserId,
      allCommentaries: body.allCommentaries,
    });
  }
}
