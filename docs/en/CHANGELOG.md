**English** | [日本語版](../ja/CHANGELOG.md)

# CHANGELOG

All notable changes to this project will be documented in this file.

---

## [Unreleased]

## [1.12.0] - 2026-07-23

### Added
- **Encrypted Snippet Storage (`common_lib/src/crypto.rs`, `src-tauri`, `src-egui`)**:
  - Introduced new encryption/decryption module `common_lib::crypto` with `ENC1:` magic header, providing secure snippet encryption while maintaining full backward compatibility with plain JSON data.
- **Bulk Delete Operations (`src-react`)**:
  - Added multi-selection and floating action toolbar support in the snippet list for bulk soft deletion (moving to trash), bulk restoration, and bulk permanent deletion.
- **Extensive Unit Tests for Common Logic (`common_lib/src/text.rs`)**:
  - Added boundary and edge case unit tests for `compute_diff` (LCS diff), `suggest_tags`, `count_occurrences`, and `format_bytes`.

### Fixed
- **Fix Version Mismatch in GitHub Release Titles (`.github/workflows/release.yml`)**:
  - Fixed an issue where the `SnippetFlow v__VERSION__` placeholder failed to resolve the indirect version reference (`"version": "../package.json"`) in `tauri.conf.json`, causing release titles to show outdated version numbers.
  - Changed `releaseName` to dynamically resolve from the Git tag name (`SnippetFlow ${{ github.ref_name }}`, e.g., `SnippetFlow v1.12.0`), guaranteeing a 100% exact match between tag names and release titles.
- **Enhanced Storage Error Handling & Atomic Writes (`src-tauri/src/lib.rs`, `src-egui/storage.rs`)**:
  - Introduced automatic `.bak` copy creation on corrupted `snippets.json` files before restoring default states safely.
  - Implemented atomic file writes using temporary `.tmp` files to prevent file corruption during unexpected app shutdowns or crashes.
- **Snippet Data Persistence After Version Upgrade (`src-tauri/src/lib.rs`)**:
  - Changed the snippet storage path from a relative path (`snippets.json`) to an OS-standard application data directory resolved via `app.path().app_data_dir()`.
  - The data is now saved to `%APPDATA%\com.snippetflow.app\snippets.json`, which remains stable across version upgrades and reinstalls.
  - Added a `get_storage_path()` helper function that also automatically creates the data directory if it does not exist.
  - Updated `load_snippets` and `save_snippets` Tauri commands to accept `tauri::AppHandle` as a parameter to resolve the correct path at runtime.

## [2026-07-21]

### Added
- **Separation of Platform-Dependent Features via Cargo Features (`Cargo.toml`, `src-tauri/Cargo.toml`)**:
  - Added the `[features]` section to the root `Cargo.toml` and `src-tauri/Cargo.toml`.
  - Defined the `windows_desktop` feature, linking it with the `windows_desktop` feature of the shared library `common_lib` to enable platform-specific feature toggling and customized builds.

### Optimized
- **Refactoring of `src-egui/ui.rs` into Submodules (`src-egui/ui/`)**:
  - Split `src-egui/ui.rs`, which exceeded 1000 lines (1122 lines) in a single file, into 5 submodules by function (`list.rs`, `form.rs`, `compare.rs`, `merge.rs`, and `stats.rs`).
  - Formulated and clearly documented a refactoring recommendation rule in the agent instructions (`.agents/AGENTS.md`) when a program source file exceeds 1000 lines.

### Added
- **Full Migration of Data Saving to the Tauri Backend (`src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`, `src-react/hooks/useSnippets.ts`)**:
  - Upgraded the design so that during Tauri startup, data is loaded from `snippets.json` in the current working directory via the Rust backend, and file writing is performed on the Rust side when saving.
  - Defined `DbSnippet` and `TauriSnippet` on the Rust side and implemented mutual conversion to bridge the difference between the backend data storage format (`snake_case`) and the frontend object specifications (`camelCase`).
  - Added `isLoaded` state control in `useSnippets.ts` to prevent race conditions where empty or default data overwrites `snippets.json` before the asynchronous data load completes.
