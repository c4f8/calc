---
spec: SPEC-express-individual-goods-split
type: companion
---

# Domain Contract

## Terms

- **Calculation mode**: the customer-selected mode, either `Экспресс` or `Индивидуальный расчёт`.
- **Mode membership**: whether a **Good** is available in Express, Individual, or both.
- **Mode price**: the numeric price used for a **Good** in a calculation mode.

Canonical terms from `docs/project-context.md` remain authoritative: **Good**, **Calculator**, **Admin Catalog**, **Estimate Card**, and **Estimate Message**.

## Current Evidence

- `GoodView` currently has one `pricingMode`, `pricePerSqm`, and `fixedPrice`.
- `calculateGoodAmount` currently calculates from that one price.
- `calculateEstimateLines` currently filters by enabled/required/selected only.
- `CatalogManager` currently edits one price per **Good**.
- `catalogPayloadSchema` and the admin catalog route currently validate and persist one price per **Good**.
- `Good` in Prisma currently stores one price basis and one price value pair.

## Required Domain Behavior

Mode membership:

- A **Good** must belong to at least one calculation mode.
- Public Calculator data should include only enabled, non-archived **Goods**, with enough mode membership data for the client to filter/render correctly.
- Disabled **Goods** remain absent from customer-facing estimates regardless of mode membership.
- Archived **Goods** remain hidden from normal Admin Catalog and public Calculator data.

Pricing:

- Each **Good** keeps one pricing basis: `area` or `fixed`.
- A **Good** can have separate Express and Individual numeric prices for that pricing basis.
- If a **Good** is available in both modes, both relevant prices must be valid non-negative integers.
- If a **Good** is available in only one mode, the inactive mode price must not be used in customer totals.
- Area prices multiply by area; fixed prices do not.

Selection and required behavior:

- Required **Goods** are always included in calculations for modes where they are available.
- Optional **Goods** remain customer-selectable only in edit mode.
- `selectedByDefault` still controls initial selected state for optional **Goods**, limited to modes where the **Good** is available.
- Existing selected IDs may remain global, but estimate calculation must ignore selected **Goods** unavailable in the active mode.

Snapshots/export:

- `EstimateSnapshot` needs to preserve the active calculation mode.
- Each `EstimateLine` needs to preserve the active mode price rule and amount.
- Exported **Estimate Card** and **Estimate Message** must be generated from the snapshot, not live state.

Persistence/migration:

- Existing catalog entries should remain valid after introducing mode membership and mode prices.
- Default migration behavior should assign existing **Goods** to both modes and copy the existing price into both mode prices unless the implementation plan deliberately chooses another safe default.
- Generated Prisma client files must not be hand-edited.

## Validation Boundaries

- Admin catalog payload validation must reject invalid mode membership, invalid negative prices, invalid pricing basis, and overlong labels.
- Admin mutations must keep `requireAdminMutation(request)` before JSON parsing/mutation.
- Audit metadata may include aggregate counts such as number of **Goods** saved, but must not include secrets, credentials, sessions, tokens, or private values.
