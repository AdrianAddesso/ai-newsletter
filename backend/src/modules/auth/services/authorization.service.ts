import { Injectable } from '@nestjs/common';
import { Action } from '../enum/actions'
import { NewsletterStatus } from '../enum/status';
import { Role } from '../enum/roles';

type User = {
  id: string,
  permissions: Action[],
  role: Role,
  area_id: string
}

type Newsletter = {
  created_by_user_id: string,
  state: NewsletterStatus,
  area_id: string
}

@Injectable()
export class AuthorizationService {
  constructor() { }

  private readonly rules: Record<string, (user: User, resource?: any) => boolean> = {

    [Action.USER_MANAGE]: (user) => this.isSuperAdmin(user),
    
    [Action.ROLE_ASSIGN]: (user) => this.isSuperAdmin(user),

    [Action.SECURITY_POLICY_DEFINE]: (user) => this.isSuperAdmin(user),

    [Action.PROMPT_MANAGE]: (user) => this.isSuperAdmin(user),

    [Action.BRAND_MANAGE]: (user) => this.isSuperAdmin(user),

    [Action.TEMPLATE_CREATE_RETIRE]: (user) => this.isSuperAdmin(user) || this.isFunctionalAdmin(user),

    [Action.TEMPLATE_EDIT]: (user) => this.isSuperAdmin(user) || this.isFunctionalAdmin(user),

    [Action.TEMPLATE_VIEW_COPY]: () => true,

    [Action.CONTENT_GENERATE_AI]: () => true,

    [Action.CONTENT_UPLOAD]: () => true,

    [Action.REVIEW_REQUEST_PREVIEW]: (user, res: Newsletter) => this.isOwner(user, res) && this.isEditable(res),

    [Action.REVIEW_COMMENT_CREATE]: (user) => this.isFunctionalAdmin(user) || this.isSuperAdmin(user),

    [Action.REVIEW_COMMENT_VIEW_REPLY]: (user, res: Newsletter) => this.isFunctionalAdmin(user) || this.isOwner(user, res) || this.isSuperAdmin(user),

    [Action.REVIEW_FINAL_APPROVE_COMMENT]: (user, res: Newsletter) => this.isFunctionalAdmin(user) && this.isUnderReview(res) || this.isSuperAdmin(user),

    [Action.AUDIT_LOGS_METRICS_VIEW]: (user) => this.isFunctionalAdmin(user) || this.isSuperAdmin(user),

    [Action.CONTENT_EXPORT_APPROVED]: (user: User, res: Newsletter) => this.isApproved(res),
  };

  private isOwner(user: User, resource: Newsletter): boolean {
    return user.id === resource.created_by_user_id;
  }

  private isSameArea(user: User, resource: Newsletter): boolean {
    return user.area_id === resource.area_id;
  }

  private isSuperAdmin(user: User): boolean {
    return user.role === Role.ADMIN;
  }

  private isFunctionalAdmin(user: User): boolean {
    return user.role === Role.FUNCTIONAL;
  }

  private isEditable(resource: Newsletter): boolean {
    return [NewsletterStatus.DRAFT, NewsletterStatus.CHANGES_REQUESTED].includes(resource.state);
  }

  private isUnderReview(resource: Newsletter): boolean {
    return [NewsletterStatus.IN_REVIEW, NewsletterStatus.RESUBMITTED].includes(resource.state);
  }

  private isApproved(resource: Newsletter): boolean {
    return resource.state === NewsletterStatus.APPROVED;
  }

  isAuthorized(user: User, permission: string, resource?: any): boolean {
    if (user.role === Role.ADMIN) return true;

    const handler = this.rules[permission];
    if (!handler) return true;

    return handler(user, resource);
  }
}
