# AGENTS.md

## Project Context
This is a static site built with Eleventy (https://www.11ty.dev/docs/).
- Source files for site generation are located in `src/`.
- Use vanilla JS on ES6 style.

## Maintenance Guidelines
- When updating dependencies, always check for breaking changes in
  `package.json`.

## Coding & Verification Guidelines
- Follow the 80-column line length rule for all touched source and Markdown
  files.
- Verify line lengths using: `python3 scripts/80-col.py <path>`.
- When verifying local dev server endpoints, use the workspace script
  `python3 scripts/check-endpoints.py <urls_or_dirs>` rather than drafting
  ad-hoc scripts or commands.