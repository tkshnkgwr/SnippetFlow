# SnippetFlow (SnippetManager)

[![Version](https://img.shields.io/badge/version-1.13.3-blue.svg)](Cargo.toml)
[![GitHub Release](https://img.shields.io/github/v/release/tkshnkgwr/SnippetFlow)](https://github.com/tkshnkgwr/SnippetFlow/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#license)
[![Platform](https://img.shields.io/badge/platform-windows-lightgrey.svg)](#prerequisites)
[![Rust Version](https://img.shields.io/badge/rust-1.70%2B-orange.svg)](#prerequisites)

English | [日本語版 (Japanese)](README_JA.md)

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

For detailed functional specifications, development guidelines, and diagrams, please refer to the documents in the `docs/en/` folder:
- [Functional Specifications (SPEC.md)](docs/en/SPEC.md)
- [Architecture & Sequence Diagrams (DIAGRAM.md)](docs/en/DIAGRAM.md)
- [Resource Footprints & Performance (FOOTPRINTS.md)](docs/en/FOOTPRINTS.md)
- [Quality Verification & Test Report (TEST_REPORT.md)](docs/en/TEST_REPORT.md)
- [Testing Strategy & Guide (TESTING.md)](docs/en/TESTING.md)
- [Security Policy (SECURITY.md)](docs/en/SECURITY.md)
- [Contribution Guidelines (CONTRIBUTING.md)](docs/en/CONTRIBUTING.md)
- [Developer's Guide (DEVELOPING.md)](docs/en/DEVELOPING.md)
- [Release Flow (RELEASE.md)](docs/en/RELEASE.md)
- [AI Coding Instructions (INSTRUCTIONS.md)](docs/en/INSTRUCTIONS.md)
- [Task Log (TODO.md)](docs/en/TODO.md)
- [User Guide (USER_GUIDE.md)](docs/en/USER_GUIDE.md)

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
The compiled release binary can be found under `src-tauri/target/release/Snippetflow.exe`. You can directly run this executable to start the application.


---

## Snippet Examples (Usage Scenarios)

Here are some practical snippet examples that you can register in SnippetFlow to boost your daily productivity. Feel free to copy and import them.

### 1. Meeting Scheduler (Plain Text)
*   **Title**: `Schedule Meeting (Candidate Dates)`
*   **Tags**: `Business, Email, Schedule`
*   **Content**:
    ```text
    Dear [Client Name],
    
    I hope this email finds you well. I would like to schedule a brief meeting to discuss the project updates. 
    
    Could you please let me know if any of the following time slots work for you? (All times in JST)
    
    - [Month/Date] (Day) 10:00 - 12:00
    - [Month/Date] (Day) 13:00 - 15:00
    - [Month/Date] (Day) 15:00 - 17:00
    
    If none of these times are convenient, please suggest 2 or 3 alternatives that work better for you.
    I will send a calendar invite with a Zoom/Teams link once confirmed.
    
    Best regards,
    [Your Name]
    ```

### 2. Meeting Minutes Template (Markdown)
*   **Title**: `Meeting Minutes`
*   **Tags**: `Meeting, Markdown, Template`
*   **Content**:
    ```markdown
    # [Meeting Minutes] [Project Name] Weekly Sync
    
    - **Date/Time**: 2026-MM-DD 10:00 - 11:00
    - **Location**: Zoom / Online
    - **Attendees**: [Name A], [Name B], [Your Name]
    
    ## Agenda
    1. Status Update
    2. Discuss current bottlenecks
    3. Action items for next week
    
    ## Decisions Made
    - Decision 1
    - Decision 2
    
    ## Action Items (Task, Deadline, Owner)
    - [ ] Task A (Deadline: MM/DD, Owner: [Name A])
    - [ ] Task B (Deadline: MM/DD, Owner: [Your Name])
    
    ## Notes
    - Record details of discussion here.
    ```

### 3. AI Refactoring Prompt (Plain Text)
*   **Title**: `AI Code Refactoring Prompt`
*   **Tags**: `AI, Prompt, Dev`
*   **Content**:
    ```text
    Please refactor the following code.
    
    # Requirements:
    - Improve readability (rename variables, split functions if necessary)
    - Optimize performance
    - Enhance error handling and edge cases
    
    # Code:
    ```

### 4. Git Commit Template (Plain Text)
*   **Title**: `Git Commit Message Template`
*   **Tags**: `Git, Dev, Template`
*   **Content**:
    ```text
    feat: [short description of new feature]

    - [detailed change 1]
    - [detailed change 2]

    Ref: #[issue number]
    ```

### 5. SQL Query Template (SQL / Plain Text)
*   **Title**: `SQL Sales Aggregation`
*   **Tags**: `SQL, Database, Dev`
*   **Content**:
    ```sql
    SELECT 
        DATE(created_at) AS order_date,
        COUNT(id) AS total_orders,
        SUM(total_amount) AS total_sales
    FROM orders
    WHERE created_at >= '2026-01-01'
    GROUP BY DATE(created_at)
    ORDER BY order_date DESC;
    ```

---

## License

This project is licensed under the MIT License.
