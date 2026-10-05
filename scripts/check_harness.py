#!/usr/bin/env python3
"""Read-only structural checks for the Codex harness; not a full YAML parser."""
import argparse
import re
from pathlib import Path

REQUIRED = ('AGENTS.md', 'README.md', 'docs/harness.md', 'specs/state.md',
            'specs/decisions.md', 'specs/mission.md', 'specs/tech-stack.md',
            'specs/roadmap.md', 'specs/_template-feature/requirements.md',
            'specs/_template-feature/plan.md', 'specs/_template-feature/validation.md')


def inspect(root):
    root = Path(root).resolve()
    issues = []
    for path in REQUIRED:
        if not (root / path).is_file():
            issues.append(f'Missing file: {path}')
    for path in ('.opencode', 'opencode.json'):
        if (root / path).exists():
            issues.append(f'Legacy runtime configuration: {path}')
    base = root / '.agents/skills'
    folders = sorted(p for p in base.iterdir() if p.is_dir()) if base.is_dir() else []
    if not folders:
        issues.append('No local skills found in .agents/skills')
    names = set()
    for folder in folders:
        entry = folder / 'SKILL.md'
        if not entry.is_file():
            issues.append(f'Missing skill entrypoint: {folder.name}/SKILL.md')
            continue
        body = entry.read_text(encoding='utf-8')
        header = re.match(r'\A---\r?\n(.*?)\r?\n---(?:\r?\n|\Z)', body, re.S)
        if not header:
            issues.append(f'Invalid frontmatter delimiters: {folder.name}')
            continue
        name = re.search(r'^name: *([a-z0-9]+(?:-[a-z0-9]+)*) *$', header[1], re.M)
        description = re.search(r'^description: *\S.*$', header[1], re.M)
        if not name or len(name[1]) > 64 or not description:
            issues.append(f'Expected plain name and description fields: {folder.name}')
            continue
        if name[1] in names:
            issues.append(f'Duplicate skill name: {name[1]}')
        names.add(name[1])
        if name[1] != folder.name:
            issues.append(f'Skill name differs from folder: {folder.name}')
        for rel in re.findall(r'`((?:references/|scripts/|assets/|examples/|\.\./)[^`]+)`', body):
            if not (folder / rel).exists():
                issues.append(f'Missing skill resource: {folder.name}/{rel}')
    docs = [root / path for path in ('AGENTS.md', 'README.md', 'flow.mermaid')]
    for directory in ('docs', 'specs', '.agents/skills'):
        docs.extend((root / directory).rglob('*.md'))
    for doc in docs:
        if not doc.is_file():
            continue
        text = doc.read_text(encoding='utf-8')
        for name in re.findall(r'\$(sdd-[a-z]+(?:-[a-z]+)*)', text):
            if name not in names:
                issues.append(f'Unknown skill invocation in {doc.relative_to(root)}: {name}')
        for link in re.findall(r'\[[^\]]*\]\(([^\s)]+)\)', text):
            if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', link) or link.startswith('#'):
                continue
            path = link.split('#', 1)[0]
            if path and not (doc.parent / path).exists():
                issues.append(f'Broken local link in {doc.relative_to(root)}: {link}')
    return sorted(set(issues)), len(names)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    try:
        issues, count = inspect(args.root)
    except (OSError, UnicodeError) as exc:
        print(f'ERROR: Cannot read harness: {exc}')
        return 1
    for issue in issues:
        print(f'ERROR: {issue}')
    if issues:
        print(f'FAIL: {len(issues)} structural issue(s)')
        return 1
    print(f'PASS: {count} skills; structure, invocations and local links checked.')
    print('This does not execute skills or application tests.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