- **Organization and Refactoring of Development Documentation and Agent Instructions (`docs/ARCHITECTURE.md`, `docs/INSTRUCTIONS.md`, `docs/TODO.md`, `.agents/AGENTS.md`)**:
  - Reviewed the system architecture design document (`docs/ARCHITECTURE.md`) and enhanced data flow explanations with Mermaid diagrams.
  - Newly created development instructions (`docs/INSTRUCTIONS.md`) clarifying the project's naming conventions, error handling policies, component division standards, and AI output formats.
  - Newly created a task management document (`docs/TODO.md`) that centrally manages implemented features, immediate tasks, and the backlog of enhancement proposals.
  - Added update policies for the new documents (`INSTRUCTIONS.md`, `TODO.md`) to the agent instructions (`.agents/AGENTS.md`), updating the automatic documentation rules.
- **Complete Separation of Source Code Folders (`src-egui/`, `src-react/`)**:
  - Disassembled the mixed `src/` directory and separately placed the egui version (Rust) in `src-egui/` and the React version (TypeScript/CSS) in `src-react/`.
  - Updated entry points and build definitions (`Cargo.toml`, `index.html`, `vite.config.ts`) to align with the new structure.
- **Japanese Translation of Comments in Various Program Source Codes**:
  - Translated all English comments to Japanese in major code files, such as `src-egui/main.rs` and TypeScript files under `src-react/`.
- **Exception Rule for Skipping Document Auto-Updates for Markdown-Only Changes (`.agents/AGENTS.md`)**:
  - Described an exception rule to skip the Great Sage's automatic documentation and updating processes for `CHANGELOG.md` and other design documents when only Markdown files are modified without any changes to the program code.

### Optimized
- **Migration of Single-Instance Prevention to common_lib (`Cargo.toml`, `src-egui/main.rs`)**:
  - Eliminated direct dependency on the `single-instance` external crate.
  - Migrated to the Named Mutex single-instance prevention function (`check_single_instance`) using the Win32 API implemented in `common_lib`, streamlining dependencies.
- **Optimization of GitHub Actions CI Settings (`.github/workflows/ci.yml`)**:
  - Set `paths-ignore` so that GitHub Actions CI builds (frontend, rust-egui, and rust-tauri jobs) do not trigger when only Markdown files are modified.

### Fixed
- **Limiting TypeScript Verification Scope (`tsconfig.json`)**:
  - To fix the issue where `npm run lint` (`tsc --noEmit`) inspected auto-generated build assets under `src-tauri/target/` and triggered type errors, the inspection scope was limited to under `src-react`, excluding unnecessary directories.
- **Fixing Version Inconsistencies Across the Project (`package.json`, `src-tauri/Cargo.toml`, `README.md`, `README.ja.md`)**:
  - Aligned the versions in `package.json` and `src-tauri/Cargo.toml`, as well as the version badges in the `README`s, to `1.9.0` to match the root `Cargo.toml`'s version.

## [1.8.0] - 2026-07-09

### Added
- **Batch Preparation of Development Documentation and Agent Instructions Update (`docs/DEVELOPING.md`, `docs/RELEASE.md`, `docs/USER_GUIDE.md`, `docs/ARCHITECTURE.md`, `.agents/AGENTS.md`)**:
  - Added new Developer Guide (`DEVELOPING.md`), Release Procedures (`RELEASE.md`), Operation Manual (`USER_GUIDE.md`), and Architecture Design Document (`ARCHITECTURE.md`).
  - Added the above four documents and their update policies to the Great Sage's automatic documentation update rules (`AGENTS.md`).
- **Implementation of Favorites (Pinning) Feature (`src/types.ts`, `src/App.tsx`, `src/components/SnippetList.tsx`, `src/main.rs`)**:
  - Added a pin button (📌) to preset text cards and implemented pinning to fix the pinned preset texts at the very top of the list.
  - Introduced UI designs highlighting the border and background of the entire card in Indigo style to both the React version and the Rust/egui version.
