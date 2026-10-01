#!/bin/bash
# Builds the production api and web images tagged with the commit hash, then starts them with
# docker-compose.prod.yml and checks that the site serves the catalog. Used by the `images` job
# in .github/workflows/ci.yml; runs locally the same way. Publishing is left to the caller.
#
#   IMAGE_TAG       default: short commit hash (git rev-parse --short=7 HEAD)
#   IMAGE_REGISTRY  default: empty (local names); in CI ghcr.io/<owner>/
#   SITE_URL        public site address baked into the web image; default from .env
#   IMAGE_SOURCE    optional repository URL, added as the org.opencontainers.image.source label
#
# Uses the compose project "realty-ci" with its own volumes, so a local run never touches the
# working stack's data. The web build prerenders from an api published on host port 3000.
set -euo pipefail
cd "$(dirname "$0")/.."

# Values given by the caller win over .env, where these names are usually empty.
caller_tag="${IMAGE_TAG:-}"
caller_registry="${IMAGE_REGISTRY:-}"
caller_site_url="${SITE_URL:-}"

[ -e .env ] || ./scripts/init-env.sh >/dev/null
set -a
# shellcheck disable=SC1091
. ./.env
set +a

export COMPOSE_PROJECT_NAME=realty-ci
export IMAGE_TAG="${caller_tag:-$(git rev-parse --short=7 HEAD)}"
export IMAGE_REGISTRY="${caller_registry:-${IMAGE_REGISTRY:-}}"
SITE_URL="${caller_site_url:-${SITE_URL:-http://localhost:3001}}"
API_IMAGE="${IMAGE_REGISTRY}realty-api:${IMAGE_TAG}"
WEB_IMAGE="${IMAGE_REGISTRY}realty-web:${IMAGE_TAG}"
BUILD_API=realty-ci-build-api
LABEL_ARGS=()
[ -n "${IMAGE_SOURCE:-}" ] && LABEL_ARGS=(--label "org.opencontainers.image.source=$IMAGE_SOURCE")

compose() { docker compose -f docker-compose.yml -f docker-compose.prod.yml "$@"; }
# Collapsible sections in the GitHub Actions log, plain headings elsewhere.
step() { if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::group::$*"; else echo "==> $*"; fi; }
done_step() { if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::endgroup::"; fi; }

cleanup() {
  docker rm -f "$BUILD_API" >/dev/null 2>&1 || true
  compose down --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

step "Build $API_IMAGE"
docker build "${LABEL_ARGS[@]}" -t "$API_IMAGE" api
done_step

step "Start postgres, redis, rabbitmq; migrate and seed"
compose up -d --wait postgres redis rabbitmq
compose run --rm --no-deps api npx prisma migrate deploy
compose run --rm --no-deps api npx prisma db seed
done_step

step "Build $WEB_IMAGE (prerenders from a temporary api on port 3000)"
compose run -d --rm --no-deps --name "$BUILD_API" -p 3000:3000 api >/dev/null
for _ in $(seq 1 60); do
  curl -sf http://localhost:3000/health/live >/dev/null && break
  sleep 1
done
curl -sf http://localhost:3000/health/live >/dev/null
docker build "${LABEL_ARGS[@]}" -t "$WEB_IMAGE" \
  --network host \
  --build-arg API_URL=http://localhost:3000 \
  --build-arg NEXT_PUBLIC_SITE_URL="$SITE_URL" \
  --build-arg NEXT_PUBLIC_API_BASE_URL="$SITE_URL" \
  --secret id=next_build_secret,env=NEXT_BUILD_SECRET \
  web
docker rm -f "$BUILD_API" >/dev/null
done_step

step "Smoke test: production overlay with $IMAGE_TAG"
compose up -d --wait
status=$(curl -s -o /tmp/realty-ci-listings.html -w '%{http_code}' http://localhost:3001/listings)
listings=$(grep -oE 'href="/listings/[0-9]+"' /tmp/realty-ci-listings.html | sort -u | wc -l | tr -d ' ')
echo "GET /listings -> $status, $listings listings"
[ "$status" = 200 ] && [ "$listings" -gt 0 ]
done_step

echo "Built and checked: $API_IMAGE $WEB_IMAGE"
