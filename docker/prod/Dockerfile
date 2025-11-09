FROM node:22-alpine

ENV FORCE_COLOR=1

WORKDIR /usr/src/app

COPY package*.json ./

COPY prisma ./prisma

RUN npm cache clean --force

RUN npm install

RUN npm i --save-dev @swc/cli @swc/core

RUN npm install @css-inline/css-inline-linux-x64-musl

RUN npx prisma generate

COPY . .

RUN npm run build

CMD ["node", "dist/main.js"]