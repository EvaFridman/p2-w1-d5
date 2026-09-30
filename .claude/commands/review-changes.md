---
description: "Review uncommitted changes before committing: layers, error handling, tests. Lists findings, changes nothing."
allowed-tools: Bash(git status:*), Bash(git diff:*), Read, Grep, Glob
---

## Uncommitted changes

!`git status --short`

!`git diff HEAD`

## Task

Review the changes above against `CLAUDE.md`, using the checklist and output format from
`.claude/agents/code-reviewer.md` (layers, error handling, tests, conventions). Read untracked
files from the status list yourself, since they are not in the diff.

This is review only: do not edit, create, stage or format any file, and do not run fixers.
If there are no uncommitted changes, say so and stop.
