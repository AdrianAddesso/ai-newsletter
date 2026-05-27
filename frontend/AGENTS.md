# Frontend AGENTS.md

## Scope

These instructions apply to `frontend`, a React + Vite + MUI application for Spanish-speaking internal users.

The frontend helps users generate, edit, preview, review, approve, and export newsletters. The UI language is Spanish. Source code remains English.

Follow the root `AGENTS.md` first. This file adds frontend-specific rules.

## Product UX

- Build product screens for newsletter workflows, not generic marketing pages, unless the task explicitly asks for a landing page.
- Every page must make the next user action obvious.
- Keep primary, secondary, and destructive actions visually distinct.
- Use concise Spanish copy for labels, instructions, validation messages, empty states, and errors.
- Design for non-technical internal users who need clear workflows and low-friction recovery from mistakes.
- Handle loading, empty, error, success, and permission-denied states for async UI.

## Brand and Design

- Use `src/styles/appMuiTheme.ts` as the source of truth for MUI theme tokens.
- Use MUI components and theme tokens before custom CSS.
- Reuse assets from `src/assets`.
- Do not duplicate fonts, logos, brand shapes, or keyword graphics.
- Follow the brand guideline PDF in `/ref` when designing new pages.
- Keep layouts responsive for desktop, tablet, and mobile preview widths.
- Do not add decorative assets that do not support the page task.
- Do not create one-off visual systems outside the application theme.

## Implementation

- Use React components with TypeScript.
- Keep component, hook, variable, and file names in English.
- Keep user-facing text in Spanish.
- Use Axios for backend calls when an HTTP client is needed.
- Read the backend base URL from environment configuration such as `VITE_API_URL`.
- Do not hardcode production secrets, backend credentials, storage provider keys, AI credentials, or tenant-specific values in frontend code.
- Do not use `any`.
- Define explicit prop, state, and API response types.
- Keep API adapters isolated from presentation components.
- Do not store sensitive data in `localStorage` or `sessionStorage` unless the task explicitly requires it and the security impact is reviewed.
- Avoid `dangerouslySetInnerHTML`. If HTML rendering is required, sanitize the content first and document the trust boundary in code.

## API and State Handling

- Treat backend responses as untrusted until validated or narrowed at the boundary.
- Keep request and response handling in typed API modules or hooks.
- Use the backend/database enum values from the root `AGENTS.md` for API contracts and state comparisons.
- Display enum values with Spanish UI labels instead of showing raw enum identifiers to users.
- Map backend errors to Spanish user-facing messages.
- Do not reveal stack traces, provider details, tokens, or raw backend error payloads in the UI.
- Disable or guard actions that the authenticated user cannot perform, but never rely on frontend checks for authorization.
- Preserve version IDs and `newsletter_state` values returned by the backend; do not invent approval state on the client.

## Accessibility

- Use semantic HTML for structure.
- Inputs must have visible labels or accessible names.
- Buttons and interactive controls must be keyboard accessible.
- Focus order must follow the visual workflow.
- Color contrast must remain readable against the application theme.
- Do not communicate state using color alone.
- Error messages must identify the field or action that failed.

## Newsletter Authoring and Preview

- Keep authoring UI, preview UI, and exported newsletter markup separate.
- Do not include editor controls, debug metadata, or React-only markup in exported newsletter output.
- Preview structures must be able to map cleanly to MJML or email-safe HTML.
- Treat export compatibility as a product requirement, not a visual afterthought.
- Prioritize Microsoft Edge compatibility for corporate browser usage.
- Test meaningful visual changes at desktop and mobile preview widths.

## Testing

Required for PRs that touch the related behavior:

- Component or integration tests for complex forms, async workflows, and permission-sensitive UI when test tooling exists.
- Regression tests for bug fixes when the behavior can be reproduced with existing tooling.
- Manual verification notes for visual changes, responsive behavior, preview rendering, and export-facing markup when automated coverage is unavailable.

Frontend changes must not be handed off with known TypeScript, lint, or production build failures.

## Commands

Run from `frontend`:

- Install dependencies: `pnpm install`
- Development server: `pnpm run dev`
- Lint: `pnpm run lint`
- Build: `pnpm run build`
- Preview production build: `pnpm run preview`

Before finishing frontend code changes, run:

- `pnpm run lint`
- `pnpm run build`

If a command cannot run because local services or environment variables are missing, report the exact command and blocker.
