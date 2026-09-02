#!/usr/bin/env python3
# Copyright (c) 2026 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

"""Utility script to check GitHub Actions run status and step outcomes.

Usage:
  python3 scripts/check-action.py [--branch <branch>] [--limit <n>]
  python3 scripts/check-action.py --run-id <run_id>
"""

import json
import subprocess
import sys
import urllib.request
from typing import Any, Optional

REPO = "GoogleChromeLabs/web-audio-samples"
API_BASE = f"https://api.github.com/repos/{REPO}"


def get_git_token() -> Optional[str]:
    """Retrieves auth token from git credential helper if available."""
    try:
        proc = subprocess.Popen(
            ["git", "credential", "fill"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        out, _ = proc.communicate("protocol=https\nhost=github.com\n\n")
        for line in out.splitlines():
            if line.startswith("password="):
                return line.split("=", 1)[1]
    except Exception:
        pass
    return None


def fetch_json(url: str, token: Optional[str] = None) -> Any:
    """Fetches JSON data from GitHub API."""
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "check-action-script")
    req.add_header("Accept", "application/vnd.github.v3+json")
    if token:
        req.add_header("Authorization", f"token {token}")

    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_job_logs(job_id: int, token: Optional[str]) -> Optional[list[str]]:
    """Fetches job logs, stripping Authorization header on redirect."""
    if not token:
        return None

    class StripAuthOnRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            new_req = super().redirect_request(
                req, fp, code, msg, headers, newurl
            )
            if new_req and "Authorization" in new_req.headers:
                del new_req.headers["Authorization"]
            return new_req

    url = f"{API_BASE}/actions/jobs/{job_id}/logs"
    opener = urllib.request.build_opener(StripAuthOnRedirect)
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "check-action-script")
    req.add_header("Authorization", f"token {token}")

    try:
        with opener.open(req, timeout=20) as resp:
            text = resp.read().decode("utf-8", errors="replace")
            return text.splitlines()
    except Exception:
        return None


def check_run(run: dict, token: Optional[str] = None):
    run_id = run["id"]
    name = run.get("name", "Unknown")
    branch = run.get("head_branch", "unknown")
    status = run.get("status", "unknown")
    conclusion = run.get("conclusion") or "running"
    head_c = run.get("head_commit") or {}
    commit_msg = head_c.get("message", "").split("\n")[0]

    print("=" * 78)
    print(f"Workflow : {name} (#{run_id})")
    print(f"Branch   : {branch}")
    print(f"Status   : {status} (conclusion: {conclusion})")
    print(f"Commit   : {commit_msg}")
    print(f"URL      : {run.get('html_url')}")
    print("=" * 78)

    jobs_data = fetch_json(f"{API_BASE}/actions/runs/{run_id}/jobs", token)
    jobs = jobs_data.get("jobs", [])

    for job in jobs:
        job_id = job["id"]
        job_name = job["name"]
        j_status = job["status"]
        j_conc = job.get("conclusion") or "running"
        print(f"\n[Job: {job_name}] status: {j_status}, conclusion: {j_conc}")

        failed_step = None
        for step in job.get("steps", []):
            s_num = step["number"]
            s_name = step["name"]
            s_conc = step.get("conclusion") or step.get("status")
            if s_conc == "failure":
                marker = "x"
            elif s_conc == "success":
                marker = "o"
            else:
                marker = "-"
            print(f"  [{marker}] Step {s_num}: {s_name} ({s_conc})")
            if s_conc == "failure" and failed_step is None:
                failed_step = step

        # Print annotations if job had failure
        if j_conc == "failure":
            try:
                ann_url = f"{API_BASE}/check-runs/{job_id}/annotations"
                annotations = fetch_json(ann_url, token)
                if annotations:
                    print("\n  Annotations:")
                    for ann in annotations:
                        lvl = ann.get("annotation_level", "info")
                        msg = ann.get("message", "")
                        path = ann.get("path", "")
                        line = ann.get("start_line", "")
                        print(f"    [{lvl.upper()}] {path}:{line} {msg}")
            except Exception:
                pass

            # Fetch log tail if possible
            logs = fetch_job_logs(job_id, token)
            if logs:
                print(f"\n  Log excerpt (last 60 lines of job {job_id}):")
                print("  " + "-" * 70)
                for line in logs[-60:]:
                    print(f"    {line}")
                print("  " + "-" * 70)


def main():
    branch = None
    run_id = None
    limit = 1

    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] == "--branch" and i + 1 < len(args):
            branch = args[i + 1]
            i += 2
        elif args[i] == "--run-id" and i + 1 < len(args):
            run_id = int(args[i + 1])
            i += 2
        elif args[i] == "--limit" and i + 1 < len(args):
            limit = int(args[i + 1])
            i += 2
        else:
            branch = args[i]
            i += 1

    token = get_git_token()

    if run_id:
        run = fetch_json(f"{API_BASE}/actions/runs/{run_id}", token)
        check_run(run, token)
        return

    url = f"{API_BASE}/actions/runs?per_page={max(limit, 5)}"
    if branch:
        url += f"&branch={branch}"

    data = fetch_json(url, token)
    runs = data.get("workflow_runs", [])
    if not runs:
        print(f"No workflow runs found (branch: {branch}).")
        return

    for run in runs[:limit]:
        check_run(run, token)


if __name__ == "__main__":
    main()
