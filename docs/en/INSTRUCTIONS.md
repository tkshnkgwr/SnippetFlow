**English** | [日本語版](../ja/INSTRUCTIONS.md)

# Development and Coding Instructions (INSTRUCTIONS.md)

This document defines the development conventions, coding styles, and error handling policies to be followed by AI agents and developers when modifying or adding code to the SnippetFlow project (Rust, TypeScript/React).

---

## 1. Naming Conventions

This project adopts standard naming conventions based on the language and environment used.

### 1.1. Rust (src-tauri / common_lib)
- **PascalCase**:
  - Structs, traits, enums, and enum variants (`SnippetManagerApp`, `TauriSnippet`, `SortCriterion`)
- **snake_case**:
  - Functions, methods, variables, struct fields, and module names (`load_snippets()`, `save_snippets()`, `is_dark_mode`, `copy_count`, `lib.rs`)
- **UPPER_SNAKE_CASE**:
  - Constants and global constants (`STORAGE_FILE`, `SETTINGS_FILE`)

### 1.2. TypeScript / React (src)
- **PascalCase**:
  - Component names, interfaces, type definitions, and component filenames (`SnippetList`, `Snippet`, `ActiveTab`, `SnippetForm.tsx`)
- **camelCase**:
  - Variables, functions, object properties, and hook names (`computeDiff`, `useSnippets`, `createdAt`, `isDeleted`, `mockData`)
- **UPPER_SNAKE_CASE**:
  - Constants defined within modules (`DEFAULT_SNIPPETS`)

### 1.3. Data Structure Serialization Mapping Rules
Since JSON data is exchanged between the Web side (camelCase) and the Rust side (snake_case), keep the following mapping rules in mind:
- Handle fields with compatibility in mind using serde aliases so as not to break the mapping between the Web side's camelCase (e.g., `isPinned`, `copyCount`) and the Rust side's snake_case (e.g., `is_pinned`, `copy_count`).

---

## 2. Error Handling Policy

To prevent the application from crashing suddenly or silently hanging in development or user environments, strictly adhere to the following error handling policies.

### 2.1. Rust (src-tauri / common_lib)
- If a file is missing or a parse error occurs, safely fallback to `Default::default()` or initial sample data.
- For Tauri commands that return results to the Webview (such as `export_snippets_json`), return a `Result<T, String>` to explicitly communicate errors to the frontend.
- Standard Rust errors should be converted to string error messages during invocation using `.map_err(|e| e.to_string())?` and propagated to the frontend.

### 2.2. TypeScript / React (src)
- **Exception Protection for I/O and State Operations**:
  - Always wrap `localStorage` read/write operations and JSON parsing in `try-catch` blocks to catch exceptions and prevent the rendering of the entire application from stopping.
- **User Feedback**:
  - When errors like copy failures or import failures occur, do not just output to `console.error`; also invoke the toast notification function (`addToast(message, 'error')`) so the user can visually detect the failure.

---

## 3. Component & Module Division Standards
If a single program source file (`.rs`, `.ts`, `.tsx`, etc.) exceeds 1,000 lines, you must propose or implement refactoring to split it into modules by function.
- **Rust (src-tauri)**: Modularize and optimize within `lib.rs`, `main.rs`, and submodules based on concerns.
- **TypeScript / React (src)**: Modularize and organize across `App.tsx`, `hooks/useSnippets.ts`, and `components/`.

---

## 4. Automatic Documentation & Synchronization Rules
When modifying code, adding features, or fixing bugs, update both `docs/ja/` and `docs/en/` documentation to keep them completely synchronized (`CHANGELOG.md`, `SPEC.md`, `TODO.md`, etc.).
*Note: When modifying only markdown (`*.md`) files, the automatic update and pre-verification processes may be skipped.*

| Target Document             | Role                          | Update Timing                                                                                                              |
| :-------------------------- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| `CHANGELOG.md`              | Change history tracking       | Append after implementation completion. Group by date (`## [YYYY-MM-DD]`) and category (`Added`, `Fixed`, `Optimized`, etc.).|
| `SPEC.md`                   | Functional specs & definition | Changes to CLI arguments, calculation logic, precision, UI components, supported OS, etc.                                 |
| `DIAGRAM.md`                | Architecture visualization    | Update Mermaid diagrams whenever data or UI flows change.                                                                  |
| `README.md` / `README_JA.md`| Overview & build/run steps    | Changes to startup options, build commands, prerequisites, etc.                                                            |
| `FOOTPRINTS.md`             | Performance records           | Changes in release build size, optimization profiles, or new performance benchmark results.                               |
| `ARCHITECTURE.md`           | Design & module structure     | Refreshing internal structure, adding or splitting modules, or updating algorithms.                                        |
| `INSTRUCTIONS.md`           | AI coding rules & standards   | Maintaining AI guidelines, coding styles, and project conventions.                                                         |
| `TODO.md`                   | Task management               | Adding or updating Done (implemented), In Progress/Todo (immediate tasks), and Backlog (enhancement ideas).                |

---

## 5. Quality Management & Pre-verification Rules
- **Module Splitting (1,000-Line Rule)**: Proactively propose splitting/refactoring whenever a single source file exceeds **1,000 lines**.
- **Local Pre-verification 5 Commands** (*Skip when modifying only `.md` files*):
  1. `cargo test --manifest-path src-tauri/Cargo.toml` (All tests pass)
  2. `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings` (Zero clippy warnings)
  3. `cargo fmt --manifest-path src-tauri/Cargo.toml --check` (Formatting matches style rules)
  4. `cargo doc --manifest-path src-tauri/Cargo.toml --no-deps --document-private-items` (Zero rustdoc warnings)
  5. `npm run lint && npm run build` (TypeScript type check & Vite production build pass)
- **Version Management (SSOT)**:
  - Root `package.json` acts as the SSOT, synchronized with `Cargo.toml` (`src-tauri`).

