**English** | [日本語版](../ja/DEVELOPING.md)

# Developer Guide (DEVELOPING.md)

This document defines the development environment setup, build procedures, and testing methods for the "Snippet Clipboard Manager (SnippetFlow)".

---

## 1. System Requirements for Development Environment

To build and run this project, the following environment must be installed in advance:

* **OS**: Windows 10 / 11 (Optimized for low-resource environments)
* **Node.js**: `v18.x` or higher (For Vite 6 / React 19 builds)
* **Rust**: `1.77.2` or higher (For Tauri v2 builds)

---

## 2. Directory Structure and Shared Crate Dependency Setup

This repository works closely with the adjacent shared library `common_lib`. During local development, the files must be laid out as follows:

```text
Workspace Parent Directory/
├── common_lib/            # Shared Rust library (Core logic such as LCS difference calculation)
└── SnippetFlow/           # This project (Main repository)
```

> [!IMPORTANT]
> `src-tauri/Cargo.toml` references the shared library using the relative path `../../common_lib`.
> When checking out from Git, be sure to extract both repositories under the same parent directory.
> In GitHub Actions (CI), the workflow is configured to automatically reproduce this structure in the checkout step.

---

## 3. Development and Execution Procedures

This application is designed as a **Tauri 2 desktop environment (React 19 + Rust)**, combining a rich, comfortable UI powered by modern Web technologies with fast file I/O and secure data processing by the Rust backend.

### 3.1. Desktop Version (Recommended / Production Environment)

```bash
# Install dependencies
npm install

# Launch application in development mode (Frontend + Rust backend)
npm run tauri dev

# Build production installer (.msi / .exe)
npm run tauri build
```

### 3.2. Web Version (UI Verification / Prototype Mode)

```bash
# Start local development server (Port 3000)
npm run dev

# Verify static bundle build
npm run build
```

---

## 4. Quality Control and Pre-verification Process

Before committing changes or creating a pull request, verify that all the following static analysis and tests pass locally (zero errors and warnings).

### 1. Frontend Lint & Build Verification

```bash
npm run lint
npm run build
```

### 2. Rust Code Formatting Rules Compliance

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml --check
```

- *If formatting errors occur, run `cargo fmt --manifest-path src-tauri/Cargo.toml` to automatically format.*

### 3. Rust Static Analysis (Clippy)

```bash
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

- *All warnings are treated as errors. Resolve all issues before compiling.*

### 4. Running Unit Tests

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

- *When adding new features or changing logic, add and extend appropriate unit tests.*
