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
# Arguments of one command: anything up to the next ;, &, | or newline. Without this, a flag
# from a later command in the same line (e.g. `grep -v`) is read as the docker command's flag.
A='[^;&|]*'

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
has "docker(-|${S}+)compose${S}(${A}${S})?down${S}(${A}${S})?(-v|--volumes)(${S}|$)" &&
  deny "docker compose down -v deletes the database, Redis and uploads volumes"
has "docker${S}+volume${S}+(rm|remove|prune)" && deny "docker volume removal deletes data"
has "docker${S}+system${S}+prune${S}${A}--volumes" && deny "docker system prune --volumes deletes data"

# The owner runs everything against the server and handles the vault (CONTRIBUTING, rule 4).
# Local checks that touch neither stay allowed.
# Command position only (line start or after ;, &, |, `(`), so text like a commit message passes.
C="(^|[;&|(])${S}*"
has "${C}ansible-vault(${S}|$)" && deny "ansible-vault: production secrets are handled by the owner"
has "${C}ansible(-playbook)?${S}+" &&
  ! has "${S}--(syntax-check|list-tasks|list-hosts|list-tags|version)(${S}|$)" &&
  deny "ansible/ansible-playbook against the server: the owner runs it"

has "(npm|pnpm|yarn)${S}(.*${S})?(install|i|ci|add)(${S}|$)" &&
  ask "dependency install: check the package name exists in the registry first"
has "prisma${S}+(migrate${S}+(dev|deploy|resolve)|db${S}+(push|execute|seed))" &&
  ask "Prisma command that changes the database"
has "${S}-delete(${S}|$)|xargs${S}+rm" && ask "file deletion"
has "docker${S}+((system|image|container|builder)${S}+prune|rm${S}+(${A}${S})?-[a-zA-Z]*f)" &&
  ask "Docker cleanup removes containers or images"

exit 0
