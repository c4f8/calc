---
spec: SPEC-express-individual-goods-split
type: companion
---

# Verification

## Static Checks

- `npm run typecheck`
- `npm run lint`
- `npx prisma validate`
- `git diff --check`
- `git status --short`

Do not run production build unless a valid production-like database environment is intentionally confirmed, because project context says build runs Prisma deployment/seed work.

## Manual Functional Checks

Customer Calculator:

- Load `/` on mobile width and desktop width.
- Confirm the UI still matches the existing ARCHIPELAG Calculator, with only surgical additions for `Экспресс` / `Индивидуальный расчёт`.
- Confirm default mode is `Экспресс`.
- Toggle to `Индивидуальный расчёт`; total and active prices update.
- Confirm **Goods** unavailable in the active mode are not included in the estimate.
- Confirm required **Goods** cannot be deselected in edit mode.
- Confirm optional **Goods** can still be selected/deselected only after `Изменить`.
- Confirm long Russian labels and prices do not overlap or clip.

Admin Catalog:

- Log in as admin.
- Open `/admin/catalog`.
- Set a **Good** to Express only, Individual only, and both.
- Set different Express and Individual prices.
- Save Catalog and confirm success state.
- Reload public Calculator and confirm mode-specific visibility/pricing.
- Confirm disabled **Goods** remain absent from the public Calculator.
- Confirm archiving remains soft-delete behavior.

Export:

- Open `Поделиться расчётом` from each mode.
- Confirm snapshot preserves mode, selected **Goods**, active prices, line amounts, and total.
- Confirm **Estimate Card** and **Estimate Message** do not recalculate from changed live state after panel opens.
- Confirm PNG export fallback behavior still works.

Security:

- Confirm unauthenticated admin catalog mutation returns `401`.
- Confirm cross-origin admin catalog mutation returns `403`.
- Confirm validation failure returns `400` with structured issues.
- Confirm audit row is written for catalog save without secret-bearing metadata.

## Browser Visual Checks

- Capture customer Calculator at narrow mobile, phone-shell desktop, and wide desktop.
- Capture Admin Catalog at mobile/tablet/desktop widths.
- Check canvas/export preview is nonblank if export UI is touched.
- Reject results that look like a new product design rather than the existing ARCHIPELAG UI with the mode split added.

## Dirty-Tree Safety

- Before implementation, run `git status --short`.
- Do not touch `.env`, secrets, private data, runtime database files, external services, deployment config, generated Prisma client files, or unrelated dirty files.
- After implementation, confirm only intended product/docs/artifact files changed.
