# Session Hygiene

## Why It Matters
Every previous message in a long chat session incurs token costs on every subsequent turn. A session dragging history across 5 features pays for unneeded context continuously.

## When to Close/Start a New Session

- Upon completing a feature and starting an independent new feature.
- When the current session has fulfilled its objective and the next task is unrelated.
- When you find yourself repeating context that belongs in `AGENTS.md` or `specs/`.

## What TO Persist in AGENTS.md / specs/

- Project conventions (commit styles, directory layout, naming).
- Architectural decisions and rationale.
- Business requirements confirmed by stakeholders (`requirements.md`, `validation.md`).
- Known technical debt and priority.
- Environment configurations (non-secret paths and environment variable names).

## What NOT to Persist

- Fast-changing implementation details.
- Verbose step-by-step chat reasoning — persist only final decisions and short rationales.
- Duplicated code that already exists in source files.

## Suggested Format

Use `assets/AGENTS.md.template` and `assets/specs/feature-template.md`. Keep `AGENTS.md` concise and place extended feature specs in `specs/<feature-name>.md`.
