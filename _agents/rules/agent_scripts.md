---
trigger: always_on
description: "Autonomous execution, agent scripts mandate, and commit pipeline."
---

# Autonomous Workflow & Agent Scripts

## 1. Core Principle: Autonomy & Self-Correction
- Agents must operate autonomously end-to-end without requiring human nudges.
- Do NOT prompt the user for intermediate confirmation on routine tasks.
- If a script or verification fails, inspect the error output, fix the
  underlying issue immediately, and re-run verification until green.

## 2. Strict Prohibitions (Anti-Patterns)
- **NO INLINE SCRIPTS**: NEVER execute inline script one-liners (`python3 -c`,
  `node -e`, `bash -c` eval loops, or ad-hoc `curl` scripts). Always inspect
  `_agents/scripts/` to use or add reusable workspace scripts.
- **NO SYMLINKS**: NEVER use symlinks (`ln -s`). Always copy or move files.
- **NO HEADLESS SCRIPTS FOR UI**: NEVER script Playwright, Puppeteer, or
  headless Chrome for visual checks. Use the built-in JetSki/Antigravity
  browser use feature (`/browser`).
- **NO INTERMEDIATE LINTING**: Do NOT run linters (`80-col.py`) on every file
  edit. Only verify line lengths at the pre-commit stage.

## 3. Workspace Automation Scripts Catalog
All agent automation lives under `_agents/scripts/`:
- `_agents/scripts/precommit.py`: Orchestrates the 3-step pre-commit pipeline
  (80-col lint -> build -> dev server endpoints).
- `_agents/scripts/80-col.py`: Verifies the 80-column line length limit.
- `_agents/scripts/check-endpoints.py`: Validates dev server HTTP routes and
  companion assets.
- `_agents/scripts/audit-routes.py`: Audits content collections, route
  mappings, and navigation categories.
- `_agents/scripts/check-action.py`: Checks GitHub Actions CI status and logs.

## 4. Autonomous Pre-Commit Protocol
When requested to commit (or preparing to commit):
1. **Execute Pre-Commit**: Run `python3 _agents/scripts/precommit.py`.
2. **Self-Correct**: If any step fails (lint violation, build failure, endpoint
   error), fix the issues autonomously and re-run.
3. **Commit & Push**: Once `precommit.py` reports success, stage changed files,
   commit with a descriptive message, and push if requested.

## 5. Content & Navigation Updates
Whenever guides, tests, or `Sidebar.astro` navigation items are touched:
- Autonomously run `python3 _agents/scripts/audit-routes.py` to ensure zero
  orphaned content pages and valid category assignments.
