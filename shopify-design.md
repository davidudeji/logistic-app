---
version: alpha
name: Shopify
description: Dark, high-contrast commerce homepage design system for Shopify.com, centered on large editorial typography, rounded pill CTAs, minimal chrome, and immersive hero imagery.
colors:
  background: "#000000"
  text: "#ffffff"
  accent: "#ffffff"
  primary: "#ffffff"
  secondary: "#9dabad"
  tertiary: "#061a1c"
  neutral: "#1e2c31"
  surface: "#061a1c"
  on-surface: "#ffffff"
  error: "#ff5c5c"
typography:
  headline-display:
    fontFamily: "NeueHaasGrotesk"
    fontFallbacks:
      - "NeueHaasGrotesk"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: "96px"
    lineHeight: 96
    letterSpacing: "0px"
    fontWeight: 400
  headline-lg:
    fontFamily: "NeueHaasGrotesk"
    fontFallbacks:
      - "NeueHaasGrotesk"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: "68px"
    lineHeight: 70
    letterSpacing: "0px"
    fontWeight: 330
  headline-md:
    fontFamily: "NeueHaasGrotesk"
    fontFallbacks:
      - "NeueHaasGrotesk"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: "48px"
    lineHeight: 64
    letterSpacing: "0px"
    fontWeight: 330
  body-lg:
    fontFamily: "NeueHaasGrotesk"
    fontFallbacks:
      - "NeueHaasGrotesk"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: "24px"
    lineHeight: 36
    letterSpacing: "0.36px"
    fontWeight: 330
  body-md:
    fontFamily: "NeueHaasGrotesk"
    fontFallbacks:
      - "NeueHaasGrotesk"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: "18px"
    lineHeight: 28
    letterSpacing: "0px"
    fontWeight: 330
  body-sm:
    fontFamily: "NeueHaasGrotesk"
    fontFallbacks:
      - "NeueHaasGrotesk"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: "16px"
    lineHeight: 24
    letterSpacing: "0px"
    fontWeight: 330
  label-lg:
    fontFamily: "Inter-Variable"
    fontFallbacks:
      - "Inter-Variable"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: "18px"
    lineHeight: 24
    letterSpacing: "0px"
    fontWeight: 550
  label-md:
    fontFamily: "NeueHaasGrotesk"
    fontFallbacks:
      - "NeueHaasGrotesk"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: "16px"
    lineHeight: 24
    letterSpacing: "0px"
    fontWeight: 500
  label-sm:
    fontFamily: "NeueHaasGrotesk"
    fontFallbacks:
      - "NeueHaasGrotesk"
      - "Helvetica"
      - "Arial"
      - "sans-serif"
    fontSize: "14px"
    lineHeight: 20
    letterSpacing: "0px"
    fontWeight: 500
rounded:
  none: "0px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "50px"
  lg: "64px"
  xl: "80px"
components:
  button:
    primary:
      backgroundColor: "{colors.primary}"
      color: "{colors.background}"
      border: "2px solid transparent"
      borderRadius: "{rounded.full}"
      padding: "12px 24px"
      minHeight: "56px"
      minWidth: "161px"
      fontFamily: "{typography.label-lg.fontFamily}"
      fontSize: "{typography.label-lg.fontSize}"
      fontWeight: "{typography.label-lg.fontWeight}"
      textDecoration: "none"
      boxShadow: "none"
    secondary:
      backgroundColor: "transparent"
      color: "{colors.on-surface}"
      border: "2px solid {colors.on-surface}"
      borderRadius: "{rounded.full}"
      padding: "12px 24px"
      minHeight: "56px"
      minWidth: "161px"
      fontFamily: "{typography.label-lg.fontFamily}"
      fontSize: "{typography.label-lg.fontSize}"
      fontWeight: "{typography.label-lg.fontWeight}"
      textDecoration: "none"
      boxShadow: "none"
    link:
      backgroundColor: "transparent"
      color: "{colors.secondary}"
      border: "none"
      borderRadius: "{rounded.none}"
      padding: "0px"
      minHeight: "0px"
      minWidth: "0px"
      fontFamily: "{typography.label-lg.fontFamily}"
      fontSize: "{typography.label-lg.fontSize}"
      fontWeight: 500
      textDecoration: "underline"
      boxShadow: "none"
  card:
    backgroundColor: "{colors.surface}"
    color: "{colors.on-surface}"
    border: "1px solid {colors.neutral}"
    borderRadius: "{rounded.lg}"
    padding: "32px"
    boxShadow: "{shadows.inner}"
---

# Overview

Shopify.com uses a dark, cinematic landing-page system with oversized editorial headlines, sparse navigation, and strong rounded-button hierarchy. The screenshot shows a full-bleed hero image with white text over a dimmed background, followed by a dark rounded section that preserves high contrast and keeps attention on calls to action.

