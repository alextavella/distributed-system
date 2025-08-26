# Build stage
FROM node:22-alpine AS builder

# Set working directory to workspace root
WORKDIR /workspace

# Install pnpm globally
RUN npm install -g pnpm

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json ./

# Copy shared-broker
COPY apps/shared-broker/ ./apps/shared-broker/

# Copy order-service
COPY apps/order-service/ ./apps/order-service/

# Install dependencies for the entire workspace
RUN pnpm install --no-frozen-lockfile

# Build shared-broker first
WORKDIR /workspace/apps/shared-broker
RUN pnpm run build

# Build order-service
WORKDIR /workspace/apps/order-service
RUN pnpm run build

# Production stage
FROM node:22-alpine AS production

# Create app directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy workspace files needed for production
COPY --from=builder /workspace/pnpm-workspace.yaml ./
COPY --from=builder /workspace/package.json ./

# Copy shared-broker built package
COPY --from=builder /workspace/apps/shared-broker/package.json ./apps/shared-broker/
COPY --from=builder /workspace/apps/shared-broker/dist ./apps/shared-broker/dist

# Copy order-service files
COPY --from=builder /workspace/apps/order-service/package.json ./apps/order-service/
COPY --from=builder /workspace/apps/order-service/dist ./apps/order-service/dist
COPY --from=builder /workspace/apps/order-service/drizzle ./apps/order-service/drizzle
COPY --from=builder /workspace/apps/order-service/drizzle.config.ts ./apps/order-service/

# Install only production dependencies
WORKDIR /app/apps/order-service
RUN pnpm install --no-frozen-lockfile --prod

# Change ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/index.js"]