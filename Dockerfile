# Production Dockerfile for QuanterraOS Foundation
# Node 22 with native C++ compilation for better-sqlite3
FROM node:22-bookworm-slim

# Install system dependencies needed for compiling better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Create persistent storage directory for SQLite databases
RUN mkdir -p /data

# Default production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/quanterraos.db
ENV GROWTH_DB_PATH=/data/growth.db

EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the foundation server
CMD ["node", "--experimental-strip-types", "src/server.ts"]
