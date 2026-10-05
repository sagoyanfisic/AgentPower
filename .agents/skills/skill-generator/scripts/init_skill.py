#!/usr/bin/env python3
"""
Skill Initializer — Creates a new skill from a template

Usage:
    init_skill.py <skill-name> --path <path>

Examples:
    init_skill.py my-new-skill --path .agents/skills/
"""

import sys
from pathlib import Path


SKILL_TEMPLATE = """---
name: {skill_name}
description: [TODO: Full description explaining what the skill does and when to activate it.]
---

# {skill_title}

## Overview

[TODO: 1-2 sentences explaining what this skill enables.]

## Resources

### scripts/
Executable scripts for automation.

### references/
Detailed documentation and API guides loaded into context when needed.

### assets/
Templates, boilerplate code, or static assets used in output generation.
"""

SAMPLE_SCRIPT = '''#!/usr/bin/env python3
"""
Sample script for {skill_name}
"""

def main():
    print("Sample script execution for {skill_name}")

if __name__ == "__main__":
    main()
'''


def name_to_title(skill_name):
    return ' '.join(word.capitalize() for word in skill_name.split('-'))


def init_skill(skill_name, path):
    skill_dir = Path(path).resolve() / skill_name

    if skill_dir.exists():
        print(f"[ERROR] Skill directory already exists: {skill_dir}")
        return None

    try:
        skill_dir.mkdir(parents=True, exist_ok=False)
        (skill_dir / 'SKILL.md').write_text(SKILL_TEMPLATE.format(skill_name=skill_name, skill_title=name_to_title(skill_name)))

        (skill_dir / 'scripts').mkdir(exist_ok=True)
        sample_script_path = skill_dir / 'scripts' / 'sample.py'
        sample_script_path.write_text(SAMPLE_SCRIPT.format(skill_name=skill_name))
        sample_script_path.chmod(0o755)

        (skill_dir / 'references').mkdir(exist_ok=True)
        (skill_dir / 'references' / 'api_reference.md').write_text("# API Reference\n\n[API Documentation]")

        (skill_dir / 'assets').mkdir(exist_ok=True)
        (skill_dir / 'assets' / 'sample_asset.txt').write_text("Sample Asset Content")

        print(f"[SUCCESS] Skill '{skill_name}' initialized at {skill_dir}")
        return skill_dir
    except Exception as e:
        print(f"[ERROR] Failed to initialize skill: {e}")
        return None


def main():
    if len(sys.argv) < 4 or sys.argv[2] != '--path':
        print("Usage: init_skill.py <skill-name> --path <path>")
        sys.exit(1)

    skill_name = sys.argv[1]
    path = sys.argv[3]

    result = init_skill(skill_name, path)
    sys.exit(0 if result else 1)


if __name__ == "__main__":
    main()
