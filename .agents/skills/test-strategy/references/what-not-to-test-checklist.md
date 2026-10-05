# What NOT to Test Checklist

## Over-testing Patterns to Avoid

- Trivial getters and setters without logic.
- Exhaustive combinatorial testing when boundary cases cover rules.
- Re-testing third-party framework guarantees (e.g., verifying `useState` or ORM persistence).
- Duplicating identical tests across unit and integration levels without added value.
- Flaky tests tied to brittle implementation details.

## Cases Requiring Stakeholder Confirmation First

- Ambiguous business logic (ask first before inventing behavior).
- Legal and compliance requirements (data retention, audit rules).
- Unconfirmed third-party API behaviors.

Report ambiguous cases in the final test report under "Pending User Confirmation".
