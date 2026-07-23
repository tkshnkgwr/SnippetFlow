**English** | [日本語版](../ja/TODO.md)

# Development Status and Task Management (TODO.md)

This document manages the current implementation status (Done), near-term tasks (Todo), and future feature expansion proposals (Backlog) for SnippetFlow (Template Clipboard Manager).

---

## 1. Implemented Features (Done)

### 1.1. Common Foundation and UI Design
- **Hybrid Execution Environment**: Both the Tauri version (React/TS + Rust) and egui version (pure Rust) run with a hybrid design sharing the same core features.
- **Responsive Dark Mode**: Dynamic switching between dark and light themes utilizing Tailwind v4 (Tauri) and egui's native visual styles.
- **Fixed Header/Footer Layout**: User-friendly screen layout where navigation, search controls, and the action bar remain fixed while the list scrolls.
- **Single Instance Prevention (Duplicate Prevention)**:
  - Tauri: Adopts `tauri-plugin-single-instance` to focus the existing window when duplicate execution is attempted.
  - egui: Silently restricts duplicate execution using a `single-instance` mutex.
- **Japanese Character Corruption Prevention**: Dynamically loads and registers standard Windows system fonts (such as Meiryo) at startup to prevent "tofu" characters.

### 1.2. List Screen (List / Home)
- **Snippet Card Display**: Lists template texts in a compact card format.
- **Favorites (Pinning)**: Pins snippets to the top of the list with a "📌" mark and highlights them with an Indigo theme.
- **Toggle past/deleted data**: Toggles the display of logical deleted items from the trash bin in a light-red style with a strikethrough.
- **Multi-criteria Sorting**: Sorts by "Updated (Newest/Oldest First)", "Created (Newest First)", "Title", and "Copy Count (Most Used)". Sorting preference is persisted.
- **Dual Filter Search**: Combines free-text search (partial matches in title, content, or description) with tag filtering.
- **Keyword Highlighting**: Color-highlights texts matching the search query with a yellow background.
- **Tag Cloud**: Automatically extracts unique tags from the database and lists them as toggle buttons for single-click filtering.
- **Quick Copy**: Copies content to the clipboard instantly via the "📋 Copy" button on the card (with a 3-second completion toast notification).

### 1.3. Change Screen (Form)
- **Create/Edit Handling**: Automatically sets creation and modification timestamps. Explicitly displays IDs and metadata during editing.
- **Logical Deletion, Restoration, and Physical Deletion**: Supports multi-stage deletion: logical deletion (move to trash), restoration from archive, and permanent physical deletion from the database.
- **Intelligent Tag Suggestion**: Analyzes words in the "Title (double weight)", "Content", and "Description" fields against existing tags to recommend up to 5 tags in real-time.

### 1.4. Diff Comparison Screen (Compare)
- **2-Column Split Display**: Compares the title, description, and content preview of two selected snippets side-by-side in parallel.
- **Line/Character Diff Display using LCS**: Highlights line-level additions (green background) and deletions (red background) based on the Longest Common Subsequence algorithm.
- **Dynamic Replacement and Side Swapping**: Replaces compared targets on the fly using comboboxes at the top or swaps their positions using the "⇄" button without page transitions.

### 1.5. Merge Screen (Merge)
- **Add and Exclude Snippets**: Selectively adds or excludes snippets for merging using checkboxes on the fly.
- **Order Adjustment (↑ / ↓)**: Changes the merging order of selected items up or down with simple button clicks.
- **6 Separator Types**: Choose from: 1 newline, 2 newlines, divider (`---`), divider (`===`), Japanese comma (、), or no separator.
- **Live Preview and Bulk Copy**: Previews the merged output in real-time and copies it to the clipboard at once.

### 1.6. Performance Meter Screen (Performance)
- **Database Diagnostics**: Displays record counts, estimated JSON file size, and the latest search query execution time in milliseconds.
- **Usage Statistics (Analytics)**:
  - Visualizes the total copy count and cumulative typing time saved (calculated as: 1 character copied = 0.3 seconds saved).
  - Displays the top 3 snippets by copy count.
- **Benchmark Testing**: Measures the average search execution time after running 100 trials (in milliseconds).
- **Dummy Data Load Testing**: Allows batch-generating and cleaning up 1,000, 2,000, and 5,000 dummy records to verify UI rendering and search loads.
- **Backup & Restore via OS-Native Dialogs**: Securely exports and imports local JSON data files using the `rfd` crate.

### 1.7. Development Environment and Agent Rules
- **Optimization of Verification Process (Skipping checks on Markdown updates)**: Introduced rules in `.agents/AGENTS.md` to skip automated tests and static analysis (`cargo test`, `cargo clippy`, `cargo fmt`) when only Markdown files are updated, reducing redundant verification tasks.

---

## 2. Current Tasks (Todo / In Progress)

### 2.1. Unifying Data Storage and Settings between Tauri and egui Versions
- [x] **Full Transition of Tauri Storage to Backend**:
  Upgraded the application to load data from `snippets.json` in the current directory through the Rust backend at Tauri startup, and write data updates directly from Rust. This enables real-time synchronization and sharing of data between the Tauri and egui versions.
- [ ] **Full Unification of App Settings**:
  Unify settings like theme choices and selected sorting orders in `settings.json` (consistent with egui) instead of storing them in Tauri's `localStorage`.

### 2.2. Improving Quality of Logic and Testing
- [ ] **Add Unit Tests for Common Logic**:
  Expand unit tests in `common_lib` for edge cases and boundary values (e.g., empty texts, extremely long content) regarding LCS diff calculation and intelligent tag suggestion scoring.
- [ ] **Strengthen Error Handling**:
  Implement a safeguard in Rust's `storage.rs` that detects corruption (invalid JSON formatting) in `snippets.json`, backs up the existing corrupted file as `.bak`, and loads default data instead of immediately overwriting the file.

---

## 3. Future Feature Expansion Proposals (Backlog)

- [ ] **Secure Synchronization between Multiple PCs**:
  A feature to securely auto-sync snippet data across multiple PCs using GitHub Gists, custom object storage, or local network shared folders.
- [ ] **Encrypted Snippet Storage**:
  An optional feature to encrypt the locally stored `snippets.json` file (e.g., via AES-GCM) to safely store personal information, API keys, and password templates.
- [ ] **Global Hotkeys (Shortcut Invocation)**:
  Transform the application into a resident utility that pops up the window to the foreground instantly via a specific shortcut key (e.g., `Ctrl + Shift + S`) even when minimized or inactive.
- [ ] **Categorization (Folder Hierarchies)**:
  In addition to tag clouds, introduce a folder tree sidebar (e.g., Business, Personal, Development) to organize snippets in category hierarchies.
- [ ] **Automated Pasting (Auto-fill)**:
  A feature that automatically hides the application window upon clicking the "Copy" button, and pastes the text directly into the previously focused active window (by sending a Ctrl+V key event).
