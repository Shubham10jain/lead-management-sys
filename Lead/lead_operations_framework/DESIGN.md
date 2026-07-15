---
name: Lead Operations Framework
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
  on-surface-variant: '#45474c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#041528'
  on-tertiary: '#ffffff'
  tertiary-container: '#1a2a3e'
  on-tertiary-container: '#8191a9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  container-max: 1440px
  gutter: 24px
---

## Brand & Style

This design system is built on a foundation of **Corporate Modernism**, prioritizing clarity, efficiency, and perceived security. The target audience consists of sales operations managers and enterprise growth teams who require a high-density information environment that feels stable and authoritative.

The aesthetic avoids unnecessary ornamentation, focusing instead on structural integrity and functional hierarchy. The emotional response should be one of "controlled precision"—users should feel that their data is organized, protected, and ready for action. Whitespace is used systematically to separate concerns rather than for purely artistic effect, ensuring that the interface remains productive even under heavy data loads.

## Colors

The palette is anchored by a deep navy primary (`#1e293b`) to establish trust and authority. Actionable elements utilize a vibrant blue (`#3b82f6`) to provide clear "scannability" for the next steps in the sales workflow.

- **Primary:** Used for navigation, headers, and high-level structural elements.
- **Secondary (Action):** Reserved for primary buttons, active states, and links.
- **Status:** Semantic colors are used strictly for lead state indicators. 'PENDING' utilizes the warning amber, while 'REACHED_OUT' or 'CONVERTED' utilizes the success green.
- **Neutrals:** A range of slate grays is employed for typography and borders to maintain a professional, low-fatigue reading environment.

## Typography

The design system utilizes **Inter** for all primary communication. It is selected for its exceptional legibility in data-heavy SaaS environments and its neutral, systematic character.

**JetBrains Mono** is introduced sparingly for technical labels, lead IDs, and metadata to reinforce the "production-ready" and secure nature of the platform.

### Hierarchy Rules
- **Headlines:** Use Bold or Semi-Bold weights with slight negative letter-spacing to appear compact and impactful.
- **Body:** Standard reading text should use the Medium size (16px) for general content and Small size (14px) for data tables and sidebars to maximize information density.
- **Labels:** Always uppercase when using `label-md` for status badges or section headers to distinguish them from interactive text.

## Layout & Spacing

This design system employs a **Fixed Grid** model for desktop to ensure data consistency, transitioning to a fluid model for mobile devices.

- **Desktop (1280px+):** 12-column grid, 24px gutters, 48px page margins.
- **Tablet (768px - 1279px):** 8-column grid, 16px gutters, 24px page margins.
- **Mobile (<767px):** 4-column grid, 16px gutters, 16px page margins.

A strict **8px spacing scale** governs all component internals and layout relationships. For high-density data tables, the vertical cell padding is reduced to 12px (1.5x base) to balance legibility with volume.

## Elevation & Depth

To maintain a secure and modern aesthetic, this design system uses **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Base):** The primary background color (`#f8fafc`).
- **Level 1 (Cards/Surface):** White background with a 1px border (`#e2e8f0`). No shadow. Used for lead lists and dashboard widgets.
- **Level 2 (Navigation/Overlays):** White background with a subtle, highly diffused shadow (0px 4px 12px rgba(30, 41, 59, 0.05)).
- **Level 3 (Modals):** White background with a focused shadow (0px 12px 24px rgba(30, 41, 59, 0.1)).

Interaction feedback is conveyed through border-color shifts (e.g., from Slate-200 to Blue-500) rather than vertical lifts.

## Shapes

The shape language is **Soft (0.25rem)** to maintain a disciplined, professional appearance. 

- **Components:** Buttons, inputs, and small cards use the default 4px radius.
- **Large Containers:** Main content areas or large modal wrappers use the `rounded-lg` (8px) setting.
- **Status Badges:** Status indicators use a 4px radius rather than a pill shape to remain consistent with the corporate aesthetic.

## Components

### Buttons
- **Primary:** Solid `#3b82f6` with white text. Hover state: darken by 10%.
- **Secondary:** White background with `#1e293b` border and text. 
- **Ghost:** No background or border. Used for tertiary actions in tables.

### Input Fields
- **Default State:** 1px border (`#cbd5e1`), white background.
- **Focus State:** 1px border (`#3b82f6`) with a 3px soft blue outer glow. 
- **Error State:** 1px border (`#ef4444`) with helper text below.

### Lead Management Tables
- **Header:** Slate-50 background, `label-md` typography, 1px bottom border.
- **Row:** White background, 1px bottom border (`#f1f5f9`). Hover state: background shift to `#f8fafc`.
- **Status Badges:** 
    - `PENDING`: Amber-100 background, Amber-800 text.
    - `REACHED_OUT`: Green-100 background, Green-800 text.

### Cards
- Standard containers for lead metrics (e.g., "Total Leads," "Conversion Rate"). Use 1px borders and `headline-md` for the primary metric value.