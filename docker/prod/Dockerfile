FROM node:22-bullseye

WORKDIR /usr/src/app

# Copy dependency files
COPY package.json yarn.lock ./
COPY prisma ./prisma

# Cài Yarn thủ công để tránh lỗi Corepack network
RUN npm install -g yarn@1.22.22

# Cài dependencies
RUN yarn install --frozen-lockfile --network-timeout 300000

# Copy toàn bộ source
COPY . .

# Build app
RUN yarn build

EXPOSE 8080
CMD ["node", "dist/main.js"]
