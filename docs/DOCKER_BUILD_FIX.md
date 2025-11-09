# Docker Build Fix Summary

## Problem

The Docker build was failing with:
```
Error Failed to load "@swc/cli" and/or "@swc/core" required packages
```

## Root Causes

1. **Using `npm ci` in production Dockerfile** - `npm ci` only installs production dependencies by default
2. **`@swc/cli` and `@swc/core` are devDependencies** - Needed for building but not included in production installs
3. **Commented lines breaking multi-line RUN commands** - Syntax errors in Dockerfile

## Solution

Changed from `npm ci` to `npm install` in the Dockerfile to ensure ALL dependencies (including devDependencies) are installed during the build phase.

### Final Dockerfile

```dockerfile
FROM node:22-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Copy prisma schema
COPY prisma ./prisma

# Install ALL dependencies (including devDependencies needed for build)
RUN npm cache clean --force && \
    npm install --legacy-peer-deps && \
    npm install @css-inline/css-inline-linux-x64-musl --legacy-peer-deps

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 8080

# Start application
CMD ["node", "dist/main.js"]
```

## Why This Works

1. **`npm install`** installs both `dependencies` AND `devDependencies`
2. **`@swc/cli` and `@swc/core`** are available during build
3. **`--legacy-peer-deps`** resolves peer dependency conflicts
4. **Prisma generates automatically** via postinstall hook in package.json

## Key Differences: npm ci vs npm install

| Feature | npm ci | npm install |
|---------|--------|-------------|
| **Speed** | Faster | Slower |
| **Dependencies** | Production only (unless NODE_ENV=development) | All deps |
| **DevDeps** | Skipped in production | Always installed |
| **Best for** | Production runtime | Build/development |

## Production Optimization (Optional Future Enhancement)

For smaller production images, use multi-stage builds:

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
RUN npx prisma generate
EXPOSE 8080
CMD ["node", "dist/main.js"]
```

This would:
- Build with all deps in stage 1
- Only include production deps in final image
- Reduce final image size by ~40-60%

## Files Modified

- `docker/prod/Dockerfile` - Changed npm ci to npm install
- `.npmrc` - Added legacy-peer-deps configuration

## Testing

```bash
# Build and start
docker-compose -f docker/prod/docker-compose.yaml build --no-cache
docker-compose --env-file .env -f docker/prod/docker-compose.yaml up -d

# Check logs
docker logs ventidole-server

# Test endpoint
curl -I http://localhost:8080
```
