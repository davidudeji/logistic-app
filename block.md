---
version: alpha
name: block.xyz
description: Minimal, high-contrast identity system for Block’s corporate homepage and product family. The page uses an intentionally sparse light canvas, centered editorial hero copy, and monospaced-free, utility-forward navigation with black text on an off-white background.
colors:
  primary: "#000000"
  secondary: "#000000"
  tertiary: "#e5e7eb"
  neutral: "#fbfbfb"
  surface: "#fbfbfb"
  on-surface: "#000000"
  error: "#000000"
typography:
  headline-display:
    fontFamily: "Cash Sans, sans-serif"
    fontSize: "47.25px"
    fontWeight: 400
    lineHeight: "59.535px"
    letterSpacing: "0.2px"
  headline-lg:
    fontFamily: "Times New Roman"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: "29px"
    letterSpacing: "0px"
  headline-md:
    fontFamily: "Times New Roman"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "0px"
  body-lg:
    fontFamily: "Times New Roman"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "22px"
    letterSpacing: "0px"
  body-md:
    fontFamily: "Times New Roman"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "normal"
    letterSpacing: "0px"
  body-sm:
    fontFamily: "Times New Roman"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "normal"
    letterSpacing: "0px"
  label-lg:
    fontFamily: "Cash Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "normal"
    letterSpacing: "0.2px"
  label-md:
    fontFamily: "Times New Roman"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "normal"
    letterSpacing: "0px"
  label-sm:
    fontFamily: "Times New Roman"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "normal"
    letterSpacing: "0px"
rounded:
  none: "0px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "10px"
  sm: "18px"
  md: "28px"
  lg: "36px"
  xl: "98px"
components:
  button:
    primary:
      borderRadius: "4px"
      borderWidth: "0px"
      borderStyle: "none"
      padding: "8px 16px"
      fontSize: "16px"
      fontWeight: 400
      minWidth: "120px"
      minHeight: "40px"
      textDecoration: "none"
      boxShadow: "none"
      backgroundColor: "#000000"
      color: "#fbfbfb"
      borderColor: "transparent"
    secondary:
      borderRadius: "4px"
      borderWidth: "1px"
      borderStyle: "solid"
      padding: "8px 16px"
      fontSize: "16px"
      fontWeight: 400
      minWidth: "120px"
      minHeight: "40px"
      textDecoration: "none"
      boxShadow: "none"
      backgroundColor: "transparent"
      color: "#000000"
      borderColor: "#000000"
    link:
      borderRadius: "0px"
      borderWidth: "0px"
      borderStyle: "none"
      padding: "0px"
      fontSize: "16px"
      fontWeight: 400
      minWidth: "0px"
      minHeight: "0px"
      textDecoration: "underline"
      boxShadow: "none"
      backgroundColor: "transparent"
      color: "#000000"
  card:
    backgroundColor: "#fbfbfb"
    borderColor: "#e5e7eb"
    borderRadius: "8px"
    borderWidth: "1px"
    borderStyle: "solid"
    padding: "16px"
    boxShadow: "none"
    textColor: "#000000"
---

# Overview

Block.xyz is deliberately minimal: a white-to-off-white page, black typography, and large amounts of whitespace. The screenshot shows a centered hero mark and statement, with a thin top navigation and a small set of product/company links at the bottom. Use this system when the goal is to feel editorial, calm, and highly legible rather than promotional or decorative.

Primary visual traits:
- High contrast, monochrome presentation
- Spacious layout with strong vertical breathing room
- Centered hero content
- Small, restrained navigation labels
- No visible shadows, gradients, or ornamental surfaces

# Colors

Use a near-white surface and pure black foreground for all primary content.

## Token intent
- `primary`: primary text, marks, and strong emphasis
- `secondary`: same chromatic role as primary in this system; use when a separate semantic slot is required
- `tertiary`: subtle borders and dividers
- `neutral` / `surface`: page and container background
- `on-surface`: default text color on light backgrounds
- `error`: not visually established in the source; keep conservative and avoid introducing a new accent color

