---
project_name: calc
user_name: Chef
date: 2026-06-08
sections_completed:
  - technology_stack
  - product_truth
  - language_rules
  - framework_rules
  - testing_rules
  - quality_rules
  - workflow_rules
  - anti_patterns
status: complete
rule_count: 58
optimized_for_llm: true
sources:
  - ../CONTEXT.md
  - production-launch-checklist.md
  - ../package.json
  - ../package-lock.json
  - ../prisma/schema.prisma
  - ../prisma/seed.ts
  - ../src/lib/admin-security.ts
  - ../src/lib/auth.ts
  - ../src/lib/admin-mutation-guard.ts
  - ../src/lib/audit.ts
  - ../src/lib/rate-limit.ts
  - ../src/lib/calc.ts
  - ../src/lib/validation.ts
  - ../src/lib/data.ts
  - ../src/components/calculator/CalculatorExperience.tsx
  - ../src/components/calculator/ExportPanel.tsx
  - ../src/components/calculator/EstimateCard.tsx
---

# Project Context for AI Agents

_Critical rules and patterns AI agents must follow when implementing code in this repository._

## Canonical Governance

- BMad is the target governance system for this repository.
- Canonical project knowledge belongs under `docs/`; this file is the current BMad project context.
- BMad artifact roots are `_bmad-output/specs/`, `_bmad-output/planning-artifacts/`, `_bmad-output/implementation-artifacts/`, and `_bmad-output/test-artifacts/`.
- Durable BMad team customizations belong under `_bmad/custom/`; installer-owned BMad config is not the place for hand edits.
- `CONTEXT.md` remains a source of product truth until its facts are fully migrated and verified.
- `docs/superpowers/**` is legacy/historical workflow material. Preserve valid decisions, but do not use its `superpowers:*` execution instructions for future work.
- Dirty worktree safety is mandatory. Run `git status --short` before edits and do not revert, overwrite, stage, commit, or push unrelated user changes.
- Current known dirty state at generation time: `.agents/` and `_bmad/` are untracked.

## Technology Stack & Versions

- App: Next.js App Router `16.2.4`, React `19.2.5`, React DOM `19.2.5`, TypeScript `6.0.3`.
- Data: Prisma `7.8.0`, `@prisma/client` `7.8.0`, `@prisma/adapter-pg` `7.8.0`, PostgreSQL datasource.
- Auth: `@simplewebauthn/browser` and `@simplewebauthn/server` `13.3.0`, password bootstrap, HttpOnly session cookies.
- UI/UX: custom CSS, ARCHIPELAG Mont fonts, Motion for React `12.38.0`, `html-to-image` `1.11.13`, `@dnd-kit/core` `6.3.1`.
- Validation and helpers: Zod `4.4.3`, `clsx` `2.1.1`, `pg` `8.20.0`, `dotenv` `17.4.2`.
- Tooling: ESLint `9.39.4`, `eslint-config-next` `16.2.4`, `tsx` `4.21.0`.
- TypeScript is strict, `allowJs` is false, module resolution is `bundler`, JSX mode is `react-jsx`, and `@/*` maps to `src/*`.
- Prisma Client is generated into `src/generated/prisma`; avoid treating generated files as hand-editable source.
- Next dev config disables dev indicators and ignores `.git`, `.next`, `node_modules`, `Brandbook_ARCHIPELAG`, `src/generated/prisma`, `prisma/dev.db*`, and `.playwright-mcp` watcher paths.

## Product Truth

- Product: ARCHIPELAG-styled interior cost Calculator with customer estimate export and admin-managed sellable catalog.
- Use canonical terms exactly: **Good**, **Calculator**, **Admin Catalog**, **Estimate Card**, **Estimate Message**.
- Avoid legacy/general synonyms for the editable catalog unit: product, service item, package.
- A **Good** is admin-editable and may be a service, material option, supervision item, or package-like sellable item.
- The **Calculator** combines project area and selected enabled **Goods** into a non-binding estimate, not an official quote.
- The **Admin Catalog** controls **Good** name, description, icon, color, pricing, enabled state, required state, default-selected state, and order.
- Disabled **Goods** must not appear in customer-facing Calculator estimates.
- Required **Goods** are always included, cannot be deselected by customers, and are forced `selectedByDefault` on catalog save.
- Deleting a **Good** means archive/soft-delete, not hard delete, so historical estimate snapshots stay understandable.
- Area can be decimal square meters; money is calculated with precision and displayed as whole rubles.
- Area limits and default area are admin settings; out-of-range input clamps on commit/blur with a calm min/max hint.
- Currency is hardcoded to Russian ruble for v1.
- Russian is the only customer/admin product language for v1.
- The customer-facing Calculator is mobile-first and intentionally minimal: area input, selected **Goods**, total, and `Поделиться расчётом`.
- Selected **Goods** are shown by default. Editing all visible **Goods** is behind the explicit `Изменить` state.
- Customer-facing selected **Goods** are non-interactive outside edit mode to avoid accidental removal.
- Required **Goods** should use understated premium treatment, currently `в составе`, not a noisy lock-like disabled state.
- The approved visual baseline is monochrome ARCHIPELAG: light paper surface, thin dividers, black icon tiles, restrained Mont typography, large numerals, and low-noise actions.
- Premium motion is part of the product feel; use subtle number morphing, row transitions, panels, and step-state motion, not playful bounce/flashing.

