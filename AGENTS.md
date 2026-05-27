# AGENTS.md

## Scope

This file defines the project-wide instructions for `ai-newsletter`.

These rules apply to all agents and contributors unless a more specific `AGENTS.md` in a subdirectory adds stricter rules for that area.

Subdirectory files must not contradict this file. If instructions conflict, follow the most specific instruction that is also compatible with this root policy.

## Product Context

`ai-newsletter` is a production platform for internal communications teams to create internal newsletters with AI assistance, predefined brand-aligned templates, review and approval workflows, traceable history, and export support.

Use `/ref` as reference material:

- The development plan PDF describes intended scope, actors, requirements, and architecture.
- The brand guideline PDF describes visual identity constraints.
- Reference files are context. Do not implement features from them unless the task explicitly asks for that work.

## Product Scope

The platform must support:

- Structured newsletter creation from predefined templates.
- AI-assisted generation for subject, preheader, headlines, body, CTA, and closing copy.
- Review states from `newsletter_state`: , , , , , .
- Traceability for versions, comments, approvals, and exports.
- Export targets: HTML/MJML, PDF, and internal web preview.

The platform must not implement automated email sending unless the task explicitly requests it.

## Domain Enums

Use the database enums as the source of truth for domain state and permissions. Do not invent new role, state, format, language, content type, asset type, or area values in frontend or backend code.

Current public enums:

- `user_role`: , , .
- `user_state`: , , .
- `newsletter_state`: , , , , , .
- `newsletter_format`: , .
- `newsletter_language`: .
- `block_content_type`: , , , , , , .
- `asset_type`: , , , , , .
- `area_name`: , .

Use Spanish labels in the UI when displaying enum values. Keep enum identifiers unchanged in code, API contracts, persistence, tests, and technical documentation.

## Language Policy

- User-facing pages, HTML copy, labels, validation messages, error messages, and demo content must be written in Spanish.
- Source code, file names, identifiers, comments, commit messages, PR descriptions, and technical documentation must be written in English.
- API error payloads must use Spanish only when the message is intentionally displayed to an end user. Internal logs and developer-facing errors must be in English.

## Repository Rules

- Use `pnpm` only.
- Do not add `package-lock.json`, `npm-shrinkwrap.json`, or `yarn.lock`.
- Keep changes scoped to the user request.
- Do not rewrite unrelated code while implementing a feature or fix.
- Do not revert user changes unless the user explicitly asks for a revert.
- Add dependencies only when the task cannot be solved reasonably with existing project dependencies or platform APIs.
- Store shared types in a shared location only when both frontend and backend consume them and the coupling is intentional.

## Code Style

- Use `camelCase` for variables, functions, hooks, methods, and object properties.
- Use `PascalCase` for React components, classes, DTOs, types, interfaces, enums, and NestJS providers.
- Use `kebab-case` for route paths and asset file names.
- Use descriptive names. Avoid abbreviations that are not already established in the codebase.
- Keep functions small and focused on one responsibility.
- Use early returns to reduce nesting.
- Do not leave dead code, commented-out code, debug logs, temporary TODOs, or unused exports.

## TypeScript Rules

- TypeScript errors block a PR.
- Public functions, exported functions, controller methods, service methods, hooks, and component props must have explicit input and output types.
- Do not use `any`.
- Use `unknown` with narrowing when the runtime shape is not known.
- Avoid type assertions. A type assertion is allowed only after validation, narrowing, or when adapting a third-party API with an inaccurate type.
- Use discriminated unions for workflow states, async states, and approval states when they make invalid states impossible to represent.
- Do not duplicate request/response types across frontend and backend when a shared contract can be introduced without creating circular ownership.

## Security Baseline

- Treat all client input as untrusted.
- Validate and sanitize user-controlled input before persistence, rendering, export, or AI calls.
- Do not trust client-provided roles, user IDs, approval states, permissions, export ownership, or tenant boundaries.
- Authorization must be enforced in the backend. Frontend checks are only UX hints.
- Backend endpoints are private by default.
- New backend endpoints must require an authenticated application session unless the task explicitly defines them as public.
- Public endpoints must be rare, documented in code, and limited to safe cases such as health checks or deliberately public static assets.
- Do not expose `.env` values, credentials, API keys, storage provider keys, AI credentials, , or  in logs, client bundles, HTTP responses, exports, or generated files.
- Do not interpolate untrusted values into SQL, shell commands, file paths, generated HTML, MJML, PDFs, logs, prompts, or external URLs.
- Use allowlists for CORS origins, upload file types, export formats, AI destinations, and external links.
- Error responses must be useful but generic. Do not return stack traces, internal provider details, SQL errors, tokens, or secrets.

## Authorization and Roles

Until RBAC is fully implemented:

