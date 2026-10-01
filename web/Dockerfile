# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:24.21.0-trixie-slim

# Dependencies and sources. The dev setup runs `next dev` from this stage.
# Runs as the node user: next dev in the dev setup writes .next here.
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN chown node:node /app
USER node

# Rarely changing files first, so a source edit does not reinstall dependencies.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

# Build: next build. The build prerenders pages and calls the API,
# so it needs a running api at API_URL (see README.md, "Сборка образа").
FROM deps AS build

# NEXT_PUBLIC_* are inlined into the browser bundle at build time: one image per environment.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SENTRY_DSN
# Used only while prerendering; the running container gets its own API_URL.
ARG API_URL

# NEXT_BUILD_SECRET comes in as a BuildKit secret: it exists only during this RUN
# and never lands in a layer or in `docker image history`.
RUN --mount=type=secret,id=next_build_secret,env=NEXT_BUILD_SECRET \
    npm run build

# Runtime: standalone server, static assets and public, nothing else.
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# The server writes its cache under .next at runtime, so this tree belongs to the app user.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build /app/public ./public

USER node
EXPOSE 3001
CMD ["node", "server.js"]