- **Implementation of Usage Statistics (Analytics) Feature (`src/types.ts`, `src/App.tsx`, `src/components/SnippetList.tsx`, `src/components/SnippetMerge.tsx`, `src/components/SnippetCompare.tsx`, `src/components/StatsPanel.tsx`, `src/main.rs`)**:
  - Added copy count (`copyCount`) and cumulative saved time (`savedTimeSec`) to snippet information.
  - Calculated statistical information assuming that copying one character saves "0.3 seconds."
  - Added sorting criteria by "Most Frequently Used (Copy Count)."
  - Added a "Usage Statistics (Analytics)" card to the performance meter screen, displaying the total copy count, cumulative saved time, and ranking of the top 3 frequently used preset texts.
- **Implementation of Multi-Instance Prevention (Single Instance) (`Cargo.toml`, `src/main.rs`, `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`)**:
  - Introduced features preventing multiple instances of the application from running simultaneously to both the egui and Tauri versions.
  - The egui version uses the `single-instance` crate to quietly terminate the process if a duplicate instance starts.
  - The Tauri version uses the `tauri-plugin-single-instance` plugin to bring the existing window to the front and focus on it when a second instance starts.
- **Addition of Snippet Use Cases to README (`README.md`, `README.ja.md`)**:
  - Added concrete examples of scheduling preset text (PlainText), meeting minutes (Markdown), AI refactoring prompts, Git commit templates, and SQL query templates to help visualize application usage.
- **Addition of GitHub Release Badge (`README.md`, `README.ja.md`)**:
  - Added the latest GitHub release status badge at the top of the README.

### Fixed
- **Correction of GitHub Actions Release Workflow Error (`.github/workflows/release.yml`)**:
  - Fixed the version specification of `tauri-apps/tauri-action`, which was mistakenly written as the non-existent `@v2`, to the officially supported `@v0`.
- **Correction of Tauri Build Configuration File Schema Error (`src-tauri/tauri.conf.json`)**:
  - Removed the `bundle > android > debugApplicationIdSuffix` configuration, which has been deprecated in Tauri v2, as it was causing schema validation errors during `cargo tauri build`.
- **Prevention of Tauri Executable Binary Name (Package Name) Conflicts and Documentation Updates (`src-tauri/Cargo.toml`, `README.md`, `README.ja.md`, `docs/FOOTPRINTS.md`)**:
  - Changed the package name to `Snippetflow` to prevent application startup conflicts with the default name (`app.exe`) on Windows, which was causing the installer execution to force-terminate.
  - Accordingly, updated all references to `app.exe` in various documents (README, FOOTPRINTS) to `Snippetflow.exe`.
- **Update to the Guidelines for the Great Sage (`.agents/AGENTS.md`)**:
  - Added a quality control rule prohibiting the default value `"app"` as the Tauri package name to prevent conflicts with other projects or installer malfunctions.
- **Correction of Shared Library Dependency Resolution Errors in GitHub Actions Workflows (`ci.yml`, `release.yml`)**:
  - Adjusted the repository checkout path to deploy `SnippetFlow` directly under the root.
  - To bypass the security constraints of `actions/checkout` (restriction on checking out outside the workspace), modified it to checkout `common_lib` inside the workspace first, and then move it to the parent directory `../common_lib` using PowerShell commands.
  - This resolved clippy job build errors caused by mismatching relative paths defined in `Cargo.toml`.
- **Correction of GitHub Actions Workflow Definitions (`ci.yml`, `release.yml`)**:
  - Set a fallback (`secrets.PAT || github.token`) for the PAT token when checking out the shared library `common_lib`, preventing the workflow from stopping with errors when the secret is not set.
- **Correction of Release Asset Uploading Operations and Paths (`release.yml`)**:
  - Changed the release asset addition step for the standalone egui version from the conventional `gh` CLI to the `softprops/action-gh-release@v2` action, specifying a stable version.
  - Corrected the asset file path to the actual output location, `SnippetFlow/target/release/...`.

---

