---
version: alpha
name: apple.com
description: Apple.com landing-page design system emphasizing spacious hero marketing, minimal chrome, rounded pill actions, and high-contrast SF typography.
colors:
  primary: "#0071e3"
  secondary: "#0066cc"
  tertiary: "#f5f5f7"
  neutral:
    0: "#ffffff"
    50: "#f5f5f7"
    100: "#e5e7eb"
    900: "#1d1d1f"
  surface:
    default: "#ffffff"
    elevated: "#ffffff"
    muted: "#f5f5f7"
  on-surface:
    default: "#1d1d1f"
    muted: "#6e6e73"
    inverse: "#ffffff"
  error: "#d92d20"
typography:
  headline-display:
    fontFamily: "SF Pro Display"
    fontFallbacks:
      - "SF Pro Display"
      - "SF Pro Icons"
      - "Helvetica Neue"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 58px
    letterSpacing: 0px
  headline-lg:
    fontFamily: "SF Pro Display"
    fontFallbacks:
      - "SF Pro Display"
      - "SF Pro Icons"
      - "Helvetica Neue"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 52.0075px
    letterSpacing: -0.096px
  headline-md:
    fontFamily: "SF Pro Display"
    fontFallbacks:
      - "SF Pro Display"
      - "SF Pro Icons"
      - "Helvetica Neue"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: 34px
    fontWeight: 600
    lineHeight: 36px
    letterSpacing: 0.064px
  body-lg:
    fontFamily: "SF Pro Display"
    fontFallbacks:
      - "SF Pro Display"
      - "SF Pro Icons"
      - "Helvetica Neue"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 36px
    letterSpacing: 0.216px
  body-md:
    fontFamily: "SF Pro Text"
    fontFallbacks:
      - "SF Pro Text"
      - "SF Pro Icons"
      - "Helvetica Neue"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: 0px
  body-sm:
    fontFamily: "SF Pro Text"
    fontFallbacks:
      - "SF Pro Text"
      - "SF Pro Icons"
      - "Helvetica Neue"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0px
  label-lg:
    fontFamily: "SF Pro Text"
    fontFallbacks:
      - "SF Pro Text"
      - "SF Pro Icons"
      - "Helvetica Neue"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: 0px
  label-md:
    fontFamily: "SF Pro Text"
    fontFallbacks:
      - "SF Pro Text"
      - "SF Pro Icons"
      - "Helvetica Neue"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0px
  label-sm:
    fontFamily: "SF Pro Text"
    fontFallbacks:
      - "SF Pro Text"
      - "SF Pro Icons"
      - "Helvetica Neue"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0px
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 16px
  xl: 24px
  full: 980px
spacing:
  xs: 4px
  sm: 12px
  md: 20px
  lg: 44px
  xl: 102px
components:
  button:
    primary:
      backgroundColor: "{colors.primary}"
      color: "{colors.on-surface.inverse}"
      border: "1px solid transparent"
      borderRadius: "{rounded.full}"
      padding: "11px 21px"
      minHeight: "44px"
      fontFamily: "{typography.label-lg.fontFamily}"
      fontSize: "{typography.label-lg.fontSize}"
      fontWeight: "{typography.label-lg.fontWeight}"
      lineHeight: "{typography.label-lg.lineHeight}"
      letterSpacing: "{typography.label-lg.letterSpacing}"
      boxShadow: "none"
    secondary:
      backgroundColor: "transparent"
      color: "{colors.secondary}"
      border: "1px solid {colors.secondary}"
      borderRadius: "{rounded.full}"
      padding: "11px 21px"
      minHeight: "44px"
      fontFamily: "{typography.label-lg.fontFamily}"
      fontSize: "{typography.label-lg.fontSize}"
      fontWeight: "{typography.label-lg.fontWeight}"
      lineHeight: "{typography.label-lg.lineHeight}"
      letterSpacing: "{typography.label-lg.letterSpacing}"
      boxShadow: "none"
    link:
      backgroundColor: "transparent"
      color: "{colors.secondary}"
      border: "0"
      borderRadius: "{rounded.none}"
      padding: "0"
      minHeight: "0"
      fontFamily: "{typography.label-lg.fontFamily}"
      fontSize: "{typography.label-lg.fontSize}"
      fontWeight: "{typography.label-lg.fontWeight}"
      lineHeight: "{typography.label-lg.lineHeight}"
      letterSpacing: "{typography.label-lg.letterSpacing}"
      boxShadow: "none"
  card:
    backgroundColor: "{colors.surface.default}"
    color: "{colors.on-surface.default}"
    border: "1px solid {colors.neutral.100}"
    borderRadius: "{rounded.md}"
    padding: "16px"
    boxShadow: "none"
---

# Overview

Apple.com uses a restrained, premium marketing style: large centered headlines, short subheads, and two-action CTA groups. The page is dominated by ample white or near-white space, product photography, and low-contrast chrome. The visual rhythm is simple and editorial rather than dashboard-like.