## Estimate Export Rules

- `Поделиться расчётом` is the canonical export action label because it covers native share, PNG download, copied text, and Instagram opening without overpromising DM automation.
- Opening the export panel freezes area, selected **Goods**, prices, tax text, date, and brand/contact settings into one immutable `EstimateSnapshot`.
- Closing the export panel returns to the Calculator without losing current inputs; editing after close creates a new snapshot on the next export.
- The guided export panel title is `Готово к отправке`.
- Export flow order is: copy **Estimate Message**, share/save PNG **Estimate Card**, then open Instagram if configured.
- The app must not assume it can force a direct Instagram DM, preselect a recipient, or guarantee Instagram accepts text and PNG in one step.
- `Открыть Instagram` opens the configured public Instagram page only.
- Hide Instagram actions if no Instagram handle is configured.
- **Estimate Card** is a real rendered DOM export via `html-to-image`, not a fake placeholder.
- PNG export target is 1080x1350 px, Instagram-friendly 4:5 portrait.
- **Estimate Card** must include area, selected **Goods**, total, preliminary estimate copy, calculation date, and brand/contact settings.
- Fixed disclaimer copy: `Расчёт предварительный. Финальная стоимость уточняется после обсуждения проекта.`
- Tax/VAT label is admin-customizable and hidden if empty.
- **Estimate Card** stays one card. Up to 12 selected **Goods** use adaptive density; above 12 switches to ultra-compact names-only treatment.
- **Estimate Message** is generated from the same immutable snapshot, contains calculated data only, and should stay short for Instagram DM/studio operations.
- Current implementation includes per-Good price details in `makeEstimateMessage`; `CONTEXT.md` says the desired default should list **Good** names only. Treat this as a product/implementation mismatch to resolve deliberately, not silently.

## Data Model & Domain Rules

- Prisma models: `AdminUser`, `AdminSession`, `AdminPasskey`, `AdminAuthChallenge`, `AdminAuditEvent`, `AdminRateLimit`, `Good`, and singleton `Settings`.
- `Good.pricingMode` is currently `area` or `fixed`; a custom formula is only a possible future extension.
- Public calculator data reads only non-archived and enabled **Goods**, ordered by `order`.
- Admin catalog data reads non-archived **Goods**, including disabled ones, ordered by `order`.
- Settings use singleton id `default`.
- Good icons are a curated set: `plan`, `chair`, `materials`, `helmet`, `ruler`, `light`, `box`, `plant`, `dots`.
- Invalid persisted icon values map to `dots`; invalid pricing mode values map to `area`.
- Admin settings include brand name, short mark, Instagram handle, website handle, website URL, tax label, min area, max area, and default area.
- Instagram handle is stored without `@`; customer-facing UI displays it with `@`.

## Security & Privacy Invariants

- Do not touch `.env`, credentials, secrets, private user data, runtime database files, DNS, VPS state, Vercel settings, or external services unless explicitly requested.
- Admin pages and admin APIs require server-side checks. UI visibility is never the security boundary.
- Admin sessions use random tokens stored as SHA-256 hashes in the database and HttpOnly cookies.
- Production admin sessions last 12 hours; development sessions keep 30-day convenience lifetime.
- Admin mutation routes must call `requireAdminMutation(request)` before parsing JSON or mutating state.
- Same-origin checks reject mismatched or malformed origins with `403`; unauthenticated admin mutation attempts return `401`.
- Cookie-authenticated admin writes rely on the shared same-origin guard as the current CSRF protection boundary.
- Password login and passkey endpoints are throttled through `AdminRateLimit`.
- Security-relevant admin events are append-only `AdminAuditEvent` rows.
- Audit metadata must not include passwords, tokens, sessions, secrets, challenges, credentials, or public keys.
- `AUDIT_IP_HASH_SECRET` is required in production-like runtimes and must not be the placeholder.
- WebAuthn requires secure context: `localhost` for local desktop testing or real HTTPS origin for device/client testing; LAN HTTP is intentionally not secure for passkeys.
- `WEBAUTHN_ORIGIN` must exactly match the deployed HTTPS origin; `WEBAUTHN_RP_ID` must be hostname only.
- Production-like seed requires `ADMIN_EMAIL`, `ADMIN_NAME`, and a unique `ADMIN_PASSWORD` of at least 14 characters, not known placeholders such as `archipelag`.

## Implementation Patterns

