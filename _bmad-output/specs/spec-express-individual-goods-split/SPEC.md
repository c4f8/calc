---
id: SPEC-express-individual-goods-split
companions:
  - ../../../docs/project-context.md
  - ui-contract.md
  - domain-contract.md
  - verification.md
sources:
  - ../../../src/components/calculator/CalculatorExperience.tsx
  - ../../../src/components/admin/CatalogManager.tsx
  - ../../../src/app/api/admin/catalog/route.ts
  - ../../../src/lib/calc.ts
  - ../../../src/lib/validation.ts
  - ../../../src/types/domain.ts
  - ../../../prisma/schema.prisma
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only.

# Express / Individual Goods Split

## Why

The client chose a surgical UI direction that splits the customer Goods menu into `Экспресс` and `Индивидуальный расчёт` while keeping the existing ARCHIPELAG Calculator identity. This solves a pricing clarity gap: the same **Good** may need a different cost or availability depending on the selected calculation mode, and admins need to manage that without losing the current compact Admin Catalog workflow.

## Capabilities

- id: CAP-1
  intent: Customers can choose between `Экспресс` and `Индивидуальный расчёт` inside the existing Calculator flow.
  success: Switching the mode changes visible/available **Goods**, active prices, line totals, and the total estimate without replacing the current mobile-first layout.

- id: CAP-2
  intent: Customers can see which price applies in the active mode and understand when a **Good** has a different price in the other mode.
  success: A **Good** available in both modes displays the active mode price as primary and the other mode price as muted secondary context without crowding the selected Goods list.

- id: CAP-3
  intent: Admins can assign each **Good** to `Экспресс`, `Индивидуальный расчёт`, or both.
  success: Saving the Admin Catalog persists mode membership, rejects a **Good** with no mode membership, and public Calculator data never exposes a **Good** outside its assigned modes.

- id: CAP-4
  intent: Admins can manage mode-specific costs for each **Good** in the Admin Catalog.
  success: The catalog row exposes separate Express and Individual price inputs for the existing pricing basis, saves valid values, and recalculates the customer total from the active mode price.

- id: CAP-5
  intent: Estimate snapshots and exports preserve the chosen calculation mode and mode-specific prices.
  success: Opening `Поделиться расчётом` freezes the active mode, selected **Goods**, active price rules, line amounts, and total into one immutable snapshot used by the export panel, **Estimate Card**, and **Estimate Message**.

- id: CAP-6
  intent: Desktop presentation is polished while preserving the existing mobile-first product surface.
  success: Customer and admin screens have no overlapping text, clipped controls, or awkward empty space on representative mobile and desktop widths, and still read as the current ARCHIPELAG UI.

## Constraints

- The selected mockup is a reference direction only; implementation must update the existing app UI, not replace it with a generated redesign.
- Preserve Russian-only product UI, ARCHIPELAG monochrome styling, Mont typography, thin dividers, black icon tiles, restrained controls, and calm premium motion.
- Preserve current **Good** invariants: disabled **Goods** are not public, required **Goods** cannot be deselected, required **Goods** force `selectedByDefault`, and archive remains soft-delete.
- Admin Catalog remains the authority for **Good** visibility, required/default state, order, icon, accent, pricing, and mode membership.
- Settings remain in `Настройки`; do not move mode/pricing work into Settings.
- Admin mutation routes must keep server-side auth, same-origin checks, validation before mutation, audit logging, and path revalidation.
- Do not touch secrets, `.env`, runtime data, external services, deployment config, generated Prisma client files, or unrelated dirty files.

## Non-goals

- No new public quote/checkout/CRM flow.
- No direct Instagram DM automation.
- No customer profile, saved lead database, or free-text Estimate Card comments.
- No generic UI kit, colorful SaaS dashboard redesign, decorative gradients, hero section, or marketing page.
- No hard-delete behavior for **Goods**.
- No production deployment, external database migration execution, or secret/config change as part of this spec.

## Success signal

A client can compare `Экспресс` and `Индивидуальный расчёт` inside the familiar Calculator, see the estimate change correctly, and export a snapshot that preserves the selected mode. An admin can open Catalog, assign mode membership and different prices per **Good**, save, and immediately see the public Calculator reflect those values without visual regressions on mobile or desktop.

## Assumptions

- A **Good** uses one pricing basis (`₽/м²` or `Фикс.`) shared across both modes, while the numeric price can differ by mode.
- Existing catalog prices should migrate/populate both Express and Individual prices unless a later migration plan says otherwise.
- The default customer mode should be `Экспресс` because the chosen mockup emphasizes it as the first/active segment.

## Open Questions

- Should every required **Good** be required in every assigned mode, or can required status become mode-specific?
- Should the **Estimate Message** include the selected mode line, given the current product truth also flags a separate mismatch about per-Good price detail?
- Should customer mode selection persist across sessions, or reset to the default on each visit?