Use this system for marketing pages, feature announcements, and conversion-focused landing sections. The tone should feel confident, fast, and modern; copy is short, declarative, and outcome-led.

# Colors

The palette is intentionally minimal.

- Background is pure black for the main canvas.
- Text and primary accents are white.
- Secondary text uses muted cool gray for reduced emphasis.
- Surface cards and panels use deep near-black green tones to separate content without breaking the dark mode.

Token usage:
- `colors.background` for page and section backgrounds.
- `colors.text` and `colors.on-surface` for primary copy.
- `colors.primary` for strongest CTA fills.
- `colors.secondary` for tertiary labels, meta text, and understated links.
- `colors.surface` and `colors.tertiary` for cards, panels, and inset content.
- `colors.neutral` for borders and subtle separators.

Avoid introducing saturated brand colors unless they are tied to a product illustration or campaign asset.

# Typography

Typography is the primary visual system.

## Display hierarchy
- `headline-display` is the hero level style, used for the main landing headline.
- `headline-lg` and `headline-md` support section intros and large feature statements.
- `body-lg` is used for prominent intro copy and lead paragraphs.
- `body-md` and `body-sm` support supporting copy, labels, and dense product content.

## Practical guidance
- Headlines should stay tight, with short line lengths when possible.
- Use `NeueHaasGrotesk` for editorial voice and most copy.
- Use `Inter-Variable` only for buttons where the UI treatment demands slightly stronger weight and more utilitarian clarity.
- Maintain the loose letter spacing and light weights seen in the hero and section intros.
- Keep type color white on dark backgrounds; use muted gray only for supporting text.

# Layout

The homepage follows a top-down storytelling flow:

1. Minimal global navigation pinned at the top.
2. Large hero with left-aligned headline, supporting text, and two adjacent CTAs.
3. Dark rounded content block below the fold with oversized statement copy.
4. Subsequent sections alternate between feature narratives, proof points, and commerce examples.

Implementation notes:
- Use generous horizontal breathing room; content is left-weighted rather than centered.
- Allow imagery to dominate the hero background.
- Keep section transitions soft and rounded where content modules overlap or stack.
- Preserve strong vertical rhythm with large gaps between major groups; the system suggests spacing steps of 16px, 50px, 64px, and 80px.

# Elevation & Depth

Depth is subtle and mostly structural, not decorative.

- The interface relies on contrast, edge boundaries, and large image planes more than shadows.
- Cards use a very restrained inset-like shadow and a 1px border to stay legible on dark surfaces.
- Most buttons should have no shadow.
- Use depth sparingly for content grouping only; do not stack multiple elevated surfaces in one viewport.

# Shapes

Rounded geometry is a core brand cue.

- Primary and secondary buttons are pill-shaped using `rounded.full`.
- Cards use `rounded.lg` for soft but controlled corners.
- General UI should prefer smooth, low-friction edges over sharp corners.
- Avoid sharp or angular decorative treatments unless required by a product screenshot.

# Components

## Buttons
- **Primary button**: white fill, black text, pill shape, 56px minimum height.
- **Secondary button**: transparent fill, white 2px outline, white text, pill shape, 56px minimum height.
- **Link button**: transparent, underlined, muted gray text, used for low-emphasis navigation such as “Log in” or secondary resource links.

Buttons are horizontally compact but visually strong. Keep label text in sentence case and use concise verbs.

## Cards
- Use dark cards for supporting content blocks, benefit summaries, and feature callouts.
- Maintain a 1px border and generous 32px padding.
- Keep card text white; secondary details may use the muted secondary color.

## Navigation
- Top navigation is minimal, text-forward, and lightweight.
- Right-aligned actions should include a text link and a single strong CTA button.
- Use no chrome beyond text, spacing, and the button treatments defined here.

# Do's and Don'ts

## Do
- Do use large, high-impact headlines with short line breaks.
- Do keep the page dark, minimal, and contrast-rich.
- Do use white primary CTA buttons and outlined secondary CTAs in the hero.
- Do align content left and let imagery carry emotional weight.
- Do use muted gray only for secondary copy or low-emphasis links.
- Do keep shadows minimal and borders subtle.
- Do prefer rounded pills and soft card corners.

## Don't
- Don't use bright or colorful backgrounds for core marketing sections.
- Don't center every section by default; Shopify’s landing pages are editorial and left-biased.
- Don't add multiple button styles in the same decision point.
- Don't rely on shadows to create hierarchy.
- Don't use small, dense type for hero messaging.
- Don't replace the pill CTA shape with squared buttons.
- Don't overcrowd the header; keep navigation concise and lightweight.