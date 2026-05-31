# Design System Strategy: The Kinetic Executive

## 1. Overview & Creative North Star: "The Kinetic Executive"
This design system moves beyond the utility of a standard dashboard to create an environment of **"Kinetic Executive"**—a blend of high-stakes precision and fluid motion. For a taxi management platform, reliability isn't just about showing data; it’s about the authoritative clarity of an editorial layout.

We break the "template" look by rejecting the rigid 1px grid. Instead, we use **Intentional Asymmetry** and **Tonal Depth**. Large, sophisticated `manrope` displays provide a rhythmic hierarchy, while `inter` handles the heavy lifting of data density. We treat the interface as a physical workspace where information isn't "boxed in" but rather "seated" on layered surfaces.

---

## 2. Colors: Tonal Architecture
The palette is rooted in the iconic taxi yellow, but refined through Material Design 3 logic to ensure professional sobriety.

*   **Primary Foundation:** `primary (#785900)` and `primary_container (#ffc107)`. Use the container for high-visibility highlights and the base primary for high-contrast actions.
*   **The "No-Line" Rule:** Explicitly prohibit 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. For example, a `surface_container_low` sidebar sitting against a `surface` main stage.
*   **Surface Hierarchy & Nesting:** Use the `surface_container` tiers to create depth.
    *   **Base:** `surface (#fcf9f8)`
    *   **Main Content Cards:** `surface_container_lowest (#ffffff)` (Crisp White)
    *   **Secondary Wells/Sidebars:** `surface_container (#f0eded)`
*   **The "Glass & Gradient" Rule:** To elevate the "Modern" requirement, floating modals or navigation overlays should use a 20% opacity `surface_container_lowest` with a `20px` backdrop-blur. 
*   **Signature Textures:** For primary CTAs, use a subtle linear gradient: `primary_container` to `primary_fixed_dim`. This adds "soul" and prevents the yellow from feeling flat or "safety-vest" generic.

---

## 3. Typography: Editorial Authority
We utilize a dual-typeface system to balance character with legibility.

*   **Display & Headlines (Manrope):** Use `display-lg` (3.5rem) and `headline-md` (1.75rem) for high-level metrics (e.g., Total Fleet Revenue). The wider tracking of Manrope conveys a premium, corporate feel.
*   **Title & Body (Inter):** Use `title-md` (1.125rem) for card headers and `body-md` (0.875rem) for data tables. Inter’s tall x-height ensures that dense taxi logs remain readable at high speeds.
*   **The Label Logic:** `label-sm` (0.6875rem) should be used in `ALL CAPS` with `0.05rem` letter-spacing for metadata and status badge text, creating an "instrument panel" aesthetic.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are the "easy" way out. This system prioritizes **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by stacking. Place a `surface_container_lowest` (White) card on top of a `surface_container_low` background. The contrast in value creates a natural lift.
*   **Ambient Shadows:** For "Floating" elements (Action Menus, Tooltips), use an extra-diffused shadow: `box-shadow: 0 12px 40px rgba(79, 70, 50, 0.06);`. Note the tint: the shadow is a soft brown-grey (`on_surface_variant`), not pure black.
*   **The "Ghost Border" Fallback:** If a divider is mandatory for accessibility, use the `outline_variant` token at **15% opacity**. Never use a 100% opaque line.
*   **Glassmorphism:** Navigation rails should utilize backdrop-blur with a semi-transparent `surface_container_low` to allow map textures or data visualizations to bleed through subtly.

---

## 5. Components: Precision Primitives

### Cards & Data Tables
*   **Rule:** Forbid divider lines between rows.
*   **Implementation:** Use the Spacing Scale `4` (0.9rem) to separate rows. Use a `surface_container_high` background on `:hover` to define the row's bounds.
*   **Rounding:** Apply `md` (0.75rem) to standard cards and `lg` (1rem) to main dashboard containers.

### Buttons & Chips
*   **Primary Action:** `primary_container` background with `on_primary_container` text. Radius: `full` (9999px) to contrast against the architectural cards.
*   **Status Badges (Chips):**
    *   *Active:* `tertiary_container` with `on_tertiary_container`.
    *   *Pending:* `secondary_container` with `on_secondary_container`.
    *   *Alert:* `error_container` with `on_error_container`.

### Input Fields
*   Minimalism is key. Use a "Filled" style with a `surface_container` background and a bottom-only `outline_variant` (20% opacity). On focus, the bottom border transitions to `primary` at 2px thickness.

### Fleet-Specific Components
*   **Live Map Overlays:** Use a `surface_container_lowest` (White) with a 60% opacity and `xl` (1.5rem) rounding to house "Driver Details." This creates a "heads-up display" (HUD) feel.
*   **Capacity Indicators:** Use a horizontal bar using `primary_fixed` as the track and `primary` as the progress fill.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical whitespace. A larger top-margin on a headline (`20` or 4.5rem) creates an editorial, premium feel.
*   **Do** use `surface_tint` at 5% opacity for large background areas to give the "White" a sophisticated, warm-grey "gallery" undertone.
*   **Do** prioritize the Spacing Scale `3` (0.6rem) for internal card padding to keep the UI feeling tight and "engineered."

### Don't
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#1b1c1c) to maintain a soft, high-end contrast.
*   **Don't** use 1px borders to separate the sidebar from the main content. Use a transition from `surface_container` to `surface`.
*   **Don't** use default Inter "Medium" for everything. Contrast a `Bold` Title-lg with a `Regular` Body-md to create visual interest.