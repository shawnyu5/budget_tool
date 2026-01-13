FROM docker.io/node:24-alpine3.22 AS builder
WORKDIR /app

COPY . .
RUN npm ci --omit=dev
RUN npm run build

FROM builder AS runner
WORKDIR /app

COPY --from=builder /app/.output .output
CMD ["npm", "run", "start"]
