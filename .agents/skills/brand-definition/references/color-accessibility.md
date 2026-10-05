# Color Accessibility

WCAG threshold details and verification rules for the `brand-definition` skill.

## WCAG Thresholds

| Text Type | Min Ratio (AA) | Min Ratio (AAA) |
|---|---|---|
| Normal text (< 18px or < 14px bold) | 4.5:1 | 7:1 |
| Large text (≥ 18px or ≥ 14px bold) | 3:1 | 4.5:1 |
| Non-text UI components (input borders, icons) | 3:1 | — |

## Verification Method

Run `scripts/check_contrast.py`:
```bash
python3 scripts/check_contrast.py "#FFFFFF" "#0066CC"
```

## Remediation Strategy if Contrast Fails

1. Adjust lightness of foreground or background color until thresholds pass.
2. If brand colors are fixed corporate constraints, reserve brand colors for decorative elements and use black/white for text.
3. Record exact contrast ratios in `specs/brand-definition.md`.
