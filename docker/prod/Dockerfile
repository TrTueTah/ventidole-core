FROM node:22-alpine

ENV FORCE_COLOR=1

WORKDIR /usr/src/app

COPY package*.json ./

COPY prisma ./prisma

RUN npm install

RUN npm install @css-inline/css-inline-linux-x64-musl

COPY . .

RUN npx prisma generate

RUN npm run build

CMD ["node", "dist/main.js"]