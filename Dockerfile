FROM docker.io/lukemathwalker/cargo-chef:latest-rust-1.90-alpine3.22 AS chef
WORKDIR /app

FROM chef AS planner
COPY ./backend .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS backend_builder

RUN apk add --no-cache perl make
COPY --from=planner /app/recipe.json recipe.json
# Build dependencies - this is the caching Docker layer!
RUN cargo chef cook --release --recipe-path recipe.json
# Build application
COPY ./backend .
RUN cargo build --release --bin backend

# # We do not need the Rust toolchain to run the binary!
# FROM docker.io/alpine:3.22.0 AS runtime
# WORKDIR /app
# COPY --from=builder /app/target/release/backend /usr/local/bin
# COPY ./Cargo.toml .

FROM docker.io/node:24-alpine3.22 AS frontend_builder
WORKDIR /app

COPY ./frontend/ .
RUN npm ci --omit=dev
RUN npm run build

FROM docker.io/nginx:stable-alpine3.23 AS runner
WORKDIR /app

RUN apk add nodejs
RUN mkdir -p /tmp/nginx/client-body && \
   chown nginx:nginx /tmp/nginx/client-body

COPY --from=frontend_builder /app/.output frontend/.output
COPY --from=backend_builder /app/target/release/backend backend/bin
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./start.sh start.sh
COPY ./backend/Cargo.toml Cargo.toml



CMD ["./start.sh"]
