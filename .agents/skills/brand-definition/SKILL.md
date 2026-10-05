---
name: brand-definition
description: Establishes brand definition and visual rules for a project — color palette, typography, tone of voice, and design tokens — as part of the $sdd-feature stage, BEFORE implementing any UI. Use this skill when the user starts a new project/feature and requests brand definition, visual rules, design system, color palette, tone of voice, or visual identity, or before building an interface when no brand definition exists in specs/. This skill produces guidelines and token specifications used by subsequent implementation features.
---

# Brand Definition

## Purpose

Produces a **brand definition and visual rules document** (`specs/brand-definition.md` + `specs/design-tokens.json`) that serves as the single source of truth for all UI implementation in the project: colors, typography, tone of voice, and concrete design tokens. It is an artifact of the `$sdd-feature` stage created **before** writing UI code.

## Pre-execution Checklist

1. **Does `specs/brand-definition.md` already exist?** If so, do not regenerate from scratch — update or extend specific sections as needed.
2. **Do I have the brand tone/personality, or just colors?** A brand definition without tone of voice is incomplete — capture both palette and voice.

## Workflow

### 1. Gather Product Context

Before proposing guidelines, understand:
- Product/Project Name.
- Purpose and target audience (a concise single sentence).
- Desired tone: Corporate/Serious, Warm/Approachable, Technical/Minimalist, Playful? (See `examples/usage-examples.md`).
- Brand references ("Stripe-like", "Notion feel") as inspiration, never direct copies.
- Existing brand assets or constraints (existing logo, corporate guidelines, required color).

### 2. Define Color Palette

Use `references/color-palettes.md` as reference:
- Primary Color (`#RRGGBB`)
- Accent Color
- Text color over primary background
- Semantic colors (success, error, warning, info) when needed
- Light and dark background themes if supported

**Verify contrast ratio for every text/background pair before finalizing.** Run `scripts/check_contrast.py` and report pass/fail for WCAG AA/AAA. See `references/color-accessibility.md`.

### 3. Define Typography

Use `references/typography-and-tone.md` to specify:
- Font families for headings and body text.
- Modular type scale.
- Font weights (e.g., Regular, Medium, Bold).

### 4. Define Tone of Voice

Define:
- 3-4 adjectives describing the voice.
- Concrete copy examples (error message, call-to-action button).
- Explicit anti-patterns (e.g., "avoid empty corporate jargon").

### 5. Additional Visual Rules (If Applicable)

- Base spacing / grid system.
- Iconography style guidelines (stroke width, base size).
- Logo usage rules (exclusion zones, minimum size).

### 6. Generate Output Files

Write:
- `specs/brand-definition.md` using `assets/templates/brand-definition-template.md`.
- `specs/design-tokens.json` using `assets/templates/design-tokens.json.template`.
- Add a reference link in `AGENTS.md` to `specs/brand-definition.md`.

### 7. Mark Unconfirmed Items

Place any unconfirmed assumptions under a "Pending Confirmation" section in `brand-definition.md`.

## Accessibility Requirements

- Contrast ratio ≥ 4.5:1 for normal text on background, ≥ 3:1 for large text (verified via `scripts/check_contrast.py`).
- Do not rely solely on color (red/green) for state feedback; include icons or clear text labels.
- Record verified contrast scores in `brand-definition.md`.

## What NOT to Do

- Do not generate final image files (favicons, logos, og-images) — this skill outputs rule definitions and token files.
- Do not copy copyrighted brand identities directly.
- Do not add unneeded tokens (excessive spacing scales, dark mode themes) until required by the feature under development.

## References

- `references/color-palettes.md` — curated color palettes by category.
- `references/typography-and-tone.md` — typography and tone of voice guides.
- `references/color-accessibility.md` — contrast standards and script interpretation.

## Scripts

- `scripts/check_contrast.py` — calculates WCAG contrast ratio between hex colors.

## Complete Examples

See `examples/usage-examples.md` for full end-to-end examples across tech B2B, wellness, and open-source applications.