## [1.7.0] - 2026-07-03

### Added
- **Dependency on the Shared Crate `common_lib`**:
  - Registered the adjacent shared library `common_lib` as a dependency in `Cargo.toml`.

### Optimized
- **Unification of String Processing and Difference Calculation Algorithms**:
  - Migrated the general utility `count_occurrences` and LCS diff calculation logic (`compute_diff`, `DiffType`) from `main.rs` to `common_lib`.
  - Eliminated duplicate code and improved code reusability.
- **Update to [FOOTPRINTS.md](docs/FOOTPRINTS.md)**:
  - Measured and reflected the release binary size after introducing `common_lib` (2.88 MB -> 2.92 MB).
- **Addition of Tauri Installer Japanese Localization Settings (`tauri.conf.json`)**:
  - Added language settings so that a Japanese wizard is displayed during Windows installer builds (WiX / NSIS).
- **Correction of GitHub Actions (CI/Release) Workflow Build Errors (`ci.yml`, `release.yml`)**:
  - Modified the CI environment to also check out the shared crate `common_lib`.
  - Unified the working directory of jobs to `SnippetFlow` to ensure dependencies are resolved correctly.

## [1.6.0] - 2026-07-02

### Added
- **Implementation of JSON Import and Export Commands in the Tauri Desktop Environment**:
  - Implemented Rust commands for importing/exporting using native file dialogs (`rfd` crate) in response to the restriction of browser download behaviors in the desktop version (Tauri).
  - Modified the frontend to safely backup and restore data by calling these commands via `invoke`.

### Fixed
- **Correction of Theme Colors for All Borders and Group Elements (egui)**:
  - Fixed the issue where `ui.group` maintained some dark mode color schemes (such as dark gray borders) even when switching to light mode.
  - Applied custom `theme_card_frame` rendering that explicitly switches between light and dark modes for all bordered elements (preset cards, search box frames, editing meta frames, comparison/merge frames, etc.).
- **Resolving UI Breakage via Fixed Header and Footer Panels**:
  - Fixed the layout at the top and bottom of the screen so that the title header and batch action footer do not get hidden when scrolling the list (common to both the egui and React versions).
  - Implemented this in the egui version by combining `TopBottomPanel` and `CentralPanel`, and in the React version by specifying `h-screen overflow-hidden` on the top-level wrapper `#app-container` to restrict overall vertical scrolling, making only the card list area scrollable via `flex-1 overflow-y-auto min-h-0`.
- **Streamlining Window Resizing, Usability, and Fixing Text Clipping (egui)**:
  - To resolve the issue where standard OS window resizing operations were restricted due to hidden and transparent title bar settings, enabled `decorated: true` and `resizable: true` in `eframe::NativeOptions` so users can freely change the window size by dragging borders.
  - With the OS title bar visible, removed the redundant app close button, drag handle button, and app name label, streamlining the header area to just the theme toggle button. The version information is now shown in the window title bar.
  - Expanded the initial window size at startup to `1000 x 900` pixels to improve list visibility.
  - Applied automatic text wrapping via `egui::Label::new(...).wrap(true)` to solve the issue of long titles or descriptions getting cut off on the right side of the screen.
- **Alignment Improvement of Input Fields in the Add/Edit Form Screen (egui)**:
  - Redesigned each input item (title, body, description, and tag addition) into a table layout using `egui::Grid`. Perfectly aligned the widths of the labels and the vertical lines of the input fields to the millimeter, improving the aesthetics and usability of the input form.
- **Avoiding Conflicts with OS Dark Mode Settings in Tailwind CSS v4 (React)**:
  - Resolved the conflict where `dark:` prefix styles were forced onto internal card elements even when light mode was selected in the app if the OS was set to dark mode.
  - Added a `@variant dark` definition to `src/index.css` to enforce class-based dark mode, and modified the theme toggle process in `App.tsx` to dynamically sync and toggle the `.dark` class on the top-level `html` element's class list.

## [1.5.0] - 2026-07-02

