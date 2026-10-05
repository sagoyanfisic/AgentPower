---
name: security-best-practices
description: Applies, reviews, and fixes security best practices across code, scripts, configurations, and agent skills before delivery or distribution. Use whenever new code is generated, a skill is packaged, a PR is reviewed, or when auditing security, checking safety, or addressing vulnerabilities in credentials, tokens, network calls, command execution, or user data.
---

# Security Best Practices

## Scope and Posture

This skill is **defensive**: it inspects, detects, and fixes security issues. It is not for designing exploits or unauthorized analysis.

The goal is to ensure reviewed artifacts (code, scripts, skills, configurations) are secure by default upon execution or installation.

## Trigger Scenarios

- Before packaging or distributing any skill.
- When writing or reviewing code handling secrets, user input, network operations, or file system access.
- When an explicit security review or audit is requested.
- As a proactive final step in any code generation workflow.

## Workflow

1. **Inventory Attack Surface**: Identify secrets/credentials, network calls, command execution calls (`subprocess`, `eval`, `exec`, `os.system`), unvalidated user input, and external dependencies.
2. **Apply Security Checklist**: Review against `references/security-checklist.md`.
3. **Check Common Antipatterns**: Cross-reference `references/common-antipatterns.md`.
4. **Optional Basic Static Scan**: Inspect the script first and run it only when execution is within scope. This heuristic scanner does not prove security.
   ```bash
   python scripts/basic_scan.py <target-path>
   ```
5. **Respect Review Scope**: For read-only reviews, report findings without editing files or running the scanner. When fixes are part of the authorized task, Apply concrete code fixes (e.g., move hardcoded keys to environment variables, parameterize database queries, sanitize inputs).
6. **Report Findings by Severity**:
   - **Critical**: Hardcoded credentials, command/SQL injection, arbitrary code execution, excessive permissions. Blocks release.
   - **High/Medium**: Missing input validation, sensitive info leaked in errors, unpinned dependencies, missing rate limits.
   - **Low/Info**: Security comment improvements, audit logging enhancements.

## Core Security Principles

- **Never hardcode secrets in plain text**: Use environment variables or secret managers.
- **Fail securely & explicitly**: Avoid silent error catching (`except: pass`).
- **Validate at boundaries**: Never trust external input.
- **Principle of Least Privilege**: Limit file, network, and system execution rights.
- **Documentation Safety**: Ensure sample configurations and documentation use placeholder values.

## Agent & Skill Specific Checks

- Ensure generated scripts do not execute unsanitized user commands.
- Ensure code samples in `SKILL.md` or `references/` do not contain active tokens or API keys.
- Ensure instructions do not bypass security warnings or suppress user confirmations.

## References

- `references/security-checklist.md` — detailed security checklist by domain.
- `references/common-antipatterns.md` — common security antipatterns and recommended fixes.

## Scripts

- `scripts/basic_scan.py` — static scanner for hardcoded secrets, dangerous functions, unhandled exceptions, and unsafe flags.
