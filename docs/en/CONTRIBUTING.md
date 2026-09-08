**English** | [日本語版](../ja/CONTRIBUTING.md)

# Contribution Guidelines (CONTRIBUTING.md) - SnippetFlow

Thank you for your interest in contributing to the `SnippetFlow` project! 
This document describes the guidelines for reporting bugs, proposing features, and submitting Pull Requests (PRs).

---

## 1. Development Principles & Best Practices

When developing or making modifications to this project, please adhere to the following principles:

1. **Maintain Tauri 2 Desktop Architecture**:
   - This application is designed as a hybrid Tauri 2 application (React 19 / TypeScript + Rust). Maintain clear separation of concerns between rich UI rendering in the frontend and high-speed, secure system operations (data persistence, encryption, LCS diffing, etc.) in the Rust backend.
2. **Utilize the `common_lib` Shared Library**:
   - Common processes (Win32 API control, text processing, LCS algorithm, etc.) are centralized in the adjacent `common_lib` directory. To prevent duplication of code, make sure to move any reusable logic to `common_lib`.
3. **Synchronize Multi-Lingual Documentation**:
   - When introducing specification changes, new features, or modifications to workflows, you must update both the `docs/ja/` and `docs/en/` documentation to keep them fully synchronized.

---

## 2. Development Setup & Verification

For detailed instructions on setting up your environment, please refer to the [Developer's Guide (DEVELOPING.md)](DEVELOPING.md).

1. **Repository Layout**:
   - Clone both the `common_lib` and `SnippetFlow` repositories under the same parent directory during local development.
   ```text
   Parent_Folder/
   ├── common_lib/
   └── SnippetFlow/
   ```
2. **Launch Desktop Version (Tauri)**:
   ```bash
   npm install
   npm run tauri dev
   ```
3. **Launch Web Version (Prototype / UI Verification)**:
   ```bash
   npm run dev
   ```

---

## 3. Commit & Pull Request Procedures

### Commit Message Conventions
Commit messages must follow the Conventional Commits format:

- `feat:` Add new feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring (no functional changes or bug fixes)
- `perf:` Performance optimizations
- `test:` Add or modify tests
- `chore:` Changes to build tools or settings files

### Pre-PR Checklist
Before submitting a Pull Request, ensure that the following checks pass in your local environment:

- [ ] `cargo test --manifest-path src-tauri/Cargo.toml` (Rust unit tests pass)
- [ ] `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings` (static analysis has zero warnings)
- [ ] `cargo fmt --manifest-path src-tauri/Cargo.toml --check` (Rust code format matches rules)
- [ ] `npm run lint` (TypeScript has zero type errors or warnings)
- [ ] `npm run build` (frontend builds successfully)
- [ ] Documentation is synchronized between `docs/ja/` and `docs/en/`
