FROM node:22.14.0-alpine@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad07487d24d1aa386336d1944
WORKDIR /usr/app
RUN chown node:node /usr/app
USER node
COPY build ./build
COPY config ./config
COPY node_modules ./node_modules
COPY package.json ./
COPY package-lock.json ./
ENTRYPOINT ["node", "build/index.js"]