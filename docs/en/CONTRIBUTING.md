**English** | [日本語版](../ja/CONTRIBUTING.md)

# Contribution Guidelines (CONTRIBUTING.md) - SnippetFlow

Thank you for your interest in contributing to the `SnippetFlow` project! 
This document describes the guidelines for reporting bugs, proposing features, and submitting Pull Requests (PRs).

---

## 1. Development Principles & Best Practices

When developing or making modifications to this project, please adhere to the following principles:

1. **Maintain Coexistence of Both UI Architectures**:
   - This application is designed to run both the Tauri version (React/TypeScript + Rust) and the egui version (pure Rust) in parallel with identical functionality. When adding or modifying core logic (such as data parsing, LCS diffs, or analytics calculations), ensure it is applicable to both UI structures.
2. **Utilize the `common_lib` Shared Library**:
   - Common processes (Win32 API control, text processing, LCS algorithm, etc.) are centralized in the adjacent `common_lib` directory. To prevent duplication of code, make sure to move any reusable logic to `common_lib`.
3. **Prevent Japanese Text Corruption (Tofu Characters)**:
   - When modifying or adding egui UI elements, ensure that Japanese font loading is handled correctly so that Japanese text renders properly without display corruption.
4. **Synchronize Multi-Lingual Documentation**:
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
2. **Launch Tauri Environment**:
   ```bash
   npm install
   npx tauri dev
   ```
3. **Launch egui Standalone Version**:
   ```bash
   cargo run
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

- [ ] `cargo test` (unit tests pass)
- [ ] `cargo clippy --all-targets -- -D warnings` (static analysis has zero warnings)
- [ ] `cargo fmt --check` (Rust code format matches rules)
- [ ] `npm run lint` (TypeScript has zero type errors or warnings)
- [ ] `npm run build` (frontend builds successfully)
- [ ] Documentation is synchronized between `docs/ja/` and `docs/en/`
