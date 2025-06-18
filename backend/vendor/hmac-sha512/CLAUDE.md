# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Crate Overview

This is a Rust crate called `hmac-sha512` that provides a small, self-contained implementation of:
- SHA512 and HMAC-SHA512
- SHA384 and HMAC-SHA384 (optional feature)

The crate is designed to be simple, compact, and `no_std` compatible for embedded systems and environments without the standard library.

## Building and Testing

### Build Commands

```bash
# Build with default features
cargo build

# Build with release optimizations
cargo build --release

# Build with specific features
cargo build --features="traits"
cargo build --features="opt_size"
cargo build --no-default-features  # Excludes SHA384 support
```

### Test Commands

```bash
# Run all tests
cargo test

# Run tests with specific features
cargo test --features="traits"
cargo test --features="opt_size"
cargo test --no-default-features
```

### Benchmark (if needed)

```bash
# Run benchmarks (requires nightly Rust)
cargo +nightly bench
```

## Features

The crate supports several features that can be enabled or disabled:

- `sha384` (enabled by default): Includes SHA384 and HMAC-SHA384 implementations.
- `opt_size`: Optimizes for binary size at a slight performance cost (reduces text section size by ~75% with ~16% performance hit).
- `traits`: Enables support for the `Digest` trait from the `digest` crate.
  - `traits09`: Support for `digest` crate v0.9.x
  - `traits010`: Support for `digest` crate v0.10.x

## Code Architecture

### Core Components

1. **State Management**:
   - `Hash` struct: Maintains the hashing state and provides the public API
   - `State` struct: Internal state representation for the SHA512 algorithm
   - `W` struct: Manages the message schedule array for block processing

2. **Block Processing**:
   - SHA512 works by processing blocks of 128 bytes
   - The `blocks` method handles full blocks
   - Partial blocks are buffered until finalization

3. **HMAC Implementation**:
   - The `HMAC` struct provides the MAC functionality
   - Implements the standard HMAC construction: H((K ⊕ opad) || H((K ⊕ ipad) || m))

4. **SHA384 Module** (when `sha384` feature is enabled):
   - Provides SHA384 by using SHA512 with different initialization vectors and truncated output

5. **Digest Trait Implementations** (when `traits` feature is enabled):
   - Implements standard interfaces from the `digest` crate
   - Supports both v0.9 and v0.10 of the `digest` crate depending on features

### Performance Considerations

- Uses constant-time verification for HMAC results to prevent timing attacks
- Includes size optimizations when the `opt_size` feature is enabled
- Designed to minimize memory usage with a fixed buffer size

### Memory Safety

- The crate is `no_std` compatible for use in environments without the standard library
- Uses safe Rust with minimal unsafe code (only for constant-time comparison)
- Provides fixed-size output arrays to ensure correct buffer handling

## Example Usage

### SHA512 Hashing

```rust
use hmac_sha512::Hash;

// Compute SHA512 hash
let hash = Hash::hash(b"message");
```

### HMAC-SHA512

```rust
use hmac_sha512::HMAC;

// Compute HMAC-SHA512
let mac = HMAC::mac(b"message", b"key");

// Verify HMAC-SHA512
let expected = [0u8; 64]; // Replace with actual expected MAC
let is_valid = HMAC::verify(b"message", b"key", &expected);
```

### SHA384 Hashing (when enabled)

```rust
use hmac_sha512::sha384::Hash;

// Compute SHA384 hash
let hash = Hash::hash(b"message");
```

### HMAC-SHA384 (when enabled)

```rust
use hmac_sha512::sha384::HMAC;

// Compute HMAC-SHA384
let mac = HMAC::mac(b"message", b"key");

// Verify HMAC-SHA384
let expected = [0u8; 48]; // Replace with actual expected MAC
let is_valid = HMAC::verify(b"message", b"key", &expected);
```

### With Digest Trait (when enabled)

```rust
use hmac_sha512::Hash;
use digest::Digest;  // Requires the digest crate

let mut hasher = Hash::new();
hasher.update(b"message");
let result = hasher.finalize();
```