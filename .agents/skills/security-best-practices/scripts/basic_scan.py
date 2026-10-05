#!/usr/bin/env python3
"""
Basic static security scan tool.
Performs static analysis looking for high-risk patterns (hardcoded secrets, dangerous functions, unhandled errors).
"""

import re
import sys
from pathlib import Path

TEXT_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".sh", ".bash", ".rb", ".go",
    ".java", ".php", ".md", ".json", ".yaml", ".yml", ".env", ".cfg", ".ini",
}

RULES = [
    (
        "hardcoded-secret",
        re.compile(
            r'(?i)(api[_-]?key|secret|token|password|passwd|access[_-]?key)\s*[:=]\s*'
            r'["\'][A-Za-z0-9_\-\/\+=]{12,}["\']'
        ),
        "CRITICAL",
        "Possible hardcoded credential or secret detected.",
    ),
    (
        "os-system",
        re.compile(r"\bos\.system\s*\("),
        "HIGH",
        "os.system executes shell strings; vulnerable if handling external input.",
    ),
    (
        "subprocess-shell-true",
        re.compile(r"subprocess\.\w+\([^)]*shell\s*=\s*True"),
        "HIGH",
        "subprocess with shell=True is vulnerable to command injection.",
    ),
    (
        "eval-exec",
        re.compile(r"\b(eval|exec)\s*\("),
        "CRITICAL",
        "eval()/exec() enables arbitrary code execution on untrusted input.",
    ),
]

IGNORE_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build"}


def scan_file(file_path):
    findings = []
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return findings

    for rule_name, pattern, severity, explanation in RULES:
        for match in pattern.finditer(content):
            line_num = content[: match.start()].count("\n") + 1
            findings.append({
                "file": str(file_path),
                "line": line_num,
                "rule": rule_name,
                "severity": severity,
                "explanation": explanation,
                "snippet": content.splitlines()[line_num - 1].strip()[:120],
            })
    return findings


def scan_path(base_path):
    base_path = Path(base_path)
    findings = []

    files = [base_path] if base_path.is_file() else [
        p for p in base_path.rglob("*")
        if p.is_file() and p.suffix.lower() in TEXT_EXTENSIONS
        and not any(part in IGNORE_DIRS for part in p.parts)
    ]

    for f in files:
        findings.extend(scan_file(f))

    return findings


def print_report(findings):
    if not findings:
        print("[SECURITY SCAN] No known security risk patterns found.")
        return

    print(f"[SECURITY FINDINGS] Found {len(findings)} match(es):\n")
    for h in findings:
        print(f"[{h['severity']}] {h['rule']}")
        print(f"  File: {h['file']}:{h['line']}")
        print(f"  {h['explanation']}")
        print(f"  > {h['snippet']}\n")


def main():
    if len(sys.argv) != 2:
        print("Usage: python basic_scan.py <target-path>")
        sys.exit(1)

    path = sys.argv[1]
    if not Path(path).exists():
        print(f"Error: path does not exist: {path}")
        sys.exit(1)

    findings = scan_path(path)
    print_report(findings)
    has_critical = any(h["severity"] == "CRITICAL" for h in findings)
    sys.exit(1 if has_critical else 0)


if __name__ == "__main__":
    main()
