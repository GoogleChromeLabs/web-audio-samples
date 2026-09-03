---
trigger: always_on
description: "Enforce 80-column line limit on source code and markdown files."
---

# 80-Column Line Limit

For source code and Markdown files touched or edited by agents, make sure to
follow the 80-column line length rule.

Always verify compliance using the workspace script:
```bash
python3 scripts/80-col.py <file_or_directory>
```

