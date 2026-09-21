FROM node:20-alpine AS build-env
WORKDIR /app
COPY package.json package-lock.json .
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-alpine
WORKDIR /app
COPY package.json .
COPY --from=build-env /app/build build
COPY --from=build-env /app/node_modules node_modules

CMD ["npm", "run", "start"]