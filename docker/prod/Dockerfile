FROM node:22-bullseye

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
COPY prisma ./prisma

RUN corepack enable && corepack prepare yarn@1.22.22 --activate

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

EXPOSE 8080
CMD ["node", "dist/main.js"]
