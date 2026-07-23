**English** | [日本語版](../ja/DEVELOPING.md)

# Developer Guide (DEVELOPING.md)

This document defines the development environment setup, build procedures, and testing methods for the "Snippet Clipboard Manager (SnippetFlow)".

---

## 1. System Requirements for Development Environment

To build and run this project, the following environment must be installed in advance:

* **OS**: Windows 10 / 11 (Optimized for low-resource environments)
* **Node.js**: `v18.x` or higher (For Vite 6 / React 19 builds)
* **Rust**: `1.75.0` or higher (For egui / eframe v0.22.0 and Tauri v2 builds)
* **Tauri CLI**: `cargo-tauri` (`v2.x` or higher)

---

## 2. Directory Structure and Shared Crate Dependency Setup

This repository works closely with the adjacent shared library `common_lib`. During local development, the files must be laid out as follows:

```text
Workspace Parent Directory/
├── common_lib/            # Shared Rust library (Core logic such as LCS difference calculation)
└── SnippetFlow/           # This project (Main repository)
```

> [!IMPORTANT]
> `Cargo.toml` references the shared library using the relative path `../common_lib`.
> When checking out from Git, be sure to extract both repositories under the same parent directory.
> In GitHub Actions (CI), the workflow is configured to automatically reproduce this structure in the checkout step.

---

## 3. Development and Execution Procedures in Each Environment

This application has two co-existing systems: **Tauri desktop environment (React + Rust)** and **egui standalone desktop environment (pure Rust)**.

### 3.1. Tauri Environment (React + Rust Webview)

This is a hybrid configuration using Web technologies (React/TypeScript/Vite) for screen rendering and a Rust backend for OS-specific tasks (such as file dialogs).

#### 1. Install Dependencies (Frontend)
```bash
npm install
```

#### 2. Start the Development Hot Reload Server
```bash
npm run dev
# Or run the Tauri development command
npx tauri dev
```

#### 3. Production Build (Packaging)
```bash
npx tauri build
```

---

### 3.2. egui Environment (Pure Rust)

This is an ultra-lightweight, single-binary execution version that eliminates the HTML/CSS engine and minimizes system resource (memory/CPU) consumption.

#### 1. Debug Run
```bash
cargo run
```

#### 2. Release Build
This builds a release binary with optimizations for binary size and execution speed (LTO, panic abort, and stripping).
```bash
cargo build --release
# Output binary: target/release/snippet_manager.exe
```

#### 3. Specifying Cargo Features
In this project, the `windows_desktop` feature is enabled by default. You can specify feature flags to build and verify as needed.
```bash
# Default (windows_desktop enabled)
cargo build

# Check without default features
cargo check --no-default-features
```

---

## 4. Quality Control and Pre-verification Process

Before committing changes or creating a pull request, verify that all the following static analysis and tests pass locally (zero errors and warnings).

### 1. Compliance with Code Formatting Rules
```bash
cargo fmt --check
```
* *If formatting errors occur, run `cargo fmt` to automatically format the code.

### 2. Static Analysis (Clippy)
```bash
cargo clippy --all-targets -- -D warnings
```
* *Warnings are treated as errors. Resolve all warnings before compiling.

### 3. Running Unit Tests
```bash
cargo test
```
* *When adding new features or changing logic, make sure to add/extend tests in `mod tests` in `src/main.rs`.
