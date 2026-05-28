import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService } from './authorization.service';
import { Action } from '../enum/actions';
import { NewsletterStatus } from '../enum/status';
import { Role } from '../enum/roles';

describe('AuthorizationService', () => {
  let service: AuthorizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthorizationService],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isAuthorized', () => {
    const adminUser = {
      id: 'admin-id',
      permissions: [],
      role: Role.ADMIN,
      area_id: 'admin-area'
    };

    const functionalAdmin = {
      id: 'functional-id',
      permissions: [],
      role: Role.FUNCTIONAL,
      area_id: 'area-1'
    };

    const regularUser = {
      id: 'user-id',
      permissions: [],
      role: Role.USER,
      area_id: 'area-1'
    };

    it('should grant everything to ADMIN', () => {
      expect(service.isAuthorized(adminUser, Action.USER_MANAGE)).toBe(true);
      expect(service.isAuthorized(adminUser, Action.SECURITY_POLICY_DEFINE)).toBe(true);
      expect(service.isAuthorized(adminUser, 'NON_EXISTENT_PERMISSION')).toBe(true);
    });

    it('should grant USER_MANAGE only to ADMIN', () => {
      expect(service.isAuthorized(adminUser, Action.USER_MANAGE)).toBe(true);
      expect(service.isAuthorized(functionalAdmin, Action.USER_MANAGE)).toBe(false);
      expect(service.isAuthorized(regularUser, Action.USER_MANAGE)).toBe(false);
    });

    it('should grant TEMPLATE_VIEW_COPY to everyone', () => {
      expect(service.isAuthorized(regularUser, Action.TEMPLATE_VIEW_COPY)).toBe(true);
      expect(service.isAuthorized(functionalAdmin, Action.TEMPLATE_VIEW_COPY)).toBe(true);
    });

    describe('REVIEW_REQUEST_PREVIEW', () => {
      const newsletter = {
        created_by_user_id: 'user-id',
        state: NewsletterStatus.DRAFT,
        area_id: 'area-1'
      };

      it('should grant access to owner if newsletter is in DRAFT', () => {
        expect(service.isAuthorized(regularUser, Action.REVIEW_REQUEST_PREVIEW, newsletter)).toBe(true);
      });

      it('should grant access to owner if newsletter is in CHANGES_REQUESTED', () => {
        const changesRequested = { ...newsletter, state: NewsletterStatus.CHANGES_REQUESTED };
        expect(service.isAuthorized(regularUser, Action.REVIEW_REQUEST_PREVIEW, changesRequested)).toBe(true);
      });

      it('should deny access if not owner', () => {
        const otherUser = { ...regularUser, id: 'other-id' };
        expect(service.isAuthorized(otherUser, Action.REVIEW_REQUEST_PREVIEW, newsletter)).toBe(false);
      });

      it('should deny access if not in editable state (e.g. APPROVED)', () => {
        const approvedNewsletter = { ...newsletter, state: NewsletterStatus.APPROVED };
        expect(service.isAuthorized(regularUser, Action.REVIEW_REQUEST_PREVIEW, approvedNewsletter)).toBe(false);
      });
    });

    describe('REVIEW_COMMENT_CREATE', () => {
      const newsletter = {
        created_by_user_id: 'user-id',
        state: NewsletterStatus.IN_REVIEW,
        area_id: 'area-1'
      };

      it('should deny access to owner when user is not reviewer', () => {
        expect(service.isAuthorized(regularUser, Action.REVIEW_COMMENT_CREATE, newsletter)).toBe(false);
      });

      it('should grant access to functional admin', () => {
        expect(service.isAuthorized(functionalAdmin, Action.REVIEW_COMMENT_CREATE, newsletter)).toBe(true);
      });

      it('should grant access to functional admin of a different area', () => {
        const otherFunctional = { ...functionalAdmin, area_id: 'area-2' };
        expect(service.isAuthorized(otherFunctional, Action.REVIEW_COMMENT_CREATE, newsletter)).toBe(true);
      });
    });

    describe('REVIEW_FINAL_APPROVE_COMMENT', () => {
      const newsletter = {
        created_by_user_id: 'user-id',
        state: NewsletterStatus.IN_REVIEW,
        area_id: 'area-1'
      };

      it('should grant access to functional admin if under review', () => {
        expect(service.isAuthorized(functionalAdmin, Action.REVIEW_FINAL_APPROVE_COMMENT, newsletter)).toBe(true);
      });

      it('should grant access to functional admin of a different area if under review', () => {
        const otherFunctional = { ...functionalAdmin, area_id: 'area-2' };
        expect(service.isAuthorized(otherFunctional, Action.REVIEW_FINAL_APPROVE_COMMENT, newsletter)).toBe(true);
      });

      it('should deny access if not under review (e.g. DRAFT)', () => {
        const draftNewsletter = { ...newsletter, state: NewsletterStatus.DRAFT };
        expect(service.isAuthorized(functionalAdmin, Action.REVIEW_FINAL_APPROVE_COMMENT, draftNewsletter)).toBe(false);
      });

      it('should deny access to owner if not functional admin', () => {
        expect(service.isAuthorized(regularUser, Action.REVIEW_FINAL_APPROVE_COMMENT, newsletter)).toBe(false);
      });
    });

    describe('CONTENT_EXPORT_APPROVED', () => {
      it('should grant access if newsletter is APPROVED', () => {
        const approvedNewsletter = { state: NewsletterStatus.APPROVED };
        expect(service.isAuthorized(regularUser, Action.CONTENT_EXPORT_APPROVED, approvedNewsletter)).toBe(true);
      });

      it('should deny access if newsletter is not APPROVED', () => {
        const draftNewsletter = { state: NewsletterStatus.DRAFT };
        expect(service.isAuthorized(regularUser, Action.CONTENT_EXPORT_APPROVED, draftNewsletter)).toBe(false);
      });
    });
  });
});
