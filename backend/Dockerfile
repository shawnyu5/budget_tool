FROM docker.io/lukemathwalker/cargo-chef:latest-rust-1.90-alpine3.22 AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder

RUN apk add --no-cache perl make
COPY --from=planner /app/recipe.json recipe.json
# Seems like firefly_client needs to be in the image for cargo chef to work properly here
COPY ./firefly_client ./firefly_client
# Build dependencies - this is the caching Docker layer!
RUN cargo chef cook --release --recipe-path recipe.json
# Build application
ENV SQLX_OFFLINE=true
COPY . .
RUN cargo build --release --bin backend

# We do not need the Rust toolchain to run the binary!
FROM docker.io/alpine:3.22.0 AS runtime
WORKDIR /app
COPY --from=builder /app/target/release/backend /usr/local/bin
COPY ./Cargo.toml .
LABEL org.opencontainers.image.source="https://github.com/shawnyu5/budget_tool"
ENTRYPOINT ["/usr/local/bin/backend"]
