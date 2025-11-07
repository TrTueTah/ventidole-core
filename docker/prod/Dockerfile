FROM node:22-slim

ENV NODE_ENV=production
ENV FORCE_COLOR=1

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci

COPY . .

# Generate Prisma and build
RUN npx prisma generate
RUN npm run build

# Clean dev dependencies (optional, saves space)
RUN npm prune --production

EXPOSE ${PORT}

CMD ["node", "dist/main.js"]