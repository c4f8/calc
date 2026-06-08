---
spec: SPEC-express-individual-goods-split
type: companion
---

# UI Contract

## Mockup Interpretation

The client-selected mockup establishes direction, not final pixels. Keep these parts:

- Customer Calculator remains the current phone-like ARCHIPELAG surface: `A / G`, `Расчёт интерьера`, area card, selected **Goods**, total, and `Поделиться расчётом`.
- Add a quiet two-segment mode selector near the selected Goods heading:
  - `Экспресс`
  - `Индивидуальный расчёт`
- Show active mode price as the primary row price.
- When the other mode has a different price and the **Good** belongs to both modes, show the other price as muted secondary context.
- Keep required **Goods** understated with `в составе`.
- Admin Catalog remains a dense editable row/list, not a new dashboard.
- Admin rows add compact mode membership controls and two price inputs labeled for Express and Individual.

Ignore these mockup artifacts:

- Any redesign that changes the app brand, typography, palette, button language, or background system.
- Any generated visual noise, excessive rounding, fake sidebar changes, stock-like presentation, or marketing layout.
- Any admin density that makes rows unreadable on desktop or collapses mobile controls into overlapping fields.

## Customer Calculator

The customer UI should remain mobile-first. The normal selected Goods state still shows selected **Goods** only; all visible **Goods** remain behind `Изменить`.

Mode selector behavior:

- The selector belongs inside the Goods section, below or adjacent to `Выбранные товары`, before the Goods list.
- The active segment is black with light text; inactive segment is light with a thin border.
- Segment labels must remain readable on narrow mobile screens; `Индивидуальный расчёт` may wrap only if the control still looks intentional.
- Switching mode should keep the current area and export state closed.
- Switching mode should recalculate totals immediately.
- If a selected optional **Good** is unavailable in the new mode, it should be ignored for that mode rather than shown as selected.

Good row behavior:

- Active price stays in the current right-aligned price position.
- Secondary mode price, when shown, is smaller and muted under the active price.
- Fixed prices keep `фикс.`; area prices keep `/м²`.
- The existing black icon tile, title, description, and divider rhythm remain.
- Editing state keeps the current check affordance and disabled required behavior.

Total/export behavior:

- The total card should make the active calculation mode clear without adding a heavy header.
- `Поделиться расчётом` remains the export action.
- Export panel and **Estimate Card** should identify the calculation mode in low-noise Russian copy, for example `Тип расчёта: Экспресс`.

## Admin Catalog

Admin row additions should fit the existing row model:

- Add a `Группы` or equivalent compact control with three states: Express only, Individual only, both.
- Add two price fields under `Цена`: `Экспресс` and `Индивидуальный`.
- Keep one `Режим` selector for the pricing basis, unless an open question later changes this.
- For a **Good** assigned to only one mode, the inactive mode price field may be disabled, hidden, or visibly secondary, but the row must still explain which mode is active.
- Save failure copy should remain calm and concise.
- Existing icon picker, color picker, enabled/required/default switches, drag handle, visibility pill, and archive action remain.

Desktop polish:

- Catalog rows should align labels and fields across rows at common desktop widths.
- Dense rows may use horizontal space, but controls must remain scannable without overlapping.
- Mobile admin layout may stack fields, but each control needs stable height and readable labels.

## Visual Boundaries

- No new color palette.
- No gradient hero, decorative blobs, or image backgrounds.
- No new card-heavy landing screen.
- No visible instructional copy that explains the feature to the user.
- No text overlap, clipped long Russian labels, or price wrapping that makes totals ambiguous.
