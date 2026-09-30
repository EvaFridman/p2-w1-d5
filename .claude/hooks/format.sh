#!/usr/bin/env bash
# PostToolUse hook for Edit/Write: format the changed file the same way lint-staged does
# (root Prettier binary, run from root, nearest .prettierrc, root .prettierignore).
set -uo pipefail

file=$(jq -r '.tool_input.file_path // empty')
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"

[ -n "$file" ] && [ -f "$file" ] || exit 0
case "$file" in "$root"/*) ;; *) exit 0 ;; esac

cd "$root" || exit 0
node_modules/.bin/prettier --write --ignore-unknown --log-level warn "$file" >&2 ||
  { echo "format.sh: prettier failed on $file" >&2; exit 1; }
