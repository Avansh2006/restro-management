---
name: RestroOS
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#464555'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style

The design system is engineered for high-stakes, high-velocity restaurant environments where clarity and operational speed are paramount. The aesthetic is "Precision SaaS"—a 2026 evolution of corporate minimalism that prioritizes cognitive ease through structured information density and a sophisticated, clinical polish.

The brand personality is authoritative yet secondary to the user's data. It avoids decorative flourishes in favor of functional elegance. The target audience includes floor managers, executive chefs, and franchise owners who require a reliable, professional interface that feels like a high-end tool rather than a consumer app. 

The visual style utilizes a tiered "Surface-on-Surface" approach, using subtle tonal shifts and crisp borders to define hierarchy without the weight of traditional skeuomorphism. It is a strictly structured, grid-aligned system that conveys stability and modern efficiency.

## Colors

The palette is anchored by a high-clarity neutral foundation to ensure the interface remains invisible during heavy use. 

- **Primary Indigo (#4F46E5):** Reserved for primary actions, active states, and critical navigational markers.
- **Surface & Background:** The global background is #F8FAFC. Elevated interface elements (cards, modals, sidebars) must use pure #FFFFFF to create a clear "object-on-ground" relationship.
- **Status Semantic Palette:** Highly saturated status colors are used sparingly for immediate recognition:
    - **Success:** Live orders and completed payments.
    - **Amber:** Pending reservations or kitchen delays.
    - **Red:** Immediate alerts, voided transactions, or expired stock.
- **Borders:** A consistent #E2E8F0 border is used to define containers, ensuring structure even when shadows are subtle.

## Typography

This design system utilizes **Inter** exclusively to leverage its exceptional legibility in data-dense environments. The type scale is optimized for a "compact-yet-breathable" layout.

- **Weight Strategy:** Use *SemiBold (600)* for headers to create immediate visual anchors. *Regular (400)* is standard for body text.
- **Labels:** Small labels (`label-md`) should use a slight tracking increase and uppercase styling for categorized data or table headers.
- **Readability:** Maintain a strict 1.4x to 1.5x line-height ratio for body text to ensure long lists of orders remain scanable.
- **Numeric Data:** For currency and quantities, tabular lining figures should be used to ensure columns of numbers align perfectly.

## Layout & Spacing

The system follows a strict **8px grid** (the "Smallest Unit"). All margins, paddings, and component heights must be multiples of 8px (or 4px for tight internal spacing).

- **Grid Model:** A 12-column fluid grid is used for dashboard layouts. Sidebars are fixed at 280px to maximize the working area for data tables and kanban boards.
- **Responsive Behavior:** 
    - **Desktop (1440px+):** 24px margins, 16px gutters.
    - **Tablet (768px - 1024px):** 16px margins. Sidebars collapse into a rail or drawer.
    - **Mobile (<768px):** 12px margins. Layout reflows to a single column; primary action buttons move to a sticky footer.
- **Density:** Use "Compact" spacing for data tables (8px vertical padding) and "Comfortable" spacing for settings pages or landing views (16px+ vertical padding).

## Elevation & Depth

Hierarchy is established through "Shadow-Defined Elevation" rather than color-blocked depth. 

- **Level 0 (Floor):** #F8FAFC. The base layer where the application sits.
- **Level 1 (Card/Surface):** #FFFFFF with a 1px border (#E2E8F0). No shadow. Used for secondary content or layout sections.
- **Level 2 (Active/Floating):** #FFFFFF with a subtle, diffused shadow: `0px 4px 6px -1px rgba(0, 0, 0, 0.05), 0px 2px 4px -2px rgba(0, 0, 0, 0.03)`. Used for primary dashboard cards.
- **Level 3 (Overlay):** #FFFFFF with a pronounced, wide shadow. Used for modals and dropdown menus to separate them from the work surface.

Avoid glassmorphism or background blurs; depth must feel physical and architectural.

## Shapes

The shape language is "Soft-Modern." It uses consistent rounding to reduce the harshness of a data-heavy interface while maintaining a professional structure.

- **Standard Elements:** Buttons, input fields, and small cards use an 8px (`rounded-md`) radius.
- **Large Containers:** Dashboard widgets and main modal containers use a 16px (`rounded-xl`) radius to soften the larger visual masses.
- **Interactive States:** Hover states should maintain the same radius as the parent element, typically indicated by a 10% darkening of the surface color or a subtle inner glow.

## Components

- **Buttons:** 
  - *Primary:* Solid Indigo (#4F46E5) with white text. 8px radius.
  - *Secondary:* White background with #E2E8F0 border and #475569 text.
  - *Ghost:* No border or background unless hovered. Used for utility actions.
- **Input Fields:** White background, 1px #E2E8F0 border. On focus, the border transitions to #4F46E5 with a 2px soft indigo ring (20% opacity).
- **Chips / Badges:** Used for order status. Use a "Soft Tint" style: light background (10% of the semantic color) with high-contrast text (80-90% of the semantic color).
- **Cards:** White surfaces with 16px padding. Titles are always SemiBold 16px.
- **Data Tables:** Zebra striping is avoided. Instead, use thin #E2E8F0 horizontal dividers. Row hover states should use a #F1F5F9 background tint for clear line-tracking.
- **Navigation:** Vertical sidebar with icons. Active items use a subtle 2px Indigo left-border marker and a #EEF2FF background tint.