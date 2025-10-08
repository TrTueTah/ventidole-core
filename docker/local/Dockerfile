FROM node:24-alpine AS install-dependencies

ENV FORCE_COLOR=1

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile
RUN yarn add @css-inline/css-inline-linux-arm64-musl
COPY . .

RUN npx prisma generate

CMD ["yarn", "start:dev"]