# Skill Extraction Research Checklist

Checklist for researching technical documentation and extracting material for building a Skill.

## Extraction Checklist

1. **Skill Identity**: Hyphen-case name, activation description (< 1024 chars), overview, user triggers.
2. **Workflows**: Operation name, description, imperative step-by-step instructions, code examples.
3. **API Details**: HTTP method, path, parameter types, response format.
4. **Authentication**: Auth method, header names, environment variable names.
5. **Code Examples**: Executable samples in Python, TypeScript, cURL using environment variables for secrets.
6. **Best Practices & Gotchas**: Rate limits, error handling, edge cases.
7. **Progressive Disclosure**: Divide content exceeding ~500 lines into `references/` files.
