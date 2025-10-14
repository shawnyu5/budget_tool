FROM docker.io/lukemathwalker/cargo-chef:latest-rust-1.90-alpine3.22 AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
# RUN apk add --no-cache openssl
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder

RUN apk add --no-cache perl make
COPY --from=planner /app/recipe.json recipe.json
# Build dependencies - this is the caching Docker layer!
RUN cargo chef cook --release --recipe-path recipe.json
# Build application
COPY . .
RUN cargo build --release --bin backend

# We do not need the Rust toolchain to run the binary!
FROM docker.io/alpine:3.22.0 AS runtime
WORKDIR /app
COPY --from=builder /app/target/release/backend /usr/local/bin
COPY ./Cargo.toml .
ENTRYPOINT ["/usr/local/bin/backend"]
