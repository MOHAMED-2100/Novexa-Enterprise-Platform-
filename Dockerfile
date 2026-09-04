# Multi-stage Dockerfile for Novexa Enterprise Platform
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and configuration
COPY . .

# Build frontend and compile backend server
RUN npm run build

# Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src/database ./src/database

EXPOSE 3000

# Run migrations and start server
CMD ["node", "dist/server.cjs"]
