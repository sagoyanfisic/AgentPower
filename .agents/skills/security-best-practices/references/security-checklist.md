# Security Checklist

Review each category. Mark applicable items for the reviewed artifact.

## 1. Secrets and Credentials
- [ ] Are API keys, tokens, passwords, or connection strings hardcoded?
- [ ] Are secrets exposed in example files, READMEs, comments, or git history?
- [ ] Are secrets read from environment variables or secret managers?
- [ ] Is there a `.gitignore` excluding `.env` and local credentials?
- [ ] Do error messages or logs avoid printing secret values?

## 2. Injection (Commands, SQL, Templates)
- [ ] Are SQL queries constructed with prepared parameters rather than string concatenation?
- [ ] Are shell commands executed without unsanitized string concatenation (`subprocess` with `shell=False`)?
- [ ] Is `eval()` or `exec()` avoided on untrusted data?
- [ ] Are template values properly sanitized/escaped before rendering?

## 3. Authentication & Authorization
- [ ] Does every sensitive endpoint verify identity and resource-level permissions?
- [ ] Do tokens have reasonable expiration lifetimes and revocation mechanisms?
- [ ] Are token signatures validated?

## 4. Input Validation
- [ ] Is all external input validated (type, length, range) before processing?
- [ ] Are invalid requests explicitly rejected rather than guessed?

## 5. Error Handling & Logging
- [ ] Are empty `except: pass` blocks avoided around sensitive logic?
- [ ] Do error responses avoid leaking internal stack traces or file paths?
- [ ] Is sufficient audit logging present without logging sensitive secret values?

## 6. Dependencies & Supply Chain
- [ ] Are new dependency versions pinned?
- [ ] Are packages sourced from official repositories?

## 7. Network & System Attack Surface
- [ ] Are network calls restricted to documented endpoints?
- [ ] Are file system/network permissions restricted to minimum necessary rights?
