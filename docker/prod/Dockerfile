FROM node:22-alpine

ENV FORCE_COLOR=1

WORKDIR /usr/src/app

# Copy file yarn
COPY package.json yarn.lock ./

# Copy Prisma schema
COPY prisma ./prisma

# Cài dependencies với Yarn
RUN yarn install --frozen-lockfile

# Cài devDependencies riêng (nếu cần)
RUN yarn add --dev @swc/cli @swc/core

# Cài optional package
# RUN yarn add @css-inline/css-inline-linux-x64-musl

# Copy toàn bộ source code
COPY . .

# Build app
RUN yarn build

# Expose port (nếu cần)
EXPOSE 3000

# Start app
CMD ["node", "dist/main.js"]
