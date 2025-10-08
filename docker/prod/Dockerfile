FROM node:22-alpine

ENV FORCE_COLOR=1

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

CMD ["node", "dist/main"]