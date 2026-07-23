**English** | [日本語版](../ja/SPEC.md)

# Template Clipboard Manager Technical and Functional Specifications (SPEC.md)

This document defines the specifications, screen designs, technology stack, and optimization specifications for "Template Clipboard Manager" (Rust / egui & React).

---

## 1. Application Overview
* **Purpose**: An ultra-lightweight desktop utility that safely stores template texts (greetings, schedules, apology letters, etc.) frequently used in business emails and routine tasks locally, allowing users to call and copy them to the clipboard instantly.
* **Target Environment**: Windows 10 / 11 (low-resource environments / memory & CPU constraints)
* **Key Characteristics**:
  * Always on Top
  * Title bar hidden (Decorated: false)
  * Transparent window background (Transparent: true)
  * Designed with system tray and taskbar behaviors in mind

---

## 2. Technology Stack

### React (For Web Development / Prototype Verification)
* **Core**: React 19 (TypeScript), Vite 6
* **Styling**: Vanilla CSS, TailwindCSS v4 (Dark Mode support)
* **Icons**: lucide-react

### Rust (For Desktop Production Version)
* **GUI Engine**: `egui` / `eframe` (v0.22.0)
* **Clipboard I/O**: `arboard` (v3.2)
* **Serialization**: `serde` (v1.0), `serde_json` (v1.0)
* **DateTime**: `chrono` (v0.4)
* **Native Dialogs**: `rfd` (v0.12) - For calling OS-native file dialogs
* **Cargo Features**: `windows_desktop` (For integrating Windows-specific features like Win32 API and Single Instance; linked with the feature flags in `common_lib`)

---

## 3. Data Schema

### 3.1. Snippet Data (`snippets.json`)
The data structure for template texts is common to both React and Rust, consisting of the following:
* `id` (usize): Unique number
* `title` (String): Snippet title
* `content` (String): Snippet content
* `description` (String): Supplementary description for the snippet
* `created_at` (String): Creation timestamp (`YYYY-MM-DD HH:MM:SS`)
* `updated_at` (String): Last update timestamp (`YYYY-MM-DD HH:MM:SS`)
* `deleted_at` (Option<String>): Logical deletion timestamp (`YYYY-MM-DD HH:MM:SS`)
* `is_deleted` (bool): Logical deletion flag
* `tags` (Vec<String>): List of tags associated with the snippet
* `is_pinned` / `isPinned` (bool): Pin flag (favorites)
* `copy_count` / `copyCount` (usize): Cumulative times copied
* `saved_time_sec` / `savedTimeSec` (usize): Cumulative saved time (seconds)

*Note: In both the Tauri and egui versions, data is stored in `snippets.json` within the current directory and is shared/synchronized in real-time. In the browser environment (prototype), it is stored only in `localStorage` (`snippets_db`).*

### 3.2. Application Settings Data (`settings.json` - Rust Version Only)
Holds the application behavior and display settings.
* `is_dark_mode` (bool): Theme setting (true = Dark Mode / false = Light Mode)

---

## 4. Functional Specifications of Each Screen

### 4.1. List Screen (Snippet List / Home)
* **Snippet List**: Registered snippets are displayed in a list-card format.
* **Favorites (Pinning) Feature**:
  * Pinning can be toggled using the "📌" button on each snippet card.
  * Pinned snippets are always fixed to the top of the list, regardless of the selected sorting criteria, and the border and background color of the card are highlighted in an Indigo style.
* **Toggle Display of Past (Deleted) Data**:
  * When the "Show past/deleted items" toggle is ON, logically deleted snippets (`is_deleted == true`) are also loaded into the list and displayed with a light-red strikethrough styling.
* **Sorting Feature**:
  * The list can be sorted by "Updated (Newest First)", "Updated (Oldest First)", "Created (Newest First)", "Title", and "Most Used (Copy Count)".
  * The selected sorting order is automatically persisted to `settings.json` in the Rust version, and to `localStorage` in the React version.
* **Dual Filter Search and Keyword Highlighting**:
  * **Text Search**: Incremental search for partial matches in title, content, or description.
  * **Tag Search**: Partial match search for specified tag strings.
  * **Keyword Highlighting**: When text is entered in the search bar, matching portions are highlighted with a color (yellow background).
* **Tag Cloud UI Filtering**:
  * Unique tags are automatically extracted from snippets and listed as buttons.
  * Clicking a tag allows immediate toggle-based filtering of the snippet list.
* **Quick Copy**: Clicking the "📋 Copy" button in each row instantly copies the text to the clipboard and displays a completion notification at the top for 3 seconds.
* **Multiple Selection**:
  * **Merge and Copy**: Clicking "🔗 Merge and Copy" when multiple snippets are selected merges their contents with a newline separator and copies them at once.
  * **Diff Comparison**: Enabled only when exactly two snippets are selected. Transitions to the Diff Comparison screen.

### 4.2. Change Screen (Create / Edit Form)
* **Create**: Enter title, content, description, and tags to save. The current time is automatically set as the creation and update timestamps.
* **Edit**: Load existing content and edit. The current time is automatically set as the update timestamp. When in edit mode, metadata such as ID, creation date, and update date are explicitly shown.
* **Delete / Restore / Permanently Delete Actions**:
  * When the snippet is not deleted (`is_deleted == false`): Displays the "🗑️ Delete Snippet" button (logical deletion).
  * When the snippet is already logically deleted: Displays the "🔄 Restore from Archive" button and the "🗑️ Delete Permanently" (physical deletion) button.
* **Intelligent Tag Suggestion**:
  * Performs a real-time analysis of words contained in the "Title (double weight)", "Content", and "Description" fields against existing tags.
  * Suggests up to 5 recommended tags automatically, which can be added to the snippet with a single click.

### 4.3. Diff Comparison Screen (Compare)
* Displays two selected snippets side-by-side in split columns.
* Allows parallel viewing and comparison of "Title", "Description", and "Content Preview".
* **Dynamic Replacement**: Pinned dropdowns (comboboxes) at the top allow users to dynamically change which snippets are compared on the fly.
* **Swap Sides**: Clicking "⇄ Swap Sides" instantly swaps the positions of Source (A) and Target (B).
* **Diff Analysis Viewer (LCS)**:
  * Highlights line-by-line additions (marked in green) and deletions/changes (marked in red) using a color-coded interface based on the LCS (Longest Common Subsequence) algorithm.

### 4.4. Merge Screen (Merge)
* Dedicated screen for merging multiple selected snippets.
* **Add and Exclude**: Snippets to be merged can be dynamically added or excluded using checkboxes.
* **Order Adjustment**: The order in which selected snippets are merged can be adjusted up or down using the "↑" and "↓" buttons.
* **Separator Selection**: Choose from 6 types: 1 newline, 2 newlines, divider (`---`), divider (`===`), Japanese comma (、), or no separator.
* **Live Preview and Bulk Copy**: Displays a preview of the merged result and allows copying the merged text to the clipboard with a single click.

### 4.5. Performance Meter Screen (Performance)
* **Database Diagnostics**: Displays active and deleted record counts, estimated JSON file size, and the execution time of the latest search query (in milliseconds).
* **Usage Statistics (Analytics)**:
  * Visualizes the total copy count and the cumulative work hours saved (calculated as: number of characters copied × 0.3 seconds).
  * Displays a ranking of the top 3 snippets by copy count, showing how many times each was copied and the seconds saved.
* **Average Speed Benchmark**: Measures and displays the average execution time after running search operations 100 times.
* **Bulk Data Load Test**: Features functionality to batch-generate and batch-cleanup mock data (dummy snippets) in quantities of 1,000, 2,000, and 5,000 items. Used to test memory and rendering overhead.
* **Backup and Restore**: In both the egui standalone and Tauri desktop versions, the OS-native file dialog (`rfd` crate) is used to securely import (restore) and export (backup) JSON data. To bypass browser download restrictions in the Tauri version, a dedicated backend command is defined in Rust and called from the frontend.

---

## 5. Performance and Resource Optimization Specifications
Since this utility is designed to run continuously, it has been optimized to minimize system resource (CPU/memory) consumption.

* **UI Layout and Theme Specifications**:
  - **Fixed Header and Footer**: Applies a layout where the header (title/navigation) and footer (multiple selection action bar) remain pinned to their screen positions during vertical list scrolling, and only the central snippet list region scrolls (common to both egui and React versions).
  - **Custom Theme Frames (egui)**: To prevent `ui.group` from carrying over dark mode colors when switching to light mode, a custom `theme_card_frame` that updates explicitly is applied to all bordered elements (snippet cards, search boxes, metadata editors, comparison/merge borders, etc.). In light mode, it uses a pure white background with a light gray border; in dark mode, it uses a Slate 800 background with a Slate 700 border.
  - **Window Resizing and Word Wrapping**: Enables resizing and standard OS title bar borders (decorations) in the egui version, allowing users to freely adjust the window size. Implements automatic text wrapping (`wrap(true)`) for labels to prevent titles and descriptions from being clipped when the width is adjusted.
* **Low-Resource Rendering (Update Constraints)**:
  - To prevent high CPU loads from `egui`'s immediate mode rendering, updates are constrained to request a redraw at most once per second (`1000ms`).
  - Additional frames are rendered only when interaction events such as mouse hovering or text input occur. The idle CPU utilization remains virtually at **0.0% to 0.1%**.
* **Close Handling**:
  - In addition to closing via standard OS title bar actions, clicking the "× Close" button in the header terminates the process or closes the window safely, using `std::process::exit(0)` in the egui version, and the Tauri v2 WebviewWindow API (`getCurrentWebviewWindow().close()`) in the Tauri version.
* **Automatic Japanese Font Registration**:
  - At startup, the application searches for standard Japanese system fonts (such as Meiryo) on Windows and registers them with high priority, completely preventing Japanese character corruption (tofu characters).

---

## 6. CI/CD and Automated Release Specifications

To guarantee development efficiency and release accuracy, we have established automated build and deployment environments using GitHub Actions.

* **Continuous Integration (CI - `ci.yml`)**:
  - Triggered by pushes and pull requests to the `main` branch.
  - Runs build checks for the frontend (Node.js).
  - Enforces formatting checks, static analysis, and testing using `cargo fmt --check`, `cargo clippy`, and `cargo test` for both egui standalone and Tauri versions of Rust.
* **Automated Release Asset Packaging (CD - `release.yml`)**:
  - Triggered when a tag matching the `v*` format is pushed.
  - Executes the build process on a Windows runner (`windows-latest`).
  - **Tauri Application**: Automatically creates a draft release on GitHub via `tauri-apps/tauri-action` and uploads installers (MSI, NSIS, etc.) and binaries.
  - **egui Standalone Application**: Bundles `snippet_manager.exe` built via `cargo build --release` into a zip archive targeted at Windows-x64, uploading it to the draft release.
