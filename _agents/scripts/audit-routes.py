#!/usr/bin/env python3
# Copyright (c) 2026 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

"""Audit routes, content collections, and navigation categories for v4.

Usage:
  python3 _agents/scripts/audit-routes.py
"""

import re
import sys
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
SRC_DIR = WORKSPACE_ROOT / "v4-prototype" / "src"
GUIDES_DIR = SRC_DIR / "content" / "guides"
TESTS_DIR = SRC_DIR / "content" / "tests"

VALID_GUIDE_CATEGORIES = {"basic", "design-pattern", "migration"}
VALID_TEST_CATEGORIES = {"manual", "benchmark"}


def parse_frontmatter(md_file: Path) -> dict:
    """Extracts frontmatter key-values from markdown file."""
    data = {}
    if not md_file.is_file():
        return data
    content = md_file.read_text(encoding="utf-8", errors="replace")
    match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return data
    for line in match.group(1).splitlines():
        line = line.strip()
        if ":" in line and not line.startswith("#"):
            k, v = line.split(":", 1)
            data[k.strip()] = v.strip().strip("'\"")
    return data


def audit():
    errors = 0
    print("=" * 60)
    print("Auditing v4 Content Collections & Routes")
    print("=" * 60)

    # Audit Guides
    print("\n[Guides: Audio Worklet]")
    print("-" * 60)
    guide_counts = {cat: 0 for cat in VALID_GUIDE_CATEGORIES}
    if not GUIDES_DIR.is_dir():
        print(f"Error: Guides directory not found: {GUIDES_DIR}")
        return 1

    for guide_dir in sorted(GUIDES_DIR.iterdir()):
        if not guide_dir.is_dir():
            continue
        slug = guide_dir.name
        index_md = guide_dir / "index.md"
        fm = parse_frontmatter(index_md)
        category = fm.get("category", "")
        title = fm.get("title", slug)

        if not category:
            print(f"  [MISSING CATEGORY] {slug}")
            errors += 1
        elif category not in VALID_GUIDE_CATEGORIES:
            print(f"  [INVALID CATEGORY '{category}'] {slug}")
            errors += 1
        else:
            guide_counts[category] += 1
            route = f"/audio-worklet/{category}/{slug}/"
            print(f"  OK [{category:14s}] {slug:26s} -> {route}")

    print("\nGuide Category Counts:")
    for cat, count in guide_counts.items():
        print(f"  - {cat:16s}: {count} guides")

    # Audit Tests
    print("\n[Test Fixtures]")
    print("-" * 60)
    test_counts = {cat: 0 for cat in VALID_TEST_CATEGORIES}
    if TESTS_DIR.is_dir():
        for test_dir in sorted(TESTS_DIR.iterdir()):
            if not test_dir.is_dir():
                continue
            slug = test_dir.name
            index_md = test_dir / "index.md"
            fm = parse_frontmatter(index_md)
            category = fm.get("category", "")
            title = fm.get("title", slug)

            if not category:
                print(f"  [MISSING CATEGORY] {slug}")
                errors += 1
            elif category not in VALID_TEST_CATEGORIES:
                print(f"  [INVALID CATEGORY '{category}'] {slug}")
                errors += 1
            else:
                test_counts[category] += 1
                route = f"/tests/{category}/{slug}/"
                print(f"  OK [{category:14s}] {slug:26s} -> {route}")

        print("\nTest Category Counts:")
        for cat, count in test_counts.items():
            print(f"  - {cat:16s}: {count} tests")

    print("\n" + "=" * 60)
    if errors == 0:
        print("SUCCESS: All routes and categories audited cleanly.")
    else:
        print(f"WARNING: Encountered {errors} audit issue(s).")
    print("=" * 60)
    return errors


if __name__ == "__main__":
    sys.exit(0 if audit() == 0 else 1)
