**English** | [日本語版](../ja/FOOTPRINTS.md)

# SnippetFlow (SnippetManager) Performance & Footprint Measurement Records

This document records the measurement results of the application's footprint (compiled binary size, CPU/memory resource usage).

---

## 1. Build Profiles and Binary Sizes

Records the binary sizes and optimization flag configurations generated in the release build.
* **Build command**: `npm run tauri build`
* **Generated binary**: `src-tauri/target/release/Snippetflow.exe`
* **Binary size**: **Approx. 2.6 MB** (Optimized native executable binary)
* **Installer (.msi / .exe)**: **Approx. 4 - 5 MB** (Ultra-lightweight as it shares system Webview2 runtime without bundling)

---

## 2. Memory Footprint (RAM)

Memory usage of the Tauri Rust backend during continuous execution measured by Windows Task Manager or Resource Monitor.
*UI preferences (theme mode and sort order) are persisted in WebView2 `localStorage`, adding no extra memory overhead to the Rust backend.*

| Operating State                          | Memory Usage (Physical Memory/Working Set)    | Remarks                                                                      |
| :--------------------------------------- | :-------------------------------------------- | :--------------------------------------------------------------------------- |
| **Just after startup (Idle)**            | **Approx. 12.7 MB** (Private: Approx. 8.4 MB) | Involves Rust backend startup and initial encrypted JSON file loading.       |
| **Searching/Viewing (Active)**           | **Approx. 12.7 - 13.2 MB**                    | Computational load from IPC-based incremental filtering and sorting.         |
| **Adding a snippet (During form input)** | **Approx. 12.7 - 13.2 MB**                    | Keyword frequency analysis and tag recommendation calculations are executed. |

---

## 3. CPU Usage

* **Idle state**: **0%**
  - Because the backend follows an event-driven IPC architecture, no CPU spikes occur while idle.
* **Active state (User input, consecutive copying, etc.)**: **0.1% - 1.0%**
  - The CPU operates briefly only when triggered by user interactions such as keyboard input or clicks.

---

## 4. Build Optimization Options (Applied)

The configuration profile applied to the workspace root `Cargo.toml` to reduce binary size and optimize execution performance.


```toml
[profile.release]
opt-level = "z"      # Optimize for size first
lto = true           # Enable Link-Time Optimization
codegen-units = 1    # Set codegen units to 1 to maximize optimization
panic = "abort"      # Abort on panic to remove unwinding code and reduce size
strip = true         # Automatically strip debug symbols and symbol tables
```
