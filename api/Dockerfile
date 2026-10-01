# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:24.21.0-trixie-slim

# Build: all dependencies, Prisma client, nest build.
FROM ${NODE_IMAGE} AS build
WORKDIR /app

# Rarely changing files first, so a source edit does not reinstall dependencies.
# The schema is needed here because postinstall runs `prisma generate`.
COPY package.json package-lock.json ./
COPY prisma/schema.prisma ./prisma/
RUN npm ci --legacy-peer-deps

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# Dev: watch mode with mounted sources (docker-compose.yml). `nest start --watch` finds the
# old app process with `ps` before restarting it; slim images have no ps, so the old process
# keeps the port and every restart fails with EADDRINUSE.
FROM build AS dev
RUN apt-get update \
    && apt-get install -y --no-install-recommends procps \
    && rm -rf /var/lib/apt/lists/*

# Production dependencies only, with install scripts: @prisma/engines downloads the
# schema engine that `prisma migrate deploy` needs. The root postinstall runs
# `prisma generate`, hence the schema; the runtime takes the client from the build stage.
FROM ${NODE_IMAGE} AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma/schema.prisma ./prisma/
RUN npm ci --legacy-peer-deps --omit=dev

# Runtime: only what the app needs to start. Files stay owned by root, so the app
# user can read but not modify them; only uploads belongs to it.
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
# "type": "module" tells Node that dist/*.js is ESM.
COPY package.json ./
# Schema, migrations and config for `prisma migrate deploy` and `prisma db seed`.
COPY prisma ./prisma
COPY prisma7.config.ts ./
# pdf.service.ts reads fonts/DejaVuSans.ttf two levels up from dist/pdf.
COPY fonts ./fonts
# ServeStaticModule serves ./public at /static (default avatar).
COPY public ./public
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./src/generated

# A named volume mounted here takes this ownership on first use.
RUN mkdir -p uploads/photos uploads/avatars && chown -R node:node uploads

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
