---
trigger: always_on
description: "Enforce 80-column line limit on source code and markdown files."
---

# 80-Column Line Limit

For source code and Markdown files touched or edited by agents, make sure to
follow the 80-column line length rule.

Do not run this check for every intermediate edit. Verify compliance before
committing changes using the agent script:
```bash
python3 _agents/scripts/80-col.py <file_or_directory>
```

