#!/bin/sh
# Creates .env for docker-compose.yml from .env.example: random passwords and secrets,
# local defaults for the rest, optional values left empty. Never overwrites an existing .env.
set -eu
cd "$(dirname "$0")/.."

if [ -e .env ]; then
  echo ".env already exists; delete it first to generate a new one" >&2
  exit 1
fi

secret() { openssl rand -hex "${1:-32}"; }

while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    POSTGRES_USER= | POSTGRES_DB= | RABBITMQ_USER=) echo "${line}realty" ;;
    POSTGRES_PASSWORD= | RABBITMQ_PASSWORD=) echo "${line}$(secret 16)" ;;
    JWT_ACCESS_SECRET= | JWT_REFRESH_SECRET= | REVALIDATE_SECRET= | NEXT_BUILD_SECRET=) echo "${line}$(secret)" ;;
    SEED_PASSWORD=) echo "${line}$(secret 8)" ;;
    SITE_URL=) echo "${line}http://localhost:3001" ;;
    CLIENT_URL=) echo "${line}http://localhost:5173" ;;
    ACCESS_TTL=) echo "${line}15m" ;;
    REFRESH_TTL=) echo "${line}30d" ;;
    MAIL_TRANSPORT=) echo "${line}stream" ;;
    MAIL_FROM=) echo "${line}no-reply@realty-board.local" ;;
    PAGE_SIZE_DEFAULT=) echo "${line}20" ;;
    PAGE_SIZE_MAX=) echo "${line}100" ;;
    LOG_LEVEL=) echo "${line}info" ;;
    *) echo "$line" ;;
  esac
done < .env.example > .env

chmod 600 .env
echo "Created .env. Password of the seed users (SEED_PASSWORD): $(grep '^SEED_PASSWORD=' .env | cut -d= -f2)"
