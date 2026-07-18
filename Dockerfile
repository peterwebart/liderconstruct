# syntax=docker/dockerfile:1

# =============================================================================
# LiderConstruct — production image (Next.js 15 + Payload 3, pnpm, standalone)
# -----------------------------------------------------------------------------
# UNTESTED STARTING POINT. This file was written to Next.js "standalone" +
# Payload 3 best practices but has NOT been built or run in this environment.
# Build it locally and adjust before relying on it. If you stay on Coolify's
# Nixpacks builder, you do NOT need this file at all.
#
# Multi-stage: deps -> builder -> runner. The final image runs the Next.js
# standalone server as a non-root user. Migrations/seed/import are run as
# one-off commands (see coolify.md), NOT baked into the image start.
# =============================================================================

ARG NODE_VERSION=22.11.0
ARG PNPM_VERSION=9.12.3

# --- Base with pnpm via corepack --------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS base
ARG PNPM_VERSION
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    NEXT_TELEMETRY_DISABLED=1
# libc6/openssl are present in bookworm-slim; sharp's prebuilt binaries work on
# glibc (Debian) without extra system packages — a key reason to prefer
# bookworm-slim over alpine here.
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# --- Dependencies (cached on lockfile) --------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --frozen-lockfile fails if the lockfile is out of date (reproducible builds).
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# --- Build ------------------------------------------------------------------
FROM base AS builder
ENV DOCKER_BUILD=1 \
    NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Payload needs a value for these at config-eval time during `next build`.
# They are BUILD-TIME ONLY placeholders; real secrets are injected at runtime.
# NEXT_PUBLIC_* values, however, are inlined at build and must be real if you
# rely on them in the client bundle — override via --build-arg as needed.
ARG NEXT_PUBLIC_SERVER_URL=https://liderconstruct.md
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL} \
    PAYLOAD_SECRET=build-time-placeholder-not-used-at-runtime \
    DATABASE_URI=postgres://build:build@localhost:5432/build
RUN pnpm run build

# --- Runtime ----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Non-root runtime user.
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# Next.js standalone output: server + minimal node_modules, static assets,
# and public/. See https://nextjs.org/docs/app/api-reference/config/next-config-js/output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# The standalone server entrypoint is server.js at the app root.
CMD ["node", "server.js"]