### Added
- **Highlighting Feature for Search Keywords**:
  - Added a feature to both the Rust (egui) and React (Vite) versions that highlights matching parts of the search text within snippet titles and bodies (previews).
  - Implemented dynamic rendering using `LayoutJob` in the egui version and highlighting using `<mark>` elements in the React version.
  - Added the real-time matching item count display at the top of the list.
- **Sorting Feature for the Snippet List**:
  - Implemented dynamic sorting of the snippet list based on selected criteria (Newest Update, Oldest Update, Newest Creation, Alphabetical by Title) in both the Rust (egui) and React (Vite) versions.
  - Added a combo box in the egui version and a select box in the React version for sorting criteria selection.
  - Saved and persisted the sorting criteria settings in local settings (`settings.json` / `localStorage`) so that the selected state is maintained even after app restarts.

### Fixed
- **Strict Implementation of White-Themed Design in Light Mode (egui & React)**:
  - Resolved the light mode issue where "only the background turned white, and the contrast of borders and card interiors remained awkwardly dark."
  - Redesigned the entire UI with a clean, consistent, and modern light theme based on light gray styling for deleted preset texts (pure white background, slate-like pale gray borders, soft contrast fonts).
- **Consistency Optimization of UI Components and Button Sizes (egui)**:
  - Adjusted button paddings, font sizes, and spacings between elements in the egui version to maintain pixel-perfect alignment and a refined look after feature additions.
- **Addition of Unit Tests for Sorting Logic**:
  - Added a unit test (`test_sorting_snippets`) verifying sorting functionality to the Rust side test suite.

## [1.3.0] - 2026-07-01

### Added
- **Porting Theme Persistence and Toggle Feature (Rust)**: Implemented theme persistence for Light/Dark selection using `settings.json`, and dynamic rendering (background transparency and text color adaptation) via the header toggle button (☀ Light / 🌙 Dark).
- **Porting Tag Cloud Filter Feature (Rust)**: Implemented a tag cloud UI extracting unique tags from snippets and displaying them as buttons on the list screen. Supports one-click filtering toggle.
- **Porting Snippet Metadata, Restoration, and Permanent Deletion Features (Rust)**: Implemented the display of unique numbers, creation dates, and update dates in the editing form, and conditional rendering of "Restore" and "Delete Permanently (Physical Deletion)" buttons for archived (logically deleted) snippets.
- **Addition of Unit Tests verifying Settings Persistence (Rust)**: Added the `test_settings_persistence` test case.
- **Window Size Expansion and Drag Handle (Rust)**: Expanded the initial window size to `800x850` to fix off-screen elements. Added a new drag handle (`⛶ Move` button) to the header to allow window movement even when the title bar is hidden.
- **Recovery of the React (JavaScript) version**: Ran `npm install` and `npm run build` to confirm the normal operation of the Vite + TS + React development and build environments.
- **Addition of a Dedicated Screen for Merging Multiple Snippets (Rust)**: Implemented a dedicated screen to merge selected preset texts in list order. Supports order adjustment (↑/↓), separator selection (single/double newline, `---`, `===`, Japanese comma, no separator), live preview, and copying of merged text.
- **LCS Diff Color Display in the Difference Comparison Screen (Rust)**: Implemented a viewer that calculates differences between two selected preset texts using the LCS (Longest Common Subsequence) algorithm and highlights added lines in green and deleted lines in red.
- **Addition of a Performance Meter Screen (Rust)**: Implemented a performance meter screen showing the total snippet count, estimated file size, and recent search query execution time (in milliseconds). Also added a benchmark execution feature for 100-run average search processing.
- **Large Dataset Load Test Feature (Rust)**: Implemented automatic generation of dummy data (+1,000, +2,000, +5,000 items) and batch deletion to verify changes in memory search speed and drawing loads.
- **JSON Import/Export via File Dialogs (Rust)**: Added the `rfd` (Rust File Dialogs) crate to support JSON import and backup export of the snippet database through native OS file selection and save dialogs.
- **Introduction of Navigation Tabs (Rust)**: Added navigation tabs at the top of the application ("Snippet List," "New Snippet," "Compare," "Merge," "Performance Meter"), implementing a screen transition system matching the React version.

