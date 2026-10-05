#!/usr/bin/env python3
"""
Skill Packager — Packages a skill directory into a distributable .skill (zip) file

Usage:
    python scripts/package_skill.py <path/to/skill-folder> [output-directory]
"""

import sys
import zipfile
from pathlib import Path
from quick_validate import validate_skill


def package_skill(skill_path, output_dir=None):
    skill_path = Path(skill_path).resolve()

    if not skill_path.exists() or not skill_path.is_dir():
        print(f"[ERROR] Skill directory not found: {skill_path}")
        return None

    if not (skill_path / "SKILL.md").exists():
        print(f"[ERROR] SKILL.md not found in {skill_path}")
        return None

    print("Validating skill...")
    valid, message = validate_skill(skill_path)
    if not valid:
        print(f"[ERROR] Validation failed: {message}")
        return None
    print(f"[SUCCESS] {message}\n")

    skill_name = skill_path.name
    output_path = Path(output_dir).resolve() if output_dir else Path.cwd()
    output_path.mkdir(parents=True, exist_ok=True)

    skill_filename = output_path / f"{skill_name}.skill"

    try:
        with zipfile.ZipFile(skill_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in skill_path.rglob('*'):
                if file_path.is_file():
                    arcname = file_path.relative_to(skill_path.parent)
                    zipf.write(file_path, arcname)

        print(f"[SUCCESS] Skill packaged at: {skill_filename}")
        return skill_filename
    except Exception as e:
        print(f"[ERROR] Failed to package skill: {e}")
        return None


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/package_skill.py <path/to/skill-folder> [output-directory]")
        sys.exit(1)

    skill_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None

    result = package_skill(skill_path, output_dir)
    sys.exit(0 if result else 1)


if __name__ == "__main__":
    main()
