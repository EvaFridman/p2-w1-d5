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

# Production dependencies only. Scripts are skipped: the root postinstall needs the
# Prisma CLI (a dev dependency), and the client is already generated in the build stage.
FROM ${NODE_IMAGE} AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --omit=dev --ignore-scripts

# Runtime: only what the app needs to start. Files stay owned by root, so the app
# user can read but not modify them; only uploads belongs to it.
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
# "type": "module" tells Node that dist/*.js is ESM.
COPY package.json ./
# Schema and migrations for `prisma migrate deploy`.
COPY prisma ./prisma
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