### Fixed
- **Vite Server Watch Exclusions**: Excluded `target`, `docs`, `src/main.rs`, `Cargo.toml`, and `Cargo.lock` from watch targets in `vite.config.ts` to prevent the Vite server from crashing due to EBUSY lock errors caused by binary conflicts during Rust builds and tests.
- **Tauri App Window Close Operations (React)**: In the frontend `src/App.tsx`, corrected the deprecated `@tauri-apps/api/window` to the Tauri v2 standard `@tauri-apps/api/webviewWindow`, implementing proper window closing via `getCurrentWebviewWindow().close()`.
- **Disabling Always-on-Top Window Settings**: Based on user feedback, changed `alwaysOnTop` / `always_on_top` to `false` in both Tauri (`tauri.conf.json`) and egui (`src/main.rs`) window settings.

### Optimized
- **Optimization of Search Processing (Rust)**: Extracted filtering operations out of the loop in `draw_list_screen` to accelerate measured search query speeds, obtaining 100% accurate processing times in milliseconds.
- **Complete Elimination of Clippy Warnings (Rust)**: Adjusted code to adopt `std::mem::swap` and removed unused methods, conforming fully to `-D warnings` (Clippy settings treating warnings as errors) to achieve zero compiler warnings.

## [1.2.0] - 2026-07-01

### Added
- **Dynamic Version Display**: Modified the compile-time dynamic retrieval of the version configured in `Cargo.toml` (introduced `env!("CARGO_PKG_VERSION")`).
- **Automatic Registration of Japanese Fonts**: To resolve the issue of garbled Japanese characters (tofu characters) in egui's default fonts, implemented dynamic discovery of standard Windows Japanese fonts (such as Meiryo) at startup and registered them as priority fonts.
- **Unit Tests**: Added an automated test module (`mod tests`) at the end of `src/main.rs`. Automated behavior verification for `count_occurrences`, initial data, and tag suggestion logic based on keyword analysis.
- **Creation of Design Documents**:
  - `docs/SPEC.md`: Function and technical specification document covering window specifications, transparency, low resources, etc.
  - `docs/DIAGRAM.md`: Mermaid design drawings showing application structures and sequence flows.
  - `README.md` / `README.ja.md`: Multilingual product overview and build instructions (added mutual links and status badges).
  - `docs/FOOTPRINTS.md`: Performance tracking record for binary size and resource consumption.
- **Complete Reconstruction Based on Detailed Specifications**:
  - Introduced screen separation design based on `AppScreen` state transitions (List / Add / Edit / Compare).
  - Implemented local file persistence to dynamically load `snippets.json` on startup and save immediately during additions, edits, or logical deletions.
  - Added the `chrono` crate to adhere strictly to date specifications (creation date `created_at`, update date `updated_at`, deletion date `deleted_at`, deletion flag `is_deleted`) and implemented logical deletion.
  - Added checkboxes for multiple selections and a "Merge & Copy" function to the list screen.
  - Newly added a comparison screen allowing users to compare two selected preset texts side-by-side.
  - Implemented a tag search bar functioning independently of the title/body search, and a checkbox to toggle the display of archived/deleted data.
- **Expansion of Unit Tests**: Added `test_logical_deletion` and other test cases to the `tests` module, running a total of 4 verification tests.

### Fixed
- **Correction of eframe Compile Errors**:
  - Resolved the issue of missing `winapi` features required to build `eframe` on the Windows platform by explicitly adding `winapi = { version = "0.3.9", features = ["winuser"] }` to the dependencies in `Cargo.toml`.
  - Corrected `..Default::options()` in the window option definition of `src/main.rs` to the proper `..Default::default()`, resolving the compiler error "expected trait, found type".
- **Optimization of UI and Font Sizes**:
  - In response to the issue where the window was too small and text was hard to read, expanded the initial window size to `500x650` and increased font sizes overall (body text, buttons, headers) to improve visibility.
