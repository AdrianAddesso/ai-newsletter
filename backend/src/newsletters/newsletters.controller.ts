import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NewsLettersService } from './newsletters.service';
import { NewsletterExportService, type ExportFormat } from './newsletter-export.service';
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
  approveNewsletterReviewBodySchema,
  addNewsletterCommentBodySchema,
  addNewsletterLogBodySchema,
  createNewsletterBodySchema,
  requestNewsletterChangesBodySchema,
  updateNewsletterBodySchema,
  updateNewsletterCommentBodySchema,
  updateNewsletterExportBodySchema,
  updateNewsletterStatusBodySchema,
  exportNewsletterBodySchema,
} from './newsletters.schemas';
import type {
  ApproveNewsletterReviewBody,
  AddNewsletterCommentBody,
  AddNewsletterLogBody,
  CreateNewsletterBody,
  RequestNewsletterChangesBody,
  UpdateNewsletterBody,
  UpdateNewsletterCommentBody,
  UpdateNewsletterExportBody,
  UpdateNewsletterStatusBody,
   ExportNewsletterBody,
} from './newsletters.schemas';
import { MockAuthGuard } from '../modules/auth/guards/mockup.guard';
import { PermissionsGuard } from '../modules/auth/guards/permissions.guard';
import { RequirePermission } from '../modules/auth/decorators/permissions.decorator';
import { Action } from '../modules/auth/enum/actions';
import { Resource } from '../modules/auth/enum/resources';
import { AuthorizationService } from '../modules/auth/services/authorization.service';
import { PermissionCacheService } from '../modules/auth/services/permission-cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { newsletter_state } from '@prisma/client';
import { Role } from '../modules/auth/enum/roles';

type AuthenticatedRequest = {
  user?: {
    id?: string;
    role?: Role;
    area?: string;
    area_id?: string;
  };
};

@Controller(Resource.NEWSLETTERS)
@UseGuards(MockAuthGuard, PermissionsGuard)
export class NewslettersController {
  constructor(
    private readonly newslettersService: NewsLettersService,
    private readonly exportService: NewsletterExportService,
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly permissionCacheService: PermissionCacheService,
  ) { }

  @Get()
  getAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    // Los Query params vienen como string, los convertimos a números
    return this.newslettersService.getAll(Number(page), Number(limit));
  }

  @Get('reviews')
  getReviewInbox(@Req() request: AuthenticatedRequest) {
    return this.newslettersService.getReviewInbox(request.user);
  }

  @Post()
  @RequirePermission(Action.CONTENT_UPLOAD, Resource.NEWSLETTERS)
  create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createNewsletterBodySchema))
    body: CreateNewsletterBody,
  ) {
    return this.newslettersService.create(body, request.user?.id);
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
    return this.newslettersService.update(params.id, body);
  }

  @Delete(':id')
  delete(@Param(new ZodValidationPipe(idParamSchema)) params: IdParam) {
    return this.newslettersService.delete(params.id);
  }

  @Post(':id/status')
  // Permission is state-dependent: request preview/resubmission is not final approval.
  updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
    @Body(new ZodValidationPipe(updateNewsletterStatusBodySchema))
    body: UpdateNewsletterStatusBody,
  ) {
    return this.assertStatusPermission(request, params.id, body.state).then(() =>
      this.newslettersService.updateStatus(params.id, body),
    );
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

  @Post(':id/export')
  @RequirePermission(Action.CONTENT_EXPORT_APPROVED, Resource.NEWSLETTERS)
  async exportNewsletter(
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
    @Body(new ZodValidationPipe(exportNewsletterBodySchema)) body: ExportNewsletterBody,
    @Headers('x-user-id') userId: string,
  ) {
    return this.exportService.exportNewsletter(params.id, body.format as ExportFormat, userId);
  }

  @Post(':id/review/request-changes')
  requestChanges(
    @Req() request: AuthenticatedRequest,
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
    @Body(new ZodValidationPipe(requestNewsletterChangesBodySchema))
    body: RequestNewsletterChangesBody,
  ) {
    return this.assertReviewPermission(request, params.id).then(() =>
      this.newslettersService.requestChanges(params.id, {
        reviewedByUserId: request.user?.id,
        blockComments: body.blockComments,
      }),
    );
  }

  @Post(':id/review/approve')
  approveReview(
    @Req() request: AuthenticatedRequest,
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
    @Body(new ZodValidationPipe(approveNewsletterReviewBodySchema))
    body: ApproveNewsletterReviewBody,
  ) {
    return this.assertReviewPermission(request, params.id).then(() =>
      this.newslettersService.approveReview(params.id, {
        reviewedByUserId: request.user?.id,
      }),
    );
  }

  private async assertStatusPermission(
    request: AuthenticatedRequest,
    newsletterId: string,
    nextState: newsletter_state,
  ): Promise<void> {
    const requiredAction = this.getStatusAction(nextState);
    return this.assertActionPermission(request, newsletterId, requiredAction);
  }

  private async assertReviewPermission(
    request: AuthenticatedRequest,
    newsletterId: string,
  ): Promise<void> {
    return this.assertActionPermission(
      request,
      newsletterId,
      Action.REVIEW_FINAL_APPROVE_COMMENT,
    );
  }

  private async assertActionPermission(
    request: AuthenticatedRequest,
    newsletterId: string,
    requiredAction: Action,
  ): Promise<void> {
    const user = request.user;

    if (!user?.role) {
      throw new ForbiddenException({
        message: 'No se encontro informacion de usuario en la solicitud o el usuario no tiene un rol asignado',
        error: 'Permisos insuficientes',
        statusCode: 403,
      });
    }

    const rolePermissions = await this.permissionCacheService.getPermissionsForRole(
      user.role,
    );

    if (!rolePermissions.includes(requiredAction)) {
      throw new ForbiddenException({
        message: `Tu rol (${user.role}) no tiene el permiso: ${requiredAction}`,
        error: 'Permisos insuficientes',
        statusCode: 403,
      });
    }

    const newsletter = await this.prisma.newsletters.findUnique({
      where: { id: newsletterId },
      select: {
        id: true,
        created_by_user_id: true,
        state: true,
        area_id: true,
      },
    });

    if (!newsletter) {
      throw new NotFoundException({
        message: `No se encontro el recurso newsletters con ID ${newsletterId}`,
        error: 'Recurso no encontrado',
        statusCode: 404,
      });
    }

    const normalizedUser = {
      id: user.id ?? '',
      permissions: [],
      role: user.role,
      area_id: user.area_id ?? user.area ?? '',
    };

    const isAuthorized = this.authorizationService.isAuthorized(
      normalizedUser,
      requiredAction,
      newsletter,
    );

    if (!isAuthorized) {
      throw new ForbiddenException({
        message: 'No tienes permisos para realizar esta accion',
        error: 'No se puede realizar esta accion',
        statusCode: 403,
      });
    }
  }

  private getStatusAction(nextState: newsletter_state): Action {
    if (
      nextState === newsletter_state.IN_REVIEW ||
      nextState === newsletter_state.RESUBMITTED
    ) {
      return Action.REVIEW_REQUEST_PREVIEW;
    }

    return Action.REVIEW_FINAL_APPROVE_COMMENT;
  }
}