Treat this system as a product-launch and campaign surface first. Use it for hero storytelling, category navigation, and purchase-oriented actions. Keep language concise, benefit-led, and confident.

# Colors

The palette is minimal and anchored by white surfaces, near-black text, and Apple blue for interactive elements.

## Core tokens
- `primary` is the brand action blue used for filled CTA buttons.
- `secondary` is the link and outline-blue used for secondary actions.
- `tertiary` is the light section background used for large marketing panels.
- `neutral.900` is the primary text color.
- `neutral.50` is the default page tint seen behind many hero sections.
- `neutral.100` is used for subtle borders.

## Usage
- Use `surface.default` and `surface.elevated` interchangeably for clean content blocks.
- Use `on-surface.default` for body copy and headings.
- Use `on-surface.muted` only for secondary explanatory text.
- Avoid introducing saturated accent colors unless they are product-specific imagery.

# Typography

Typography is the strongest brand signal. Apple.com uses SF Pro families with tight hierarchy and generous display scale.

## Headings
- `headline-display` supports the largest hero titles.
- `headline-lg` and `headline-md` work for product cards, section intros, and promotional modules.

## Body and labels
- `body-lg` fits hero subtitles like “Meet the latest iPhone lineup.”
- `body-md` is the default supporting text size.
- `label-lg` is the preferred button and nav size.
- `body-sm` and `label-sm` are for footnotes, legal text, and compact metadata.

## Rules
- Keep headlines short, usually 2–5 words.
- Use medium or semibold weights for display titles; keep button labels regular.
- Preserve Apple-style spacing between headline and subtitle; do not compress lines.

# Layout

The screenshot and homepage excerpt show a vertically stacked promotional layout with centered content and product imagery below the message.

## Structure
- Center hero content horizontally.
- Place a headline first, then a short subhead, then a two-button CTA row.
- Follow the CTA row with a large product image or rendered device stack.
- Separate sections with wide bands of `neutral.50` or `tertiary`.

## Spacing
- Use `spacing.xl` for major section separation.
- Use `spacing.lg` between headline, subhead, and CTA groups.
- Use `spacing.md` and `spacing.sm` for internal component rhythm.
- Maintain generous negative space; avoid dense grids unless the section is a product gallery.

## Navigation
- Top navigation is minimal, icon-light, and horizontally distributed.
- Keep global navigation visually quiet so product content remains dominant.

# Elevation & Depth

Depth is subdued. Apple.com rarely relies on visible shadows.

## Rules
- Default to `boxShadow: none` for surfaces and buttons.
- Use subtle borders instead of shadows for cards and panels.
- If a shadow is needed for product imagery or floating elements, keep it minimal and soft; do not create heavy elevation stacks.

The provided card token uses a thin border and no shadow. This should be the default pattern for content containers.

# Shapes

Shapes are soft and highly rounded in interactive controls, with modest rounding elsewhere.

## Tokens
- `rounded.full` is the signature pill shape for primary and secondary buttons.
- `rounded.md` is appropriate for cards and surface containers.
- `rounded.sm` is a fallback for compact UI elements.
- `rounded.none` is used for links and structural separators.

## Guidance
- Prefer pill buttons with height at least 44px.
- Keep imagery and product renders unmasked unless a component requires a frame.
- Avoid sharp decorative corners on call-to-action controls.

# Components

## Button
Use the button variants exactly as follows:

- `primary`: solid blue fill, white text, pill radius, 44px minimum height.
- `secondary`: transparent fill, blue border, blue text, pill radius, 44px minimum height.
- `link`: no border, no padding, blue text, inline action only.

### Button behavior
- Use a paired primary + secondary CTA pattern for hero blocks.
- Primary action should be the task-forward action (`Learn more`, `Buy`, `Shop iPhone`).
- Secondary action should be the alternative path or purchase action.
- Keep labels short and sentence case.

## Card
Use cards for compact promotional modules or content tiles.

- White background
- 1px neutral border
- 8px radius
- 16px padding
- No shadow

## Component composition
- Place buttons side-by-side with `spacing.sm` to `spacing.md` gap.
- Center CTA groups under the headline for hero sections.
- Ensure button text remains legible against white and tinted section backgrounds.

# Do's and Don'ts

## Do
- Do use centered, editorial hero layouts for feature launches.
- Do keep copy short, specific, and benefit-driven.
- Do use `primary` and `secondary` buttons together in key marketing sections.
- Do use SF Pro Display for large headlines and SF Pro Text for UI and buttons.
- Do keep surfaces white or near-white with minimal border treatment.
- Do let product imagery dominate the visual space.

## Don't
- Don't introduce heavy shadows, glassmorphism, or complex gradients.
- Don't use more than one strong brand accent in the same section.
- Don't build dense, data-heavy layouts as the default pattern.
- Don't use square buttons for primary actions.
- Don't make navigation visually louder than the featured product message.
- Don't inflate headline copy with long marketing paragraphs; split content into separate modules instead.