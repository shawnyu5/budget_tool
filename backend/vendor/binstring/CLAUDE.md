# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains `binstring`, a Rust library for storing binary data as a string. It provides a `BinString` type that wraps a `String` and offers conversion methods between binary data and strings.

Key features:
- Safely store binary data in a string format
- Access data as both a string and bytes
- Perform byte-level operations while maintaining string compatibility
- Various conversion methods to/from common Rust types

## Common Commands

### Building

```bash
# Build the library
cargo build

# Build with optimizations
cargo build --release
```

### Testing

```bash
# Run all tests
cargo test

# Run specific tests
cargo test test_name

# Run tests with output
cargo test -- --nocapture
```

### Documentation

```bash
# Generate and open documentation locally
cargo doc --open
```

### Publishing

```bash
# Check that package is valid before publishing
cargo publish --dry-run

# Publish to crates.io (requires proper credentials)
cargo publish
```

## Code Structure

The codebase is very simple:
- `lib.rs`: Contains the `BinString` struct and all its implementations

The `BinString` struct wraps a `String` and provides:
1. Creation methods (`new`, `from_bytes`)
2. Conversion methods (from/to String, &str, Vec<u8>, &[u8])
3. Accessor methods (`as_str`, `as_bytes`, `len`, etc.)
4. String manipulation methods (`concat`, `slice`, `replace`, etc.)
5. Pattern matching methods (`starts_with`, `ends_with`, `contains`, etc.)
6. Various trait implementations (Display, AsRef, From, Deref, etc.)

## Safety Considerations

When working with this library, be aware that:
- Most operations work at the byte level and are safe with any binary data
- Some methods like `trim()` assume valid UTF-8 and should only be used with valid UTF-8 data
- The core functionality uses `String::from_utf8_unchecked()`, which is safe as long as clients don't try to interpret the content as valid UTF-8