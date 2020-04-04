FROM node:12
WORKDIR /opt/ahonbotto/
COPY package.json ./
RUN yarn install && yarn install:yt && rm -rf yarn.lock
COPY . .
RUN yarn build
CMD [ "yarn", "start:forever" ]