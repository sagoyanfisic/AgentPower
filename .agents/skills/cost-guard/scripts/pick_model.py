#!/usr/bin/env python3
"""
pick_model.py — suggests a task approach without changing the Codex session model.

Usage:
    python3 pick_model.py "add unit tests for calculate_total"
    python3 pick_model.py "design the schema for appointments table"

Quick heuristic keyword classifier.
"""

import sys

ARCHITECTURE_KEYWORDS = [
    "architecture", "design", "design schema", "security",
    "compliance", "legal", "data retention", "spec", "specs",
    "decide whether", "decision", "migrate from", "choose between",
]

MECHANICAL_KEYWORDS = [
    "test", "tests", "rename", "format",
    "docs", "documentation", "changelog", "small refactor",
    "boilerplate", "translate", "translation", "move",
    "find and replace",
]

PLANNING_KEYWORDS = [
    "read", "summarize", "summary", "explain how",
    "explore", "map", "review (read-only)", "analyze",
]


def classify(task: str) -> tuple[str, str]:
    t = task.lower()

    if any(k in t for k in ARCHITECTURE_KEYWORDS):
        return (
            "Architecture / Security / Specs",
            "Use the current Codex session; document decisions and relevant constraints.",
        )
    if any(k in t for k in MECHANICAL_KEYWORDS):
        return (
            "Mechanical & Bounded",
            "Use the current Codex session; make a bounded change and verify it.",
        )
    if any(k in t for k in PLANNING_KEYWORDS):
        return (
            "Reading / Planning",
            "Read relevant context in the current Codex session; do not modify files for a read-only task.",
        )
    return (
        "Unclassified",
        "Clarify the intended outcome when needed; "
        "keep the current session model. See references/model-routing.md.",
    )


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    task = " ".join(sys.argv[1:])
    category, suggestion = classify(task)

    print(f"Task: {task}")
    print(f"Suggested Category: {category}")
    print(f"Recommendation: {suggestion}")


if __name__ == "__main__":
    main()
