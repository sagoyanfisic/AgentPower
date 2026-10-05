#!/usr/bin/env python3
"""
generate_report.py — Generates test summary report in final-report.md format.
"""

import argparse
import json
import sys
from datetime import date
from pathlib import Path


def build_report(data: dict) -> str:
    total_added = (
        data.get("unit_added", 0)
        + data.get("integration_added", 0)
        + data.get("e2e_added", 0)
    )

    lines = []
    lines.append(f"# Test Completion Report — {date.today().isoformat()}")
    lines.append("")
    lines.append("## Added Tests")
    lines.append(f"- Unit: {data.get('unit_added', 0)}")
    lines.append(f"- Integration: {data.get('integration_added', 0)}")
    lines.append(f"- E2E: {data.get('e2e_added', 0)}")
    lines.append(f"- **Total: {total_added}**")
    lines.append("")
    lines.append("## Test Results")
    lines.append(f"- Passing: {data.get('passing', 0)}")
    lines.append(f"- Failing: {data.get('failing', 0)}")
    lines.append("")

    failures = data.get("failures", [])
    if failures:
        lines.append("## Failure Details")
        for f in failures:
            lines.append(f"- {f}")
        lines.append("")

    gaps = data.get("gaps", [])
    if gaps:
        lines.append("## Uncovered Requirements")
        for g in gaps:
            lines.append(f"- {g}")
        lines.append("")

    pending = data.get("pending_confirmation", [])
    if pending:
        lines.append("## Pending User Confirmation")
        for p in pending:
            lines.append(f"- {p}")
        lines.append("")

    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", type=Path, help="Path to JSON summary file")
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args()

    data = {}
    if args.json and args.json.exists():
        data = json.loads(args.json.read_text(encoding="utf-8"))

    report = build_report(data)

    if args.out:
        args.out.write_text(report, encoding="utf-8")
        print(f"Report written to {args.out}")
    else:
        print(report)


if __name__ == "__main__":
    main()
