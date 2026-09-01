#!/usr/bin/env python3
# Copyright (c) 2026 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

"""Linter script to check the 80-column line limit rule.

Usage:
  python3 scripts/80-col.py [file_or_dir ...]
  python3 scripts/80-col.py src/content/guides/hello-audio-worklet/index.md
"""

import argparse
import os
import sys
from pathlib import Path

DEFAULT_EXTENSIONS = {
    '.js', '.mjs', '.cjs', '.ts', '.tsx', '.astro', '.md', '.html', '.css',
    '.py', '.sh',
}

IGNORE_DIRS = {
    'node_modules', '.git', 'dist', '_site', '.astro', '.vscode',
}


def check_file(
    file_path: Path, max_col: int = 80
) -> list[tuple[int, int, str]]:
    violations = []
    try:
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            for line_no, raw_line in enumerate(f, start=1):
                line = raw_line.rstrip('\r\n')
                col_len = len(line)
                if col_len > max_col:
                    violations.append((line_no, col_len, line))
    except Exception as e:
        print(f"Error reading {file_path}: {e}", file=sys.stderr)
    return violations


def collect_files(targets: list[str]) -> list[Path]:
    files = []
    for target in targets:
        p = Path(target)
        if p.is_file():
            files.append(p)
        elif p.is_dir():
            for root, dirs, filenames in os.walk(p):
                dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
                for fname in filenames:
                    ext = Path(fname).suffix.lower()
                    if ext in DEFAULT_EXTENSIONS:
                        files.append(Path(root) / fname)
    return sorted(set(files))


def main():
    parser = argparse.ArgumentParser(
        description="Verify 80-column line limit rule on files or directories."
    )
    parser.add_argument(
        "targets",
        nargs="*",
        default=["v4-prototype/src"],
        help="Files or directories to check (default: v4-prototype/src).",
    )
    parser.add_argument(
        "--max-col",
        type=int,
        default=80,
        help="Maximum allowed line column width (default: 80).",
    )
    args = parser.parse_args()

    files = collect_files(args.targets)
    if not files:
        print("No matching files found to check.")
        sys.exit(0)

    total_violations = 0
    files_with_violations = 0

    for file_path in files:
        violations = check_file(file_path, args.max_col)
        if violations:
            files_with_violations += 1
            total_violations += len(violations)
            print(f"\nFAIL: {file_path} ({len(violations)} violations)")
            for line_no, col_len, line in violations:
                snippet = (
                    line[:70] + "..." if len(line) > 73 else line
                )
                print(f"  Line {line_no:4d} [{col_len:3d} cols]: {snippet}")

    if total_violations == 0:
        print(
            f"OK: Checked {len(files)} file(s). "
            f"All lines <= {args.max_col} columns."
        )
        sys.exit(0)
    else:
        print(
            f"\nFound {total_violations} violation(s) across "
            f"{files_with_violations} file(s)."
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