- Put server-only helpers behind `import 'server-only'`.
- Keep API route validation at the boundary with Zod `safeParse`; return `400` with structured issues for invalid payloads.
- Use Prisma transactions for multi-step catalog writes.
- Revalidate `/`, `/admin/catalog`, and `/admin/settings` after catalog/settings mutations.
- Keep domain view types in `src/types/domain.ts`; map Prisma rows into view types through `src/lib/mappers.ts`.
- Keep calculation formatting and estimate math in `src/lib/calc.ts`.
- Customer state belongs in client components such as `CalculatorExperience`; database reads belong in server helpers/pages.
- Use `Set<string>` for selected **Good** ids in the Calculator.
- Treat snapshot creation as the boundary between live Calculator state and export state.
- Use `AnimatePresence` and `motion` for calm transitions already established in Calculator and export panel.
- Use custom CSS classes in `src/app/globals.css`; do not introduce a generic UI kit.
- Keep ARCHIPELAG Mont fonts and brand assets aligned with `Brandbook_ARCHIPELAG`.
- Prefer existing icon system in `src/lib/icons.tsx` for curated inline SVG icons.

## Testing & Verification Rules

- Run `npm run typecheck` after TypeScript changes.
- Run `npm run lint` after code/style changes.
- Run `npm run build` only with valid production database environment, because build runs `prisma migrate deploy`, seed, and `next build`.
- `prisma validate`, typecheck, and lint can run without connecting to production.
- Existing security helper tests are in `src/lib/admin-security.test.ts` and run with `./node_modules/.bin/tsx --test src/lib/admin-security.test.ts`.
- For launch verification, check public calculator load, admin login, passkey registration/login, Settings save, Catalog save, public data reflection, PNG export, same-origin unauthenticated `401`, cross-origin `403`, login throttling, and audit rows.
- After governance/doc migrations, run changed-doc readback, old-term scan, BMad canonical-path scan, `git diff --check`, and `git status --short`.

## Development Workflow Rules

- Do not stage, commit, push, reset, checkout, or revert unless the user explicitly asks.
- Do not install packages unless the user explicitly asks.
- Do not run database migrations or seed against remote/production databases unless explicitly requested and environment is confirmed.
- Do not edit generated Prisma client files in `src/generated/prisma`.
- Do not edit runtime artifacts: `.next`, `.playwright-mcp`, `prisma/dev.db`, screenshots, generated exports, or private local files.
- Legacy `docs/superpowers/**` plans may contain real decisions but stale execution instructions; migrate decisions into BMad artifacts before relying on them.
- Deployment truth is currently ambiguous: `CONTEXT.md` mentions Vercel preview/client feedback deployment, while legacy VPS docs target `https://info.aglab.pro` on an Ubuntu VPS. Ask or document the active target before deployment work.

## Critical Don't-Miss Rules

- Do not expose user files, secrets, workspaces, local services, environment values, or private admin data.
- Do not hardcode production credentials or copy `.env` values into docs or code.
- Do not make disabled **Goods** visible in the public Calculator.
- Do not let required **Goods** be deselected in customer UI or saved as not selected by default.
- Do not replace soft-delete/archive behavior with hard delete.
- Do not convert the Calculator estimate into an official quote.
- Do not add client profile, lead database, CRM history, free-text Estimate Card comments, or direct Instagram DM automation for v1 without new product approval.
- Do not move admin Settings into Admin Catalog; Settings live in a separate `Настройки` tab.
- Do not add reset-all settings behavior for v1.
- Do not make tax/VAT copy hardcoded where the product expects admin-customizable and hideable text.
- Do not continuously generate PNG on every Calculator change; generate after export action opens the guided panel.
- Do not remove fallback export paths: copy fallback, PNG download, and Instagram opening need graceful degradation.
- Do not treat LAN HTTP as passkey-compatible; passkeys need localhost or HTTPS.
- Do not rely only on client-side checks for admin authorization or mutation protection.

## Open Ambiguities

- Decide whether `CONTEXT.md` remains a maintained product ledger or becomes historical after BMad migration.
- Decide whether canonical context should remain `docs/project-context.md` or be mirrored to root `project-context.md` for tools that default there.
- Reconcile Vercel/Postgres deployment notes with VPS/Caddy/PostgreSQL deployment docs before production deployment.
- Resolve whether **Estimate Message** should list only **Good** names as stated in product truth or keep current per-Good price details.
- Decide whether `.agents/` and `_bmad/` should be committed, ignored, or treated as local install output.

## Usage Guidelines

For AI agents:

- Read this file before implementing code.
- Follow these rules unless a newer BMad artifact explicitly supersedes them.
- When a rule conflicts with current code, surface the conflict before changing behavior.
- Keep future updates lean and focused on rules that prevent real implementation mistakes.

For humans:

- Update this file when product truth, stack, deployment target, or security rules change.
- Move expansive product detail into BMad specs/planning artifacts; keep this file optimized for agent working memory.
- Review after each major migration or launch-readiness change.

Last Updated: 2026-06-08