- Every non-public backend endpoint must require authentication.
- Backend code must be structured so role checks can be added without changing controller contracts.
- Do not accept role, approval, or ownership decisions from the frontend as authoritative.

Current roles:

Approval state transitions must be validated server-side. A user must not approve, discard, export, or change ownership of a newsletter unless the backend authorizes that action.

## AI Integration

The current practical AI integration path is the GenIA/Cloudhub endpoint using  and .

- Do not add LangChain only because the planning document mentions it.
- Add LangChain only when a task explicitly requires chains, tools, agents, memory, RAG, or provider abstraction.
- AI calls must use server-side credentials only.
- Frontend code must not call AI providers directly.
- AI requests must include timeouts.
- Retries must be bounded and must not retry unsafe non-idempotent operations unless an idempotency key or equivalent guard exists.
- AI failures must return a graceful fallback message in Spanish when surfaced to users.
- Do not log raw prompts, generated content, credentials, or internal documents unless the data has been reviewed and explicitly marked safe for logs.
- Validate and sanitize AI output before rendering, exporting, or persisting it.

## Observability

- Logs must be in English.
- Logs must include enough context to diagnose failures: request path, operation name, workflow state, entity ID, and external provider name when relevant.
- Logs must not contain secrets, auth tokens, raw prompts, generated newsletter content, or personal data beyond what is required for operations.
- Unexpected backend errors must be logged once at the boundary where they are handled.
- User-facing errors must be short, actionable, and written in Spanish.
- External provider failures must preserve provider status/category internally without leaking sensitive provider details to users.

## Testing Policy

Testing must match the risk and surface area of the change.

PR-blocking expectations:

- Changes to validation, authorization, approval workflows, AI integration, exports, or persistence must include tests or a documented reason why tests are not practical.
- Bug fixes must include a regression test when the behavior can be tested with the existing tooling.
- TypeScript build must pass for every touched app.
- Lint must pass for every touched app when a lint script exists.

Recommended coverage:

- Unit tests for pure business rules, state transitions, validators, mappers, and AI request builders.
- Backend integration or e2e tests for controllers, guards, persistence, and export orchestration.
- Frontend component tests for complex forms, async states, and permission-sensitive UI when test tooling is available.
- Manual verification notes for visual changes, export output, and workflows not covered by automated tests.

## CI/CD

GitHub Actions are the source of truth for required automated checks.

Current workflows:

- Backend CI runs on changes to `backend/**` and `.github/workflows/backend.yml`.
- Frontend CI runs on changes to `frontend/**` and `.github/workflows/frontend.yml`.
- Both workflows install with `pnpm --frozen-lockfile`, build the app, and build the Docker image.

PRs are blocked by:

- Failing GitHub Actions.
- TypeScript build errors.
- Broken Docker builds.
- Lockfile changes that do not match `package.json`.
- Missing validation for security-sensitive or workflow-sensitive changes.

When adding or changing CI:

- Use GitHub Actions.
- Keep workflows deterministic.
- Use `pnpm --frozen-lockfile` in CI.
- Do not require secrets for build-only checks unless the build truly depends on them.

## Documentation Policy

- Markdown files must be concise, scannable in raw diffs, and written in English unless they are user-facing product copy.
- Update documentation in the same PR when behavior, setup, commands, environment variables, or architecture changes.
- Do not document secrets or real credential values.
- Document new environment variables with name, purpose, required/optional status, and safe example value.
- Architecture documentation must describe current behavior, not aspirational features.
- Product-facing Spanish copy belongs in UI, templates, seed/demo content, or clearly named product documentation.

## Git Workflow

- Branch names must be lowercase and descriptive.
- Use prefixes: `feature/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`, or `codex/`.
- Keep PRs small and reviewable.
- PR titles must describe the user-visible or engineering outcome.
- PR descriptions must include:
  - Summary of changed areas.
  - Validation commands run.
  - Screenshots or export samples for meaningful UI/export changes.
  - Notes about migrations, new environment variables, or operational impact.
- Do not commit `.env` files, credentials, generated secrets, local build output, or unrelated formatting churn.
- Commit messages must be in English and describe the change in imperative or concise present-tense form.

## Review Standard

Code reviews must prioritize:

- Security and authorization gaps.
- Bugs and workflow regressions.
- Missing validation or sanitization.
- Missing tests for changed behavior.
- API contract breaks.
- Export correctness.
- Product behavior for non-technical users.

A PR must not be approved while known PR-blocking issues remain unresolved.

## Validation Before Handoff

Before finishing work:

- Run the relevant build/lint/test commands for touched areas.
- Report any command that could not be run and why.
- Verify no secrets, `.env` values, debug logs, or temporary files were introduced.
- Verify user-facing text is Spanish and technical text is English.
