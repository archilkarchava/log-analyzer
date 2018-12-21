# Stage 0. Transpile typecript into javascript
FROM node:lts-alpine as builder
WORKDIR /usr/app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

# Stage 1. Run js code.
FROM node:lts-alpine
ENV NODE_ENV production
WORKDIR /usr/app
COPY package.json .
RUN npm install --production
COPY --from=builder /usr/app/dist ./dist
COPY data ./data
COPY ormconfig.json .
# COPY .env .

EXPOSE 4000
CMD node dist/index.js