**English** | [日本語版](../ja/FOOTPRINTS.md)

# SnippetFlow (SnippetManager) Performance & Footprint Measurement Records

This document records the measurement results of the application's footprint (compiled binary size, CPU/memory resource usage).

---

## 1. Build Profiles and Binary Sizes

Records the binary sizes and optimization flag configurations generated in the release build.
* **Build command (egui version)**: `cargo build --release`
* **Generated binary (egui version)**: `target/release/snippet_manager.exe`
* **Binary size (egui version)**: **2.92 MB** (3,063,296 bytes) *Slight increase of about 38 KB due to multi-crate (link boundary) structure with the introduction of the shared crate `common_lib`.
* **Build command (Tauri version)**: `npx tauri build --no-bundle`
* **Generated binary (Tauri version)**: `src-tauri/target/release/Snippetflow.exe`
* **Binary size (Tauri version)**: **2.62 MB** (2,751,488 bytes)

---

## 2. Memory Footprint (RAM)

Memory usage during continuous execution measured by Windows Task Manager or Resource Monitor.
*Although configuration info is now retained in memory due to the introduction of `settings.json`, its impact on actual RAM is negligible (less than 1 KB).

| Operating State | Memory Usage (Physical Memory/Working Set) | Remarks |
| :--- | :--- | :--- |
| **Just after startup (Idle)** | **Approx. 12.7 MB** (Private: Approx. 8.4 MB) | Involves dynamic memory loading of Japanese fonts (TTC) and JSON file I/O operations. |
| **Searching/Viewing (Active)** | **Approx. 12.7 - 13.2 MB** | Computational load from incremental filtering is applied. |
| **Adding a snippet (During form input)** | **Approx. 12.7 - 13.2 MB** | Keyword frequency analysis and tag recommendation calculations are executed. |

---

## 3. CPU Usage

* **Idle state**: **0%**
  - When the application is inactive or there is no user interaction, the frame rendering refresh rate is reduced to once per second, so no CPU spikes occur.
* **Active state (User input, consecutive copying, etc.)**: **0.1% - 1.0%**
  - The CPU operates temporarily only when redrawing is triggered by event-driven activities such as keyboard inputs or clicks.

---

## 4. Build Optimization Options (Applied)

The configuration profile applied to `Cargo.toml` at the root and in `src-tauri` to reduce binary size and optimize execution performance.

```toml
[profile.release]
opt-level = "z"      # Optimize for size first
lto = true           # Enable Link-Time Optimization
codegen-units = 1    # Set codegen units to 1 to maximize optimization
panic = "abort"      # Abort on panic to remove unwinding code and reduce size
strip = true         # Automatically strip debug symbols and symbol tables
```
