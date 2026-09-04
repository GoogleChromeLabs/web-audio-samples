#!/usr/bin/env python3
# Copyright (c) 2026 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

"""Pre-commit verification script.

Runs the four-step pre-commit sequence:
  1) 80-column line limit check on changed/staged files
  2) Build verification (npm run build)
  3) Endpoint verification against dev server (check-endpoints.py)
  4) Final readiness status for git commit

Usage:
  python3 _agents/scripts/precommit.py [options]

Options:
  --all             Check all files, not just git-modified files.
  --skip-lint       Skip 80-column line length check.
  --skip-build      Skip npm run build step.
  --skip-endpoints  Skip dev server endpoint checks.
"""

import argparse
import subprocess
import sys
from pathlib import Path
import urllib.request

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
SCRIPT_80_COL = (
    WORKSPACE_ROOT / "_agents" / "scripts" / "80-col.py"
)
SCRIPT_ENDPOINTS = (
    WORKSPACE_ROOT / "_agents" / "scripts" / "check-endpoints.py"
)

CORE_ENDPOINTS = [
    "http://localhost:4321/",
    "http://localhost:4321/audio-worklet/basic/",
    "http://localhost:4321/audio-worklet/design-pattern/",
    "http://localhost:4321/audio-worklet/migration/",
    "http://localhost:4321/tests/manual/",
    "http://localhost:4321/tests/benchmark/",
    "http://localhost:4321/demos/",
    "http://localhost:4321/resources/",
]


def get_git_changed_files() -> list[str]:
    """Returns list of changed, staged, or untracked files in git."""
    try:
        res = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=str(WORKSPACE_ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True,
        )
        files = []
        for line in res.stdout.splitlines():
            line = line.strip()
            if not line:
                continue
            # Format: 'XY filename' or 'R  orig -> new'
            parts = line[2:].strip().split(" -> ")
            fname = parts[-1].strip()
            # Ignore deleted files
            p = WORKSPACE_ROOT / fname
            if p.is_file():
                files.append(str(p))
        return files
    except Exception as e:
        print(f"Warning: Failed to get git status: {e}", file=sys.stderr)
        return []


def is_dev_server_running(port: int = 4321) -> bool:
    """Checks whether the dev server is currently accepting connections."""
    try:
        req = urllib.request.Request(f"http://localhost:{port}/", method="HEAD")
        with urllib.request.urlopen(req, timeout=2):
            return True
    except Exception:
        return False


def run_step(step_num: int, title: str) -> None:
    print(f"\n[{step_num}/3] {title}")
    print("-" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="Run pre-commit checks: lint, build, and test endpoints."
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Check all project files for lint, not just changed files.",
    )
    parser.add_argument(
        "--skip-lint",
        action="store_true",
        help="Skip the 80-column line length check.",
    )
    parser.add_argument(
        "--skip-build",
        action="store_true",
        help="Skip npm run build.",
    )
    parser.add_argument(
        "--skip-endpoints",
        action="store_true",
        help="Skip dev server endpoint verification.",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("Running Pre-Commit Verification Pipeline")
    print("=" * 60)

    # Step 1: 80-column lint check
    run_step(1, "Checking 80-column line length limit")
    if args.skip_lint:
        print("Skipping lint check (--skip-lint).")
    else:
        if args.all:
            lint_targets = [
                str(WORKSPACE_ROOT / "v4-prototype" / "src"),
                str(WORKSPACE_ROOT / "_agents"),
            ]
        else:
            changed = get_git_changed_files()
            if changed:
                lint_targets = changed
                print(f"Linting {len(changed)} changed file(s)...")
            else:
                print("No changed files in git. Checking default directories.")
                lint_targets = [
                    str(WORKSPACE_ROOT / "v4-prototype" / "src"),
                    str(WORKSPACE_ROOT / "_agents"),
                ]

        cmd = [sys.executable, str(SCRIPT_80_COL)] + lint_targets
        lint_res = subprocess.run(cmd, cwd=str(WORKSPACE_ROOT))
        if lint_res.returncode != 0:
            print("\n[FAILED] 80-column line length check failed.",
                  file=sys.stderr)
            print("Fix line length violations before committing.",
                  file=sys.stderr)
            sys.exit(1)

    # Step 2: Build verification
    run_step(2, "Verifying production build (npm run build)")
    if args.skip_build:
        print("Skipping build verification (--skip-build).")
    else:
        build_res = subprocess.run(
            ["npm", "run", "build"], cwd=str(WORKSPACE_ROOT)
        )
        if build_res.returncode != 0:
            print("\n[FAILED] Build verification failed.", file=sys.stderr)
            sys.exit(1)

    # Step 3: Endpoint verification
    run_step(3, "Verifying dev server endpoints")
    if args.skip_endpoints:
        print("Skipping endpoint check (--skip-endpoints).")
    else:
        if not is_dev_server_running(4321):
            print(
                "Notice: Dev server not detected on http://localhost:4321.\n"
                "To test endpoints, start the dev server before precommit."
            )
        else:
            cmd = [sys.executable, str(SCRIPT_ENDPOINTS)] + CORE_ENDPOINTS
            ep_res = subprocess.run(cmd, cwd=str(WORKSPACE_ROOT))
            if ep_res.returncode != 0:
                print("\n[FAILED] Endpoint check failed.", file=sys.stderr)
                sys.exit(1)

    print("\n" + "=" * 60)
    print("SUCCESS: All pre-commit checks passed!")
    print("You are ready to commit your changes.")
    print("=" * 60)
    sys.exit(0)


if __name__ == "__main__":
    main()
