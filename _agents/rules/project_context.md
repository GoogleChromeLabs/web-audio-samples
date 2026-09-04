---
trigger: always_on
description: "Project context, site architecture, and maintenance guidelines."
---

# Project Context & Maintenance

## Project Context
This project is a static site repository:
- Legacy site generation uses Eleventy (https://www.11ty.dev/docs/) with
  source files located in `src/`.
- Modern v4 site generation uses Astro with source files located in
  `v4-prototype/src/`.
- Use vanilla JS in ES6 style across client-side scripts.

## Maintenance Guidelines
- When updating dependencies, always check for breaking changes in
  `package.json`.
