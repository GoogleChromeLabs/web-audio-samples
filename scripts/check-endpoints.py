#!/usr/bin/env python3
# Copyright (c) 2026 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

"""Utility script to verify local dev server endpoints for guide folders.

Usage:
  python3 scripts/check-endpoints.py [guide_dir_or_url ...]
  python3 scripts/check-endpoints.py \
    v4-prototype/src/content/guides/noise-generator
"""

import re
import sys
import urllib.request
from pathlib import Path

DEFAULT_PORT = 4321
BASE_HOST = f"http://localhost:{DEFAULT_PORT}"


def get_guide_info(guide_dir: Path) -> tuple[str, str, list[str]]:
    """Extracts category, slug, and companion asset filenames."""
    slug = guide_dir.name
    index_md = guide_dir / "index.md"
    category = "basic"

    if index_md.is_file():
        content = index_md.read_text(encoding="utf-8")
        match = re.search(r"^category:\s*([^\r\n]+)", content, re.MULTILINE)
        if match:
            category = match.group(1).strip()

    companion_files = []
    for item in sorted(guide_dir.iterdir()):
        if item.is_file() and item.name not in ("index.md", "index.mdx"):
            if not item.name.startswith("."):
                companion_files.append(item.name)

    return category, slug, companion_files


def check_url(url: str) -> bool:
    try:
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req, timeout=5) as resp:
            content_type = resp.headers.get("Content-Type", "")
            coop = resp.headers.get("Cross-Origin-Opener-Policy", "")
            coep = resp.headers.get("Cross-Origin-Embedder-Policy", "")
            iso = " [COOP/COEP]" if (coop and coep) else ""
            print(f"OK: {resp.status}  {content_type:28s}  {url}{iso}")
            return resp.status == 200
    except Exception as e:
        print(f"FAIL: {url} ({e})", file=sys.stderr)
        return False


def main():
    if len(sys.argv) < 2:
        print(
            "Usage: python3 scripts/check-endpoints.py <guide_dir_or_url...>",
            file=sys.stderr,
        )
        sys.exit(1)

    all_ok = True
    for arg in sys.argv[1:]:
        p = Path(arg)
        if p.is_dir():
            category, slug, files = get_guide_info(p)
            base_url = f"{BASE_HOST}/audio-worklet/{category}/{slug}"
            urls = [f"{base_url}/"] + [f"{base_url}/{f}" for f in files]
            print(f"\nChecking guide: {p} ({len(urls)} endpoints)")
            for u in urls:
                if not check_url(u):
                    all_ok = False
        elif arg.startswith("http://") or arg.startswith("https://"):
            if not check_url(arg):
                all_ok = False
        else:
            print(f"Unrecognized target: {arg}", file=sys.stderr)
            all_ok = False

    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
