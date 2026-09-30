---
description: Draft a pull request description for the current branch against origin/main. Outputs text only.
allowed-tools: Bash(git fetch:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Read, Grep, Glob
---

!`git fetch -q origin main || echo "(fetch failed: origin/main may be stale)"`

Branch: !`git branch --show-current`

!`git log --oneline origin/main..HEAD`

!`git diff origin/main...HEAD --stat`

## Task

Write a PR description in Russian as one markdown block:

- "Что сделано": grouped by purpose, not by file; name the key files.
- "Проверка": only checks actually run in this session, with results; never invent them.
- "Что осталось незавершённым": only if something is known to be left; otherwise omit.

Open changed files when the stat is not enough to explain a change. Do not create the PR,
push, commit or change files; only output the text.
