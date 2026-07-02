# SnippetFlow (SnippetManager)

[![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)](Cargo.toml)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#license)
[![Platform](https://img.shields.io/badge/platform-windows-lightgrey.svg)](#prerequisites)
[![Rust Version](https://img.shields.io/badge/rust-1.70%2B-orange.svg)](#prerequisites)

English | [日本語版 (Japanese)](README.ja.md)

**SnippetFlow** is a sleek, transparent, and always-on-top desktop application built with Rust (`egui`/`eframe`) for Windows to quickly manage and copy frequently used text templates (snippets) to the clipboard. 
It also contains the fully-functional React/Vite web prototype version, which shares exact functionality with the native desktop app.

---

## Key Features

- **Dark/Light Theme Toggle**:
  - Dynamically switch between dark and light themes using the header toggle button (`☀ Light` / `🌙 Dark`). Preferences are auto-saved to `settings.json`.
- **Beautiful Glassmorphism UI**:
  - Semi-transparent, window-decorated Slate border layout without standard OS titlebars.
- **Always on Top**:
  - Stays on top of other workspace apps for instant clipboard template retrieval.
- **Low-Resource Operations**:
  - Repaints once per second when idle to maintain near-zero CPU consumption.
- **Incremental Text & Tag Cloud Search**:
  - Perform incremental keyword filtering or filter instantly using the new Tag Cloud UI.
- **One-Click & Merged Clipboard Copy**:
  - Direct copy function, plus the ability to select multiple templates and merge-copy them with custom line break separators.
- **Intelligent Tag Suggestion**:
  - Analyzes snippet forms in real-time, matching words in title, body, and description with existing tags (giving title occurrences double weight).
- **Logical Deletion & Restore Actions**:
  - Soft-deletes snippets into an archive log, from which they can be restored or permanently hard-deleted.
- **Database Backup & Recovery**:
  - Uses native file system dialogs to import and export the entire JSON database.

---

## Technical Specifications

For detailed functional specifications and Mermaid diagrams, please refer to the documents in the `docs` folder:
- [Functional Specifications (SPEC.md)](docs/SPEC.md)
- [Architecture & Sequence Diagrams (DIAGRAM.md)](docs/DIAGRAM.md)
- [Resource Footprints & Performance (FOOTPRINTS.md)](docs/FOOTPRINTS.md)
- [Quality Verification & Test Report (test_report.md)](docs/test_report.md)

---

## Prerequisites

### Rust Desktop App
- **OS**: Windows 10 / 11
- **Rust Compiler**: Rust 1.70 or newer (Stable channel recommended)

### React Web Prototype
- **Runtime**: Node.js v18 or newer (Vite 6 / React 19)

---

## Download

Precompiled binaries and installers can be downloaded directly from the GitHub **[Releases](https://github.com/tkshnkgwr/SnippetFlow/releases)** page.

* **Tauri Desktop Version**: Provided as standard installers (`.msi` or `.exe`) for easy Windows installation.
* **Rust egui Standalone Version**: Provided as `snippet_manager-windows-x64.zip`. After extraction, simply run `snippet_manager.exe` directly without installation.

---

## Build & Run Instructions

### 1. Rust Desktop App
```bash
# Run in development mode
cargo run

# Build the optimized production binary
cargo build --release
```
The compiled release binary can be found under `target/release/snippet_manager.exe`. Settings and snippet files (`settings.json`, `snippets.json`) will be outputted relative to the execution binary path.

### 2. React Web Prototype
```bash
# Install dependencies
npm install

# Run local development server (port 3000)
npm run dev

# Build production bundle
npm run build
```

### 3. Tauri Desktop App
```bash
# Install dependencies
npm install

# Run in development mode (with hot-reload)
npx tauri dev

# Build the release binary without creating installers
npx tauri build --no-bundle
```
The compiled release binary can be found under `src-tauri/target/release/app.exe`. You can directly run this executable to start the application.


---

## License

This project is licensed under the MIT License.
