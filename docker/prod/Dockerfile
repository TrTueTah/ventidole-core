FROM node:22-alpine

WORKDIR /usr/src/app

# Yarn 1.x đã có sẵn, không cần corepack
RUN apk add --no-cache yarn

# Copy package files
COPY package.json yarn.lock ./

# Copy Prisma schema
COPY prisma ./prisma

# Install dependencies
RUN yarn install --frozen-lockfile --network-timeout 300000

# Copy source code
COPY . .

# Build application
RUN yarn build

# Expose port
EXPOSE 8080

# Start app
CMD ["node", "dist/main.js"]
