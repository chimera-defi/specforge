# Dockerfile for SpecForge Collab Server
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

# Stage 2: Runner
FROM oven/bun:1.3.9 AS runner
WORKDIR /app/collab-server

# Set environment
ENV NODE_ENV=production
ENV PORT=1234
ENV HEALTH_PORT=1235

# Copy runtime dependencies and source. The server imports /app/lib/collab-auth.cjs
# via ../../lib/collab-auth.cjs from collab-server/src/index.js.
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/collab-server/node_modules /app/collab-server/node_modules
COPY collab-server/package.json ./package.json
COPY collab-server/src ./src
COPY lib /app/lib

# Set permissions for filesystem room snapshots without rewriting
# node_modules ownership during image builds.
RUN mkdir -p /app/collab-server/.data && chown bun:bun /app/collab-server/.data

# Switch to non-root user
USER bun

# Expose port
EXPOSE 1234
EXPOSE 1235

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:' + (process.env.HEALTH_PORT || '1235') + '/health').then((r) => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

# Start the application
CMD ["bun", "src/index.js"]
