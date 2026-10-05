#!/usr/bin/env python3
"""Check requirement-to-test labels, not behavioral coverage or test results."""
import argparse
import re
from pathlib import Path

REQ_PATTERN = re.compile(r'\[(REQ-[\w-]+)\]\s*(.+)')
COVERS_PATTERN = re.compile(r'covers:\s*(REQ-[\w-]+)', re.IGNORECASE)
EXTENSIONS = {'.py', '.ts', '.js', '.tsx', '.jsx', '.go', '.rs', '.java', '.rb'}


def parse_requirements(path):
    requirements = {}
    for line in path.read_text(encoding='utf-8').splitlines():
        match = REQ_PATTERN.search(line)
        if match:
            key = match[1].upper()
            if key in requirements:
                raise ValueError(f'Duplicate requirement ID: {key}')
            requirements[key] = match[2].strip()
    if not requirements:
        raise ValueError('No requirement IDs found; expected [REQ-001] descriptions.')
    return requirements


def find_covered_ids(tests_dir):
    """Return references only; labels cannot establish actual coverage."""
    references = set()
    for file in tests_dir.rglob('*'):
        if file.is_file() and not file.is_symlink() and file.suffix in EXTENSIONS:
            references.update(match.upper() for match in COVERS_PATTERN.findall(file.read_text(encoding='utf-8')))
    return references


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--requirements', required=True, type=Path)
    parser.add_argument('--tests-dir', required=True, type=Path)
    args = parser.parse_args()
    try:
        if not args.requirements.is_file() or not args.tests_dir.is_dir():
            raise ValueError('Expected a requirements file and an existing test directory.')
        requirements = parse_requirements(args.requirements)
        references = find_covered_ids(args.tests_dir)
        unknown = references - requirements.keys()
        if unknown:
            raise ValueError('Unknown requirement references: ' + ', '.join(sorted(unknown)))
    except (OSError, UnicodeError, ValueError) as exc:
        print(f'INVALID INPUT: {exc}')
        return 2
    missing = requirements.keys() - references
    print(f'Requirements: {len(requirements)}; referenced by labels: {len(requirements) - len(missing)}')
    print('Labels indicate traceability only. Tests were not executed.')
    for key in sorted(missing):
        print(f'MISSING REFERENCE: {key}: {requirements[key]}')
    return 1 if missing else 0


if __name__ == '__main__':
    raise SystemExit(main())
