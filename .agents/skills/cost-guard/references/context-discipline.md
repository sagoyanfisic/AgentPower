# Context Discipline — Concrete Patterns

Goal: Resolve tasks reading the minimum amount of text possible without sacrificing accuracy.

## Locating a Function or Class

Instead of: using `read` on full files to find `def calculate_total`.

Do this:
```bash
grep -rn "def calculate_total" --include="*.py" .
```
Then read only the ~30-50 lines around the matching line number.

## Confirming Existence (endpoint, env var, import)

Instead of: opening candidate files one by one.

Do this:
```bash
grep -rln "STRIPE_SECRET_KEY" .
```
`-l` returns only matching file paths. Read full files only if line context is strictly required.

## Listing Symbol Usage Before Refactoring

```bash
grep -rn "\bUserRepository\b" --include="*.ts" src/
```
Provides all call sites immediately.

## Exploring Codebase Structure

Instead of: `find .` or `ls -R` from the root directory.

Do this:
```bash
glob pattern: "**/*"
```
Or check specific directories step by step as needed.

## When Reading Full Files IS Warranted

- File is short (<150 lines) and will be edited anyway.
- Understanding complete flow of a small, cohesive module before touching it.
- Grep results returned >5 scattered matches in the same file.

## "Do Not Re-read" Rule

If a file was already loaded in tools or read earlier in the current session without modifications, reference existing context rather than re-reading the full file.

## Mental Budget Per Task

For bounded mechanical tasks:
- 1-3 `grep`/`glob` calls to locate files.
- 1-2 targeted `read` calls.
- Execute changes directly via `edit`/`write`/`bash`.
