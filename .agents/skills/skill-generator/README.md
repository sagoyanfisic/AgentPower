---
name: skill-generator
description: Automatically generates complete Skills (SKILL.md + references + scripts) from technical documentation by researching docs directly using search and web fetch capabilities — requiring no external API key configurations or MCP servers. Use this skill whenever the user validates creating a new skill, requires quick skill scaffolding, or requests repeatable knowledge packaging from tool/API documentation.
---

# Skill Generator

## Purpose

Transforms technical documentation (URLs, pages, or pasted documentation text) into a functional Skill: a properly formatted `SKILL.md` with frontmatter, a `references/` folder containing extracted patterns, and supporting scripts.

## Prerequisites

None. Uses built-in web search and fetch tools.

## Complete Workflow

1. **Clarify Scope**: Confirm source URLs, target use cases, and specific workflows required.
2. **Research Documentation**: Follow `references/extraction-prompt-template.md`. Paraphrase explanations to respect copyright.
3. **Initialize Directory**:
   ```bash
   python scripts/init_skill.py <skill-name> --path <destination-path>
   ```
4. **Fill Out `SKILL.md`**: Specify hyphen-case name, activation description (< 1024 chars), imperative workflows, and executable code examples.
5. **Organize Extended Content in `references/`**: Use `references/output-patterns.md` and `references/flow-patterns.md`.
6. **Validate**:
   ```bash
   python scripts/quick_validate.py <path-to-skill>
   ```
7. **Security Check**: Apply `security-best-practices` skill checklist.
8. **Package (Optional)**:
   ```bash
   python scripts/package_skill.py <skill-folder-path> [output-dir]
   ```

## References

- `references/extraction-prompt-template.md` — extraction research checklist.
- `references/extraction-schema.json` — schema guide for extracted metadata.
- `references/output-patterns.md` — output structure patterns.
- `references/flow-patterns.md` — sequential and conditional workflow patterns.

## Scripts

- `scripts/init_skill.py` — scaffolds skill structure.
- `scripts/quick_validate.py` — validates YAML frontmatter.
- `scripts/package_skill.py` — packages skill directory into a `.skill` file.
