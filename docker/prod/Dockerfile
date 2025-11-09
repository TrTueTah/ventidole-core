FROM node:22-alpine

WORKDIR /usr/src/app

# Enable corepack and use Yarn 1.x (classic) for compatibility
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# Copy package files
COPY package.json yarn.lock ./

# Copy Prisma schema
COPY prisma ./prisma

# Install all dependencies (includes devDependencies needed for build)
# Using --frozen-lockfile to ensure reproducible builds
# Using --network-timeout to handle slow connections
RUN yarn install --frozen-lockfile --network-timeout 300000

# Copy source code
COPY . .

# Build application
RUN yarn build

# Expose port
EXPOSE 8080

# Start application
CMD ["node", "dist/main.js"]
