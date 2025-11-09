FROM node:22-alpine

ENV FORCE_COLOR=1

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Copy prisma schema
COPY prisma ./prisma

# Clean npm cache and install dependencies
# Using npm ci for more reliable, reproducible builds
RUN npm cache clean --force && \
    npm ci --legacy-peer-deps --ignore-scripts && \
    npm install @css-inline/css-inline-linux-x64-musl --legacy-peer-deps

# Copy application source
COPY . .

# Generate Prisma client and build application
RUN npx prisma generate && \
    npm run build

CMD ["node", "dist/main.js"]