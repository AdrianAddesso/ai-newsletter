# Backend AGENTS.md

## Scope

These instructions apply to `backend`, a NestJS + TypeScript API.

The backend owns business workflows, validation, authentication and authorization, Prisma data access, newsletter export orchestration, optional external storage integration, and the GenIA/Cloudhub proxy.

Follow the root `AGENTS.md` first. This file adds backend-specific rules.

## Architecture

- Keep NestJS modules explicit and focused.
- Use a module, controller, service, DTOs, and providers when business logic grows beyond a trivial endpoint.
- Controllers must handle HTTP concerns only: routing, status codes, request DTOs, response DTOs, and guards.
- Services must own reusable business logic, workflow rules, persistence orchestration, and external provider calls.
- Use `@nestjs/config` for environment access.
- Use Prisma for database access when persistence is involved.
- Use transactions for multi-step writes that must remain consistent.
- Keep DTOs, service inputs, and response shapes typed.
- Do not expose Prisma models directly as public API contracts when a DTO is needed to control the response.
- Keep health checks and demo endpoints isolated from production workflows.

## API Contracts

- Request bodies, params, and query strings must be validated before business logic uses them.
- Use DTOs and NestJS pipes for request validation.
- DTOs must validate enum fields against the database enum values defined in the root `AGENTS.md`.
- Handle nullable database results explicitly.
- Return stable response shapes once consumed by the frontend.
- Use useful HTTP status codes:
  - `400` for validation failures.
  - `401` for missing or invalid authentication.
  - `403` for authenticated users without permission.
  - `404` for resources the user cannot access or that do not exist.
  - `409` for invalid state transitions or version conflicts.
  - `502` or `503` for external provider failures.
- Do not return success responses for failed validation, authorization, persistence, export, or AI operations.

## Authentication and Authorization

- Every endpoint must be authenticated unless the task explicitly requires a public endpoint.
- Public endpoints must include a short code comment explaining why they are public.
- Authorization must be enforced with guards, services, or policies in the backend.
- Controllers must not trust user IDs, `user_role`, approval states, or ownership sent by the client.
- Authorization logic must use the persisted `user_role` and `user_state`, not client-provided values.
- Newsletter state transitions must be validated server-side.
- Exports must verify that the authenticated user can access the newsletter and requested version.
- Until full RBAC exists, require authentication and keep authorization checks centralized enough to extend.

## Data and Persistence

- Use Prisma for database reads and writes.
- Use database enum values as the source of truth for `user_role`, `user_state`, `newsletter_state`, `newsletter_format`, `newsletter_language`, `block_content_type`, `asset_type`, and `area_name`.
- Do not persist enum-like strings outside those enums unless the task includes a schema change.
- Do not build SQL by string concatenation.
- Do not persist unsanitized HTML, MJML, or AI output unless the storage field is explicitly designed for raw content and downstream rendering sanitizes it.
- Use optimistic locking, version checks, or transactions for concurrent review and approval operations.
- Preserve traceability for newsletter versions, comments, approvals, and exports.
- Do not delete historical records required for auditability unless the task explicitly defines retention behavior.

## AI Provider Integration

- Backend code is the only place that may use `CLIENT_ID` and `CLIENT_SECRET`.
- `CLIENT_ID` and `CLIENT_SECRET` may be sent only as outbound headers to the approved GenIA/Cloudhub endpoint.
- AI calls must define timeout behavior.
- Retries must be bounded and must not multiply user requests without clear limits.
- Return a user-safe Spanish fallback message when AI generation fails and the error is shown in the UI.
- Log AI failures by operation and provider category, not by raw prompt or generated content.
- Validate and sanitize AI output before persistence, rendering, export, or reuse in later prompts.
- Use direct HTTP calls for GenIA unless the task explicitly requires a higher-level orchestration layer.

## Exports

- Export logic must not mix editor UI controls with exported newsletter markup.
- HTML/MJML/PDF generation must sanitize user-controlled and AI-generated content.
- Export formats must be allowlisted.
- File names, paths, and external URLs used during export must be derived from safe IDs or sanitized slugs.
- Export failures must not leak stack traces, provider internals, file paths, or secrets.

## Observability

- Backend logs must be in English.
- Log operation name, route, authenticated user ID or safe surrogate, newsletter ID, version ID, and provider name when relevant.
- Do not log secrets, tokens, environment values, raw prompts, generated newsletter content, or full request bodies.
- Catch external provider errors at the integration boundary and map them to stable application errors.

## Testing

Required for PRs that touch the related behavior:

- Unit tests for workflow state transitions, validators, mappers, and provider request builders.
- Controller or e2e tests for authentication, authorization, validation, and error status codes.
- Persistence tests or service tests for multi-step writes and versioning logic.
- Regression tests for bug fixes when the behavior can be reproduced with existing tooling.

If a backend change cannot be tested with existing tooling, document the gap in the PR and include manual verification steps.

## Commands

Run from `backend`:

- Install dependencies: `pnpm install`
- Development server: `pnpm run start:dev`
- Build: `pnpm run build`
- Lint: `pnpm run lint`
- Unit tests: `pnpm test`
- E2E tests: `pnpm run test:e2e`
- Coverage: `pnpm run test:cov`

Before finishing backend code changes, run:

- `pnpm run build`
- The most relevant test command for the touched area
- `pnpm run lint` when code style or imports changed

If a command cannot run because local services or environment variables are missing, report the exact command and blocker.
