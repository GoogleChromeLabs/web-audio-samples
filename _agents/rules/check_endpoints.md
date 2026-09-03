---
trigger: always_on
description: "Use scripts/check-endpoints.py to verify dev server endpoints."
---

# Dev Server Endpoint Verification

When testing or verifying routes, guides, and pages served by the local dev
server, always use the dedicated workspace script rather than drafting inline
Python or ad-hoc shell commands:

```bash
python3 scripts/check-endpoints.py <guide_dir_or_url...>
```

Examples:
```bash
# Verify a specific guide and its companion assets
python3 scripts/check-endpoints.py \
  v4-prototype/src/content/guides/noise-generator

# Verify arbitrary URLs or endpoints
python3 scripts/check-endpoints.py \
  http://localhost:4321/tests/ \
  http://localhost:4321/tests/setsinkid/
```
