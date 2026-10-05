"""Behavioral checks for diagnostics and requirement traceability."""
import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('doctor', ROOT / 'scripts/check_harness.py')
doctor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(doctor)
COVERAGE = ROOT / '.agents/skills/test-strategy/scripts/check_requirements_coverage.py'


class HarnessDoctorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for path in doctor.REQUIRED:
            dest = self.root / path
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text('# Fixture\n')
        self.skill = self.root / '.agents/skills/sdd-example/SKILL.md'
        self.skill.parent.mkdir(parents=True)
        self.skill.write_text('---\nname: sdd-example\ndescription: Test example.\n---\n')

    def test_valid_harness_without_git_history_is_read_only(self):
        before = {str(p): p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
        self.assertEqual(doctor.inspect(self.root), ([], 1))
        after = {str(p): p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
        self.assertEqual(before, after)

    def test_missing_resource_is_reported(self):
        with self.skill.open('a') as file:
            file.write('Read `references/missing.md`.\n')
        self.assertTrue(any('Missing skill resource' in issue for issue in doctor.inspect(self.root)[0]))

    def test_unknown_invocation_and_broken_link_are_reported(self):
        (self.root / 'README.md').write_text('$sdd-unknown\n[State](missing.md)\n')
        issues, _ = doctor.inspect(self.root)
        self.assertTrue(any('Unknown skill invocation' in issue for issue in issues))
        self.assertTrue(any('Broken local link' in issue for issue in issues))

    def test_malformed_skill_and_legacy_runtime_fail_cli(self):
        self.skill.write_text('No frontmatter\n')
        (self.root / 'opencode.json').write_text('{}')
        result = subprocess.run([sys.executable, str(ROOT / 'scripts/check_harness.py'), '--root', str(self.root)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn('Legacy runtime configuration', result.stdout)
        self.assertIn('Invalid frontmatter', result.stdout)


class TraceabilityTests(unittest.TestCase):
    def run_check(self, requirements, labels):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'requirements.md').write_text(requirements)
            (root / 'tests').mkdir()
            (root / 'tests/test_sample.py').write_text(labels)
            return subprocess.run([sys.executable, str(COVERAGE), '--requirements', str(root / 'requirements.md'), '--tests-dir', str(root / 'tests')], capture_output=True, text=True)

    def test_empty_requirements_never_report_success(self):
        result = self.run_check('# Requirements\n', '')
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertIn('No requirement IDs', result.stdout)

    def test_missing_reference_has_nonzero_exit(self):
        result = self.run_check('- [REQ-001] Save result\n', '')
        self.assertEqual(result.returncode, 1, result.stderr)
        self.assertIn('MISSING REFERENCE', result.stdout)

    def test_matching_label_does_not_claim_test_execution(self):
        result = self.run_check('- [REQ-001] Save result\n', '# covers: req-001\nraise RuntimeError("must not execute")\n')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('Tests were not executed', result.stdout)

    def test_duplicate_ids_are_invalid(self):
        result = self.run_check('[REQ-001] First\n[REQ-001] Second\n', '# covers: REQ-001')
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertIn('Duplicate', result.stdout)

    def test_unknown_reference_is_invalid(self):
        result = self.run_check('[REQ-001] First\n', '# covers: REQ-002')
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertIn('Unknown requirement', result.stdout)


if __name__ == '__main__':
    unittest.main()
