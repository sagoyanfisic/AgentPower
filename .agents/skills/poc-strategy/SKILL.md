---
name: poc-strategy
description: How to execute a Proof of Concept (POC) to validate hypotheses, compare technologies, and make informed technical decisions. Use this whenever you need to investigate and test 2 or more technologies or approaches before implementing them in the actual codebase.
---

# Proof of Concept (POC) Strategy

Before building the POC, follow this workflow to ensure the validation is efficient and answers the project's needs without over-engineering.

## 1. Hypothesis and Criteria Definition

Before writing code:
- Clearly identify what is being validated (e.g., "Is X faster than Y for this query?", "Does library Z support use case W?").
- Define strict **success criteria**. This is not about building the entire feature, but testing the uncertain or risky aspect.
- Choose the 2 or more alternatives to compare, or the single approach to test if it's just a viability validation.

## 2. Isolation

- A POC **must not pollute** the main codebase (main) or final design until a decision is made.
- Create the POC code in an isolated folder like `poc/<hypothesis-name>/`, or do it in a dedicated disposable branch.
- Keep the implementation as raw and simple as possible: do not worry about final architecture, design patterns, or exhaustive tests, unless those are the criteria being evaluated.

## 3. POC Execution

- Implement the minimum necessary functionality in each technology or approach.
- Use quick scripts (`bash`, `node`, `python`, etc.) to simulate the environment or load if necessary.
- Measure the results according to the defined success criteria (e.g., performance in ms, bundle size, API ease of use, compatibility).

## 4. Decision and Documentation

When finished, do not assume the POC will be merged as-is. You must generate a brief report:
1. **Validation Summary:** What was tested and with what alternatives.
2. **Results:** Clear comparison of how each alternative performed against the success criteria.
3. **Recommended Decision:** Which alternative won and why.
4. **Next Steps:** How to extract the "base functionality" from the winning POC to then integrate it with best practices into the actual app feature/spec.

## 5. Expected Output Format

Produce a report in plain text or Markdown as the final output, indicating:
- **Hypothesis:** ...
- **Alternatives:** ...
- **Winner:** ...
- **Justification:** ...

*Note: Once the user approves the POC result, the winning code (or lesson learned) should be used as a reference for formal implementation through the regular agent or workflow (e.g., via `plan.md` and `$sdd-implement`).*