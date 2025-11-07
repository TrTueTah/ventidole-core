FROM node:22-slim

ENV FORCE_COLOR=1

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

COPY prisma ./prisma

RUN npm install

RUN npm rebuild

COPY . .

RUN npx prisma generate

RUN npm run build

CMD ["node", "dist/main.js"]