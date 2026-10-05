---
name: test-strategy
description: Strategy for deciding what to test, at what level (unit/integration/e2e), and in what report format to optimize token usage and execution time. Use whenever writing or reviewing tests, $sdd-test command executions, or tasks requesting test coverage.
---

# Cost-Effective Testing Strategy

Before writing tests, review this strategy checklist. Detailed code examples, non-testing guidelines, and report templates live in `references/` and `assets/templates/`.

## 1. Testing Pyramid (Priority Order)

1. **Unit Tests** — Pure logic, business rules, input validations. Fast, inexpensive, high volume.
2. **Integration Tests** — Database interactions, external APIs, multi-module flows. Write enough to cover scenarios in `requirements.md`.
3. **E2E Tests** — Critical business workflows (e.g., end-to-end checkout). High maintenance cost: use sparingly.

See `references/detailed-pyramid.md` for code examples per level.

## 2. Preventing Over-Testing

Before writing a test, ask: *"Does this test verify a requirement specified in requirements.md / validation.md?"* If no, skip it.

Avoid:
- Trivial getters/setters without logic.
- Exhaustive input combinations when boundary tests cover business rules.
- Testing third-party framework behavior.
- Duplicate tests across unit and integration levels without added value.

See `references/what-not-to-test-checklist.md`.

## 3. Handling Ambiguity

Do not write AI-generated tests for unconfirmed business rules or legal/compliance requirements. Mark these in the final report under "Pending User Confirmation" using `assets/templates/pending-confirmation.md`.

## 4. Optional Requirements Traceability Check

From the repository root, when the feature uses IDs such as `[REQ-001]`:
```bash
python3 .agents/skills/test-strategy/scripts/check_requirements_coverage.py --requirements specs/DATE-feature/requirements.md --tests-dir tests
```
Replace the example paths with the real feature and test directory. The script only
matches `covers: REQ-001` labels to requirement IDs. It does not run tests or prove
behavioral coverage. Exit 0 means every ID has a reference, 1 means missing references,
and 2 means invalid input (including no IDs, duplicates, or unknown test references).
Manual criteria need their own evidence in `validation.md`; do not fabricate labels
to make this optional diagnostic pass.

## 5. Output Report Format

Report results using `assets/templates/final-report.md` format:
- Tests added per level (unit/integration/e2e).
- Pass / fail counts.
- Real bug vs. test error breakdown.
- Requirements coverage status.
- Unconfirmed cases pending review.

`scripts/generate_report.py` formats a supplied summary JSON; it does not execute or parse a test runner. Do not use an empty summary as execution evidence.

## References and Resources

- `references/detailed-pyramid.md` — real code examples per testing level.
- `references/what-not-to-test-checklist.md` — list of over-testing patterns.
- `scripts/check_requirements_coverage.py` — compares requirements against test files.
- `scripts/generate_report.py` — generates final test report.
- `assets/templates/unit-test-template.py` — unit test template (Arrange-Act-Assert).
- `assets/templates/integration-test-template.py` — integration test template.
- `assets/templates/e2e-test-template.py` — E2E test template.
- `assets/templates/final-report.md` — test completion report template.
- `assets/templates/pending-confirmation.md` — template for ambiguous requirements.
