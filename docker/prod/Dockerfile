FROM node:22-alpine

ENV FORCE_COLOR=1

WORKDIR /usr/src/app

COPY package*.json ./

COPY prisma ./prisma

RUN npm cache clean --force

RUN npm install

RUN npm i --save-dev @swc/cli @swc/core

RUN npm install @css-inline/css-inline-linux-x64-musl

COPY . .

RUN npx prisma generate

RUN npm run build

# Copy Prisma query engine to dist folder
RUN cp -r node_modules/.prisma dist/ || true && \
    cp -r node_modules/@prisma dist/ || true && \
    mkdir -p dist/db/prisma && \
    find node_modules/.prisma/client -name "*.node" -exec cp {} dist/db/prisma/ \; || true

EXPOSE 8080

CMD ["node", "dist/main.js"]