FROM node:24-alpine AS build
WORKDIR /app
# e2e's @playwright/test devDependency auto-downloads ~400MB of browser
# binaries on install; the production image never runs e2e tests, so skip it.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
COPY e2e/package.json e2e/package.json
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app/server
ENV NODE_ENV=production
COPY --from=build /app/server/package.json ./package.json
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/client/dist ../client/dist
RUN npm install --omit=dev

ENV PORT=4000
ENV SQLITE_PATH=/app/data/mealflow.db
VOLUME ["/app/data"]
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
