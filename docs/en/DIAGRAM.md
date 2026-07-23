**English** | [日本語版](../ja/DIAGRAM.md)

# SnippetFlow (SnippetManager) System Architecture & Design Diagrams

This document visualizes the architecture, screen transitions, data structures, and representative use case data flows of **SnippetFlow** using Mermaid diagrams.

---

## 1. System Configuration & Component Structure

SnippetFlow runs in a single process, interacting directly with the OS native window API and clipboard API, and persisting data to local JSON storage (snippet data and application settings).

```mermaid
graph TD
    subgraph OS ["Operating System / Environment"]
        Clipboard["OS Clipboard"]
        WinAPI["Window Manager (Transparent/AlwaysOnTop)"]
    end

    subgraph Storage ["Local Storage"]
        JSON["snippets.json"]
        SettingsJSON["settings.json"]
    end

    subgraph SnippetFlow ["SnippetFlow (Rust Executable)"]
        main["main() Entry Point"]
        app["SnippetManagerApp (State Container)"]
        ui["eframe::App::update() (UI Rendering Loop)"]
        cb["arboard::Clipboard (Clipboard Sync)"]
        chrono["chrono (DateTime Engine)"]
    end

    main -->|Initialize NativeOptions| app
    app -->|Load/Save data| JSON
    app -->|Load/Save settings| SettingsJSON
    app -->|State Reference| ui
    ui -->|Copy to Clipboard| cb
    cb -->|Set clipboard text| Clipboard
    ui -->|Get current time| chrono
    main -->|Setup Window properties| WinAPI
```

---

## 2. Screen Transition State Model (State Transition)

The application switches UI rendering based on the `AppScreen` state.

```mermaid
stateDiagram-v2
    [*] --> List : Startup (load snippets.json & settings.json)
    
    List --> Add : Click "➕ Add New"
    List --> Edit : Click "✏️ Edit"
    List --> Compare : Click "Compare" tab or "Compare Two"
    List --> Merge : Click "Merge" tab or via "Merge & Copy"
    List --> Performance : Click "Performance Meter" tab
    
    Add --> List : "💾 Save" or "❌ Cancel"
    
    state Edit {
        [*] --> EditForm
        EditForm --> List : "💾 Save" or "❌ Cancel"
        EditForm --> List : "🗑️ Delete Snippet" (Logical Deletion)
        EditForm --> List : "🔄 Restore from Archive"
        EditForm --> List : "🗑️ Permanently Delete" (Physical Deletion)
    }
    
    Compare --> List : "🔙 Back to List"
    Merge --> List : "🔙 Back to List"
    Performance --> List : "🔙 Back to List"
```

---

## 3. Data Structure Model

```mermaid
classDiagram
    class SnippetManagerApp {
        +snippets: Vec~Snippet~
        +current_screen: AppScreen
        +search_query: String
        +tag_search_query: String
        +show_deleted: bool
        +selected_tag: Option~String~
        +selected_ids: HashSet~usize~
        +settings: AppSettings
        +form_title: String
        +form_content: String
        +form_description: String
        +form_tags: Vec~String~
        +tag_input: String
        +last_action_message: String
        +last_action_time: Option~Instant~
        +clipboard: Option~Clipboard~
        +load_data() Vec~Snippet~
        +save_data() void
        +open_add_form() void
        +open_edit_form(usize id) void
        +get_suggested_tags() Vec~Tuple~
    }

    class Snippet {
        +id: usize
        +title: String
        +content: String
        +description: String
        +created_at: String
        +updated_at: String
        +deleted_at: Option~String~
        +is_deleted: bool
        +tags: Vec~String~
    }

    class AppSettings {
        +is_dark_mode: bool
        +load() AppSettings
        +save() void
    }

    class AppScreen {
        <<enumeration>>
        List
        Add
        Edit
        Compare
        Merge
        Performance
    }

    SnippetManagerApp "1" *-- "many" Snippet : contains
    SnippetManagerApp "1" *-- "1" AppSettings : contains
    SnippetManagerApp "1" *-- "1" AppScreen : state
```

---

## 4. Sequence Flows

### 4.1. Theme Switching Persistence

The sequence from when the user clicks the "Toggle Theme" button on the UI until the rendering is updated and the setting is saved.

```mermaid
sequenceDiagram
    actor User
    participant UI as UI Loop (egui)
    participant App as SnippetManagerApp
    participant Settings as AppSettings
    participant JSON as settings.json

    User->>UI: Click "☀ Light" or "🌙 Dark"
    UI->>App: Detect click event
    App->>App: Toggle is_dark_mode
    App->>Settings: Call settings.save()
    Settings->>JSON: Write new config value
    App->>UI: Immediately redraw Visuals and background color
```

### 4.2. Tag Cloud Toggle Filtering

The sequence from when the user selects a specific tag in the tag cloud of the list screen until the snippet list is filtered.

```mermaid
sequenceDiagram
    actor User
    participant UI as UI Loop (egui)
    participant App as SnippetManagerApp

    Note over App: Extract, sort, and retain unique tags from all snippets at startup
    User->>UI: Click "#Business" button in tag cloud
    UI->>App: Update selected_tag = Some("Business")
    App->>App: Add tag condition when filtering the list
    App->>UI: Display only snippets containing "#Business"
```

### 4.3. Restoring Archived Data and Permanent Physical Deletion

The data flow for applying restoration or permanent deletion to deleted (archived) snippets.

```mermaid
sequenceDiagram
    actor User
    participant UI as UI Loop (egui)
    participant App as SnippetManagerApp
    participant JSON as snippets.json

    User->>UI: Select deleted snippet to open the edit screen
    Note over UI,App: Detect is_deleted == true and display "Restore" and "Permanently Delete" buttons
    
    alt Restore Process
        User->>UI: Click "🔄 Restore from Archive"
        UI->>App: Set is_deleted = false, deleted_at = None, updated_at = current time
        App->>JSON: Call save_data()
    else Permanent Physical Deletion
        User->>UI: Click "🗑️ Permanently Delete"
        UI->>App: Exclude target ID from snippets vector
        App->>JSON: Call save_data()
    end
    
    App->>App: Transition to current_screen = List
    UI->>User: Redraw list screen
```
