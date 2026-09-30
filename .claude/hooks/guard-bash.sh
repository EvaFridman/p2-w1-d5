#!/usr/bin/env bash
# PreToolUse hook for Bash: exit 2 blocks the command, JSON "ask" forces a confirmation prompt.
set -uo pipefail

cmd=$(jq -r '.tool_input.command // ""')

has() { grep -Eiq -- "$1" <<<"$cmd"; }

deny() {
  echo "Blocked by .claude/hooks/guard-bash.sh: $1" >&2
  echo "Command: $cmd" >&2
  exit 2
}

ask() {
  jq -n --arg r "guard-bash.sh: $1" \
    '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: $r}}'
  exit 0
}

S='[[:space:]]'

has "prisma${S}+migrate${S}+reset" && deny "prisma migrate reset drops and recreates the only local database"
has "prisma${S}+db${S}+push.*--(force-reset|accept-data-loss)" && deny "prisma db push with a data-loss flag"
has "(^|${S})dropdb(${S}|$)" && deny "dropdb deletes a database"
has "drop${S}+(database|schema|table)|truncate${S}" && deny "destructive SQL / truncate"
has "git${S}+push.*${S}(--force|-f)(${S}|$)" && deny "force push rewrites remote history"
has "git${S}+reset${S}.*--hard" && deny "git reset --hard discards uncommitted work"
has "git${S}+clean${S}+-[a-zA-Z]*f" && deny "git clean -f deletes untracked files"
has "--no-verify" && deny "--no-verify skips the repository git hooks"
has "(^|${S})rm${S}+-[a-zA-Z]*[rR][a-zA-Z]*${S}+(.*${S})?(/|~/?|\\\$HOME/?|\\*|\\./?)(${S}|$)" &&
  deny "recursive rm on /, ~, \$HOME, * or ."

has "(npm|pnpm|yarn)${S}(.*${S})?(install|i|ci|add)(${S}|$)" &&
  ask "dependency install: check the package name exists in the registry first"
has "prisma${S}+(migrate${S}+(dev|deploy|resolve)|db${S}+(push|execute|seed))" &&
  ask "Prisma command that changes the database"
has "${S}-delete(${S}|$)|xargs${S}+rm" && ask "file deletion"

exit 0
