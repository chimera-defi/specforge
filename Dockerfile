# Multi-stage Dockerfile for SpecForge Web App
# Stage 1: Dependencies
FROM oven/bun:1.1 AS deps
WORKDIR /app

# Copy dependency files
COPY package.json bun.lockb ./
COPY web/package.json web/bun.lockb ./web/

# Install dependencies
RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:1.1 AS builder
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
RUN bun run build

# Stage 3: Runner
FROM oven/bun:1.1 AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bun

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy built application
COPY --from=builder /app/web/.next ./.next
COPY --from=builder /app/web/public ./public
COPY --from=builder /app/web/package.json ./package.json

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/web/node_modules ./web/node_modules

# Set permissions
RUN chown -R bun:nodejs /app

# Switch to non-root user
USER bun

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["bun", "run", "start"]