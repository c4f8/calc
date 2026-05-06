# Interior Calculator

An ARCHIPELAG-styled calculator for estimating interior design project cost and managing the sellable catalog shown to customers.

## Language

**Good**:
An admin-editable sellable item that can appear in the calculator, such as a service, material option, supervision item, or package.
_Avoid_: Product, service item, package when referring to the general editable catalog unit

**Calculator**:
The customer-facing flow that combines project area and selected **Goods** into an estimated project cost.
_Avoid_: Form, wizard when referring to the whole customer experience

**Admin Catalog**:
The admin-facing area where **Goods** are named, priced, ordered, colored, iconized, enabled, or disabled.
_Avoid_: Settings page, products page

**Estimate Card**:
A client-generated visual summary of a **Calculator** estimate, intended to be sent to the studio through Instagram DM.
_Avoid_: Instagram ad, public marketing export when referring to the client handoff card

**Estimate Message**:
A client-copyable plain-text version of a **Calculator** estimate, intended to be pasted into Instagram DM alongside the **Estimate Card** so the studio can quickly read, copy, and work with the calculation details.
_Avoid_: Comment, note, client brief, CRM record

## Relationships

- A **Calculator** presents zero or more enabled **Goods**.
- An **Admin Catalog** manages zero or more **Goods**.
- A **Good** can be priced by area, fixed price, or custom formula if later needed.
- A **Good** must use exactly one pricing mode at a time.
- The **Calculator** output is an estimate (non-binding), not an official commercial quote.
- A **Calculator** estimate should provide a transparent breakdown: per-selected-**Good** contribution plus total.
- **Admin Catalog** exclusively controls customer visibility of **Goods** through enabled/disabled state.
- **Admin Catalog** controls which visible **Goods** are selected by default when the **Calculator** opens.
- **Admin Catalog** can mark **Goods** as required; required **Goods** are always included in **Calculator** estimates and cannot be deselected by customers.
- Disabled **Goods** are absent from new **Calculator** estimates, even if marked required or selected by default.
- **Admin Catalog** should be present in the prototype rather than simulated only with hardcoded sample **Goods**.
- **Good** editor should include name, description, icon, color, price, pricing mode, enabled state, required state, default-selected state, and order.
- **Good** icons should come from a curated premium icon set in the first version; custom icon upload is out of scope for v1.
- **Good** color should be used elegantly in the customer-facing website UI, especially icon tiles or small indicators, while the exported **Estimate Card** remains primarily monochrome with possible restrained accent treatment still to be explored.
- Deleting a **Good** should archive or soft-delete it rather than permanently deleting it, so historical estimate snapshots stay understandable.
- Archived **Goods** should not pollute the normal **Admin Catalog** view; they should be hidden from everyday editing unless a recovery/history view is explicitly added later.
- Historical estimates should be immutable snapshots of selected **Goods** and their pricing inputs at calculation time.
- **Calculator** area can use decimal square meters; money is calculated with precision and displayed as whole rubles.
- **Calculator** area limits are admin-configured settings that define the supported estimate range.
- When entered area is outside the supported range, the **Calculator** clamps it to the nearest configured area limit.
- Out-of-range area input stays editable while typing, then visibly morphs to the nearest limit on commit/blur with a brief calm min/max hint.
- Area limits are shown only while the area input is being edited, preserving a premium low-noise Calculator surface.
- **Calculator** estimates update immediately when area or selected **Goods** change.
- Live estimate changes should use calm premium recalculation motion: subtle number morphing and row transitions, without playful bounce or flashing.
- The customer-facing **Calculator** should be designed mobile-first; desktop can adapt from the same focused structure later.
- The first customer-facing **Calculator** surface should stay minimal: area input, selected **Goods**, total, and the "Поделиться расчётом" action.
- Disabled **Goods** should not be visible anywhere in the customer-facing **Calculator**.
- Required **Goods** need an understated premium state treatment that makes inclusion clear without looking disabled, blocked, or noisy; the exact visual indicator is still unresolved.
- Preferred required-**Good** state direction for the prototype is a thin filled vertical rail with subtle "в составе" text, rather than a lock icon or toggle.
- Premium motion design is part of the first-version product feel, not optional late polish.
- The product does not require a client database for the first version; the **Estimate Card** carries the information the studio sees first in Instagram DM.
- The customer generates the **Estimate Card** after calculating on the website and sends it to the studio manually, usually with a short Instagram DM message.
- The studio's first structured view of a lead is the **Estimate Card** plus whatever message the customer writes; do not assume saved customer profiles, lead records, or CRM-style history in the first version.
- **Estimate Card** should contain only calculated estimate data, not a free-text comment field; project discussion belongs in Instagram DM conversation.
- **Estimate Card** should feel like a premium digital business card: useful as a DM handoff, comfortable to read, and branded enough to be shareable.
- **Estimate Card** is exported as a PNG image that the customer can send manually through Instagram DM.
- **Estimate Card** PNG should be optimized for comfortable phone viewing inside Instagram DM.
- **Estimate Card** visual language should stay compatible with future physical business-card usage, so it should avoid web-only decoration that would not translate to print.
- Website calculator, PNG **Estimate Card**, and future physical business card should share one coherent ARCHIPELAG visual system: monochrome palette, thin borders, architectural spacing, large numerals, and restrained receipt-like breakdown.
- **Estimate Card** should present exact totals with strong context: area, selected **Goods**, per-**Good** estimate details, and preliminary-estimate language.
- **Estimate Card** should show all selected **Goods** so the estimate scope is understandable from a single card, while still handling variable selected-**Good** counts gracefully.
- **Estimate Card** should include the calculation date in a small, low-noise footer/detail area so forwarded or later-viewed PNGs have pricing context.
- **Estimate Card** tax/VAT wording (for example, "вкл. НДС") should be admin-customizable rather than hardcoded.
- If the admin leaves tax/VAT wording empty, **Estimate Card** and related customer-facing estimate UI should hide the tax/VAT line completely.
- **Estimate Card** preliminary-estimate disclaimer should be fixed product copy, not admin-customizable: "Расчёт предварительный. Финальная стоимость уточняется после обсуждения проекта."
- **Estimate Card** PNG export default size is 1080x1350 px for Instagram-friendly 4:5 portrait usage.
- **Estimate Card** PNG filename should include brand, area, and calculation date, for example `archipelag-estimate-85m2-2026-05-06.png`.
- **Estimate Card** calculation date should display in compact Russian date format, for example `06.05.2026`.
- **Estimate Card** should use one-card adaptive layout up to 12 selected **Goods**.
- **Estimate Card** should avoid multi-page export in the first version; above 12 selected **Goods**, keep one card and switch to an ultra-compact names-only list.
- **Estimate Card** selected-**Goods** section should show **Good** names and price rules when density allows, for example `1 200 ₽/м²`.
- The customer-facing website can show selected **Goods** with more detail while the exported **Estimate Card** automatically compacts its **Goods** section when needed.
- **Estimate Message** should be generated from the same immutable estimate snapshot as the **Estimate Card**.
- **Estimate Message** should contain calculated data only, not a free-text customer comment.
- **Estimate Message** should be short and clean, optimized for Instagram DM readability and studio operations: easy to scan, easy to copy, and clear enough to discuss without opening the website.
- **Estimate Message** should avoid full formula-style receipt detail unless explicitly added later; the default should include only operational essentials.
- **Estimate Message** selected-**Goods** section should list **Good** names only, not per-**Good** prices or formulas.
- Export workflow may use the device native share sheet when available to share the **Estimate Card** PNG and/or **Estimate Message** to a user-selected target.
- The product must not assume a normal website can force a direct Instagram DM, preselect the studio recipient, or guarantee that Instagram accepts both PNG and text in one step.
- Export workflow needs graceful fallbacks: download/save PNG, copy **Estimate Message**, and open Instagram/DM destination separately when direct sharing is unavailable or unreliable.
- The canonical customer-facing export action label is "Поделиться расчётом" because it covers native share, PNG download, and copied text without overpromising Instagram automation.
- After "Поделиться расчётом", the preferred UI is a near-full-height guided export panel titled "Готово к отправке".
- The guided export panel should show a preview of the generated **Estimate Card**, then an ordered timeline: 1) copy **Estimate Message**, 2) share/save PNG **Estimate Card**, 3) open Instagram if needed.
- The guided export panel should open immediately after the customer taps "Поделиться расчётом", with **Estimate Card** generation happening inside that panel.
- Customers should be able to preview the full generated **Estimate Card** before saving, sharing, or opening Instagram.
- Copying the **Estimate Message** is the primary first action in the guided export panel because it prepares the customer before leaving the website or opening a share target.
- The **Estimate Message** should be generated automatically from the estimate snapshot and copied with one tap; it should not appear as an editable field on the website.
- After successful **Estimate Message** copy, the copy button should calmly morph to "Текст скопирован" and Step 2 should become visually active.
- The guided export panel may show subtle completed-step states for copied text, shared/saved PNG, and opened Instagram, but these states should stay low-noise.
- If sharing the PNG **Estimate Card** fails, the guided export panel should show calm fallback copy: "Скачайте карточку и отправьте вручную."
- "Открыть Instagram" should open the configured public Instagram page, not promise or attempt a direct DM deep link.
- Instagram handle is admin-customizable and required if the "Открыть Instagram" export step is enabled.
- Website handle is admin-customizable and optional; if empty, hide it from **Estimate Card**, **Estimate Message**, and export panel footer.
- If the admin has not configured an Instagram handle, hide the "Открыть Instagram" step/action from the guided export panel.
- **Estimate Card** footer should use a balanced contact layout: Instagram handle on the left, website handle on the right, and calculation date as a small low-noise detail near the bottom.
- **Estimate Card** calculation date should appear near the footer/bottom area rather than near the hero total.
- Brand display name should be admin-customizable, with default `ARCHIPELAG`.
- Short brand mark should be admin-customizable, with default `A / G`.
- First version should use text-based brand marks (`ARCHIPELAG` and `A / G`) rather than supporting uploaded logo images.
- Instagram handle should be entered by admin without `@`; customer-facing UI displays it with `@`.
- Instagram URL should be generated automatically from the Instagram handle rather than manually entered.
- Website URL should be an optional separate admin field only when it differs from the displayed website handle.
- The guided export panel should show a calm premium loading/skeleton state while generating the PNG **Estimate Card** preview.
- PNG **Estimate Card** generation should happen after the customer taps "Поделиться расчётом", not continuously after every **Calculator** change.
- Opening the guided export panel should freeze area, selected **Goods**, prices, tax text, date, and brand/contact settings into a single immutable estimate snapshot for that export.
- If the customer closes the guided export panel and edits the **Calculator**, the next export creates a new estimate snapshot.
- Admin settings should include a live **Estimate Card** preview using sample estimate data.
- Admin settings should include a live **Estimate Card** preview while changing relevant settings.
- Closing the guided export panel should return the customer to the **Calculator** without losing the current estimate inputs.
- **Estimate Message** footer should include the website handle when configured, but should not include the Instagram handle by default.
- **Estimate Message** should not include the calculation date by default.
- The guided export panel should show a real generated **Estimate Card** thumbnail preview, not a fake placeholder.
- If PNG **Estimate Card** generation fails, the guided export panel should still allow copying the **Estimate Message** and show calm error copy: "Не удалось создать карточку. Текст расчёта можно отправить вручную."
- Admin settings should live in a separate `Настройки` tab, not inside **Admin Catalog**.
- Admin settings should include editable brand name, short brand mark, Instagram handle, website handle, optional website URL, optional tax/VAT line, area minimum, area maximum, and default area.
- **Calculator** default area must be admin-configurable and validated to be within the configured min/max area range.
- Currency is hardcoded to Russian ruble (`₽`) for the first version.
- Russian is the only supported customer/admin language for the first version.
- Admin settings live preview should use the configured default area.
- Admin settings **Estimate Card** preview should let admin choose/toggle sample **Goods** from the **Admin Catalog** rather than always using fixed sample Goods.
- Admin settings should use explicit save button behavior rather than autosave.
- Admin settings should warn before leaving with unsaved changes.
- Admin settings validation should be inline, not modal-alert based.
- First version should not include a "reset all settings" action.
- Admin settings should show a small brand/header/footer preview near the relevant fields.
- Admin settings are admin-only and not visible to customers.
- For the first prototype, admin data may persist locally on localhost before choosing a production backend.
- Production-shaped prototype stack is Next.js App Router with React and TypeScript rather than a static-only prototype, because the product needs real backend behavior and admin protection.
- First prototype backend uses SQLite through Prisma so **Admin Catalog**, settings, admin users, and sessions persist locally while keeping a future migration path to a production database.
- First prototype includes real admin authentication with password verification, HttpOnly session cookies, and server-side admin route/API protection.
- First prototype uses custom CSS and ARCHIPELAG Mont fonts rather than a generic UI kit, preserving the brand-specific premium visual language.
- First prototype uses Motion for React for premium recalculation, row transition, panel, and step-state motion.
- First prototype uses `html-to-image` to export the real rendered **Estimate Card** DOM as a PNG, keeping preview and export visually aligned.
- First prototype uses drag-and-drop reordering in **Admin Catalog** through a dedicated React drag-and-drop library.
- Curated inline SVG icons are acceptable for the first prototype because they keep icon style controlled and brand-aligned.

## Prototype Status

- Current production-shaped prototype is verified working on desktop, including Calculator, export panel, admin authentication, Admin Catalog save, Settings save, and PNG export.
- Current mobile Calculator is verified against the approved reference direction: selected **Goods** list by default, compact "Изменить" editing state, custom CSS arrows instead of native disclosure markers, and no Next.js dev indicator covering the menu.
- Approved customer-facing Calculator visual baseline remains the earlier monochrome phone prototype: light paper surface, thin dividers, black icon tiles, clear selected-**Goods** list, strong but restrained Mont typography, and low-noise actions.
- Customer-facing Calculator should show selected **Goods** by default; editing all available **Goods** belongs behind an explicit "Изменить" state, not in the normal selected list.
- Customer-facing top menu should be functional in the prototype and expose admin/navigation entry points without making them visually dominant.

## Example dialogue

> **Dev:** "Should `3D-визуализация` and `Премиум` use different admin models?"
> **Domain expert:** "No, both are **Goods**. I just need to customize their names, icons, colors, prices, and whether customers can choose them."

## Flagged ambiguities

- "products", "services", "packages", and "goods" were used for the same admin-editable concept. Resolved: use **Good** as the canonical term.
