**English** | [日本語版](../ja/TESTING.md)

# Testing Strategy & Execution Guide (TESTING.md) - SnippetFlow

This document summarizes the policies and execution procedures for unit testing, static analysis, type checking, and quality verification in the `SnippetFlow` project.

---

## 1. Testing Overview

`SnippetFlow` is a cross-platform snippet manager built using Rust (egui / Tauri) and React/TypeScript. 
To maintain the stability and high quality of the application, we perform comprehensive validation across the following areas:

- **Core Logic Validation (`common_lib`)**:
  - Correctness of diff calculations using the Longest Common Subsequence (LCS) algorithm.
  - Validity of the keyword frequency analysis and the automatic tag recommendation algorithm.
- **Data Persistence and Model Validation**:
  - Compatibility of serialization and deserialization between `DbSnippet` (snake_case) and `TauriSnippet` (camelCase).
  - Logic for logical deletion (archiving), restoration, and physical deletion of snippets.
  - Setting persistence and theme (light/dark) state saving in `settings.json`.
- **Frontend Type Safety & Build Integrity**:
  - Build validation using Vite 6 / React 19 in React/TypeScript.
  - Exclusion of auto-generated build files from TypeScript compilation targets via `tsconfig.json` configurations to eliminate compile-time type errors.

---

## 2. Quality & Verification Commands

Before committing changes or submitting a Pull Request, ensure that the following local verification commands pass without any warnings or errors.

### 2.1. Backend / Rust (egui & Tauri) Verification

#### 1. Run Unit Tests
```bash
cargo test
```

#### 2. Static Analysis (Clippy)
All warnings are treated as errors. Resolve all issues before compiling.
```bash
cargo clippy --all-targets -- -D warnings
```

#### 3. Code Format Verification
```bash
cargo fmt --check
```

#### 4. Rustdoc Build Verification
```bash
cargo doc --no-deps --document-private-items
```

### 2.2. Frontend / React (Vite) Verification

#### 1. Type Check (tsc)
```bash
npm run lint
# Or execute directly: npx tsc --noEmit
```

#### 2. Production Build
```bash
npm run build
```

---

## 3. Test Writing Guidelines

1. **Add Unit Tests**:
   - If you modify core logic (`common_lib`) or state management models, you must add or expand unit tests in `src-egui/model.rs` or the tests module within `common_lib/src/`.
2. **Crash-Free Design Testing**:
   - Maintain tests that verify the app safely falls back to default data instead of panicking if `snippets.json` or `settings.json` is corrupted or missing.
3. **Isolate OS-Dependent Features**:
   - Isolate Windows-specific code (e.g., Named Mutex for single instance checks, Win32 API calls) using `#[cfg(windows)]` and test to ensure it doesn't break build compatibility on other platforms.