## Usage
- Backgrounds should remain `#fbfbfb` or white-adjacent.
- Text should remain black or near-black.
- If a divider or border is needed, use the light gray tertiary token.
- Avoid color-coded states unless required by product functionality.

# Typography

Typography is the strongest expressive layer in this system. The site combines a modern display face for the hero with Times New Roman for supporting and navigational content.

## Display and headings
- `headline-display` uses `Cash Sans` at 47.25px with very light weight and slight positive tracking.
- Lower headings rely on Times New Roman and scale down in a simple editorial progression.

## Body and labels
- Body copy is 16px Times New Roman with normal line-height.
- Labels and utility text remain quiet and understated; do not over-style them.
- The screenshot suggests all-caps navigation and product links, but lettercase should be treated as content-driven rather than a hard token rule.

## Guidance
- Keep headlines centered when used as the page’s main statement.
- Preserve generous line height and avoid tight multiline stacking.
- Do not substitute a geometric or brand-heavy sans serif unless matching the display role of `Cash Sans`.

# Layout

The layout is spacious, centered, and mostly symmetrical.

## Structure
- Top navigation spans the page width with evenly spaced text links.
- The hero content sits near the vertical center of the viewport.
- Footer/product links sit low on the page and mirror the minimal top-nav treatment.

## Spacing
- Use the provided spacing scale to preserve the empty field around focal content.
- `xl` spacing is large enough for major vertical separation and should appear frequently.
- Smaller spacing values are appropriate for the icon mark, text stack, and nav link gaps.

## Alignment
- Prefer center alignment for hero messaging.
- Use horizontal spacing to distribute navigation items evenly.
- Keep the page uncluttered; one primary message per screen is the norm.

# Elevation & Depth

Depth is effectively absent in the source.

- Shadows are `none` across cards and controls.
- Avoid layering effects, glows, or blur.
- If a surface distinction is required, use border and spacing rather than elevation.

# Shapes

Shapes are simple and rectilinear.

- Base rounding should be minimal.
- Buttons use 4px corners.
- Cards use 8px corners with a light border.
- The block mark is a rigid 3x3 grid of small squares; preserve its square geometry and avoid softening it.

# Components

## Navigation links
- Use plain text links without pill backgrounds or icon adornment.
- Keep spacing generous and typography understated.
- Default state should be black text on the light background.

## Hero mark
- The logo/mark is a compact square grid centered above the headline.
- Treat it as a structural brand anchor, not a decorative motif to repeat elsewhere.

## Hero headline
- Use `headline-display` for the main statement.
- Center align and keep copy to one or two short lines when possible.
- Maintain the visual calm seen in the screenshot.

## Buttons
- `button.primary`: solid black background with light text, small radius, no shadow.
- `button.secondary`: transparent background with black border and text.
- `button.link`: simple underlined text, no container chrome.

Use buttons sparingly; the reference page does not foreground calls to action.

## Cards
- Cards are lightly bordered, flat, and low-contrast.
- Use `surface` background, `tertiary` border, and `md`-like rounding.
- Keep internal padding moderate and avoid content-dense card grids unless necessary.

# Do's and Don'ts

## Do
- Do keep the page mostly empty and let whitespace carry the composition.
- Do use black text on `#fbfbfb` or white backgrounds.
- Do center the primary message and brand mark.
- Do use Times New Roman for body and navigation-like utility text when matching the source.
- Do keep controls flat, small, and understated.
- Do prefer text links over filled buttons for secondary navigation.

## Don't
- Don't introduce gradients, shadows, glass effects, or decorative backgrounds.
- Don't use bright accent colors for emphasis.
- Don't crowd the page with cards, promos, or dense sections.
- Don't replace the hero’s restrained tone with bold marketing copy or oversized interactive chrome.
- Don't round corners aggressively or use soft, pill-shaped controls by default.
- Don't shift the composition off-center unless a specific content pattern requires it.