**English** | [日本語版](../ja/INSTRUCTIONS.md)

# Development and Coding Instructions (INSTRUCTIONS.md)

This document defines the development conventions, coding styles, and error handling policies to be followed by AI agents and developers when modifying or adding code to the SnippetFlow project (Rust, TypeScript/React).

---

## 1. Naming Conventions

This project adopts standard naming conventions based on the language and environment used.

### 1.1. Rust (src-egui / src-tauri / common_lib)
- **PascalCase**:
  - Structs, traits, enums, and enum variants (`SnippetManagerApp`, `Snippet`, `SortCriterion`, `AppScreen`)
- **snake_case**:
  - Functions, methods, variables, struct fields, and module names (`load_data()`, `save_data()`, `is_dark_mode`, `copy_count`, `app.rs`, `storage.rs`)
- **UPPER_SNAKE_CASE**:
  - Constants and global constants (`STORAGE_FILE`, `SETTINGS_FILE`)

### 1.2. TypeScript / React (src-react)
- **PascalCase**:
  - Component names, interfaces, type definitions, and component filenames (`SnippetList`, `Snippet`, `ActiveTab`, `SnippetForm.tsx`)
- **camelCase**:
  - Variables, functions, object properties, and hook names (`computeDiff`, `useSnippets`, `createdAt`, `isDeleted`, `mockData`)
- **UPPER_SNAKE_CASE**:
  - Constants defined within modules (`DEFAULT_SNIPPETS`)

### 1.3. Data Structure Serialization Mapping Rules
Since JSON data is exchanged between the Tauri/Web side (camelCase) and the Rust side (snake_case), keep the following mapping rules in mind:
- In the Rust model (`src-egui/model.rs`), fields such as `is_pinned`, `copy_count`, and `saved_time_sec` are annotated with `#[serde(default)]`.
- Due to differences in field naming, when serializing/deserializing on the Rust side, handle fields with compatibility in mind so as not to break the mapping between the Web side's camelCase (e.g., `isPinned`, `copyCount`) and the Rust side's snake_case (e.g., `is_pinned`, `copy_count`).

---

## 2. Error Handling Policy

To prevent the application from crashing suddenly or silently hanging in development or user environments, strictly adhere to the following error handling policies.

### 2.1. Rust (egui / storage / common_lib)
- **Fallback and Silent Handling (Default-Oriented)**:
  - As seen in `storage.rs` and `AppSettings::load()`, if a file does not exist or a parsing error occurs, safely fall back to `Default::default()` or pre-configured initial sample data without crashing.
  - Utilize `if let Ok(val) = ...` or `unwrap_or_else` to safely ignore or handle unavoidable I/O errors.
- **Errors that Need to be Propagated (Tauri Commands, etc.)**:
  - For Tauri commands that return results to the Webview (such as `export_snippets_json`), return a `Result<T, String>` to explicitly communicate errors to the frontend.
  - Standard Rust errors should be converted to string error messages during invocation using `.map_err(|e| e.to_string())?` and propagated to the frontend.

### 2.2. TypeScript / React (src-react)
- **Exception Protection for I/O and State Operations**:
  - Always wrap `localStorage` read/write operations and JSON parsing in `try-catch` blocks to catch exceptions and prevent the rendering of the entire application from stopping.
- **User Feedback**:
  - When errors like copy failures or import failures occur, do not just output to `console.error`; also invoke the toast notification function (`addToast(message, 'error')`) so the user can visually detect the failure.

---

## 3. Component & Module Division Standards

To keep the code highly maintainable and readable, split the code based on its function and role. If a single program source file (`.rs`, `.ts`, `.tsx`, etc.) exceeds 1000 lines, you must implement or propose refactoring to split it into modules by function.

### 3.1. Rust (src-egui)
- **`main.rs`**: Entry point. Only handles multi-instance checks, NativeOptions configuration, and custom font setup.
- **`model.rs`**: Stores only data structures (`Snippet`, `AppSettings`, etc.) and enum definitions.
- **`storage.rs`**: Encapsulates only the input/output (load/save) processing for JSON files.
- **`theme.rs`**: Stores color palette definitions, style configurations for dark/light modes, custom Japanese font loading, highlighting processing, etc.
- **`app.rs`**: Handles application state management, the event loop (`update`), and the overall layout skeleton (header, footer, etc.).
- **`ui.rs`**: Places functions responsible for the specific drawing logic of each screen (List, Form, Compare, Merge, Stats).

### 3.2. TypeScript / React (src-react)
- **`App.tsx`**: Functions as a skeleton managing only the top-level layout, toast container, top navigation, and footer.
- **`hooks/useSnippets.ts`**: A custom hook that centrally manages all application state management (copying, saving, logical deletion, physical deletion, restoration, dummy data generation, etc.).
- **`components/`**: Completely separates files on a screen-by-screen basis.
  - `SnippetList.tsx`: List screen (search, sorting, pinning, multiple selection actions).
  - `SnippetForm.tsx`: Add/edit form (including intelligent tag suggestions).
  - `SnippetCompare.tsx`: Two-column LCS diff display supporting dynamic swapping.
  - `SnippetMerge.tsx`: Merge order adjustment, separator selection, and live preview.
  - `StatsPanel.tsx`: Database diagnostics, usage statistics, load testing, and architecture guide.

---

## 4. AI Output Format Specification

When the AI proposes source code modifications or additions, strictly adhere to the following rules:

- **Minimize Explanations**:
  - Do not provide verbose grammar explanations unless they explain implementation intent or key logic changes behind the code.
  - Aim for a state where the modified code itself speaks.
- **Specify Line Numbers and Diff Context Clearly**:
  - When using code editing tools or showing diffs in text, include sufficient surrounding code (context) to clearly specify the line numbers and target files of the changes without misunderstanding.
  - **Strict Avoidance of Garbled Text (Tofu Characters)**:
  - When modifying UI components in `egui`, pay attention to areas where Japanese text is rendered, ensuring that fonts loaded through `theme::setup_custom_fonts` are properly applied and that garbled text (tofu characters) never occurs.
