# Multi-stage Dockerfile for SpecForge Web App
# Stage 1: Dependencies
FROM oven/bun:1.3.9 AS deps
WORKDIR /app

# Copy dependency files. Keep workspace package manifests present so Bun can
# resolve the root workspace without copying the full source tree yet.
COPY package.json bun.lock ./
COPY web/package.json ./web/package.json
COPY cli/package.json ./cli/package.json
COPY orchestrator/package.json ./orchestrator/package.json
COPY collab-server/package.json ./collab-server/package.json
COPY desktop/package.json ./desktop/package.json
COPY bridge/package.json ./bridge/package.json

# Install dependencies
RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:1.3.9 AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/web/node_modules ./web/node_modules

# Copy source code
COPY . .

# Set environment for build
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Build the application
WORKDIR /app/web
RUN SPECFORGE_SESSION_SECRET=build-session-secret-0000000000000000000000000000000000 \
  SPECFORGE_CSRF_SECRET=build-csrf-secret-000000000000000000000000000000000000 \
  GITHUB_CLIENT_ID=build-oauth-disabled \
  GITHUB_CLIENT_SECRET=build-oauth-disabled \
  SPECFORGE_GITHUB_REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback \
  bun run build

# Stage 3: Runner
FROM oven/bun:1.3.9 AS runner
WORKDIR /app/web

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy built application
COPY --from=builder /app/web/.next ./.next
COPY --from=builder /app/web/public ./public
COPY --from=builder /app/web/package.json ./package.json
COPY fixtures /app/fixtures
COPY spec /app/spec

# Copy dependencies
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/web/node_modules /app/web/node_modules

# Set permissions for local pglite/json persistence without rewriting
# node_modules ownership during image builds.
RUN mkdir -p /app/web/.data && chown bun:bun /app/web/.data

# Switch to non-root user
USER bun

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3000/api/health').then((r) => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

# Start the application
CMD ["bun", "run", "start"]
