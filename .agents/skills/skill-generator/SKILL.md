---
name: skill-generator
description: Automatically generates complete Skills (SKILL.md + references + scripts) from technical documentation by researching docs directly using search and web fetch capabilities — requiring no external API key configurations or MCP servers. Use this skill whenever the user validates creating a new skill, requires quick skill scaffolding, or requests repeatable knowledge packaging from tool/API documentation.
---

# Skill Generator

## Purpose

Transforms technical documentation (URLs, pages, or pasted documentation text) into a functional Skill: a properly formatted `SKILL.md` with frontmatter, a `references/` folder containing extracted patterns, and supporting scripts.

## Prerequisites

None. If documentation text is already provided in chat, use it directly and skip external web fetching.

## Complete Workflow

1. **Clarify Scope**:
   - Source documentation URLs or material.
   - Specific use cases to cover (e.g., "Stripe Webhooks" rather than "all Stripe APIs").
   - Required workflows or execution steps.

2. **Research Documentation**:
   - Use web search/fetch tools to extract authentication rules, endpoints, SDK usage, code examples, and edge cases.
   - Paraphrase explanations in your own words to respect copyright, maintaining exact names for headers, methods, and parameters.
   - Follow `references/extraction-prompt-template.md` checklist.

3. **Initialize Folder Structure**:
   ```bash
   python scripts/init_skill.py <skill-name> --path <destination-path>
   ```
   Creates `SKILL.md` template, `scripts/`, `references/`, and `assets/`.

4. **Fill Out `SKILL.md`**:
   - `name`: hyphen-case, lowercase, no spaces (`stripe-webhooks`).
   - `description`: concise statement of when to activate the skill (< 1024 chars, no `<` or `>`).
   - Workflows in imperative mood ("Run X", "Configure Y").
   - Executable code examples using environment variables for secrets.

5. **Organize Extensive Content in `references/`**:
   - Move detailed API specs, schemas, and complex patterns into `references/` files if `SKILL.md` exceeds ~500 lines. Refer to `references/output-patterns.md` and `references/flow-patterns.md`.

6. **Validate Skill**:
   ```bash
   python scripts/quick_validate.py <path-to-skill>
   ```

7. **Security Review**:
   - Apply `security-best-practices` checklist to ensure no hardcoded tokens, insecure command executions, or unvalidated inputs exist in generated scripts or examples.

8. **Package (Optional)**:
   ```bash
   python scripts/package_skill.py <skill-folder-path> [output-directory]
   ```

## References

- `references/extraction-prompt-template.md` — extraction checklist for documentation research.
- `references/extraction-schema.json` — JSON structure for organizing gathered details.
- `references/output-patterns.md` — patterns for structuring skill output.
- `references/flow-patterns.md` — workflow design patterns.

## Scripts

- `scripts/init_skill.py` — scaffolds new skill structure.
- `scripts/quick_validate.py` — validates YAML frontmatter and formatting.
- `scripts/package_skill.py` — packages skill directory into distributable `.skill` (zip) file.
