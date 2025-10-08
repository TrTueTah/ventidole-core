FROM node:22-alpine

ENV FORCE_COLOR=1

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn install

COPY . .

RUN npx prisma generate

RUN yarn run build

CMD ["node", "dist/main"]