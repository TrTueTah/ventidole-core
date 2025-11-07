FROM node:22-slim

ENV FORCE_COLOR=1

WORKDIR /usr/src/app

COPY package*.json ./

COPY prisma ./prisma

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

CMD ["node", "dist/main"]