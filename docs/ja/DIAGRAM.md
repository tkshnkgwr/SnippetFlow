[English](../en/DIAGRAM.md) | **日本語版**

# SnippetFlow (SnippetManager) システム構成・設計図面

本ドキュメントでは、**SnippetFlow** のアーキテクチャ、画面遷移、データ構造、および代表的なユースケースのデータフローを Mermaid ダイアグラムで可視化します。

---

## 1. システム構成・コンポーネント構造

SnippetFlow は単一のプロセスで動作し、OSのネイティブウィンドウAPIおよびクリップボードAPIと直接やり取りを行い、ローカルのJSONストレージ（スニペットデータおよびアプリ設定）へデータを永続化します。

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

## 2. 画面遷移状態モデル (State Transition)

アプリケーションは `AppScreen` 状態に基づいてUI描画を切り替えます。

```mermaid
stateDiagram-v2
    [*] --> List : 起動 (snippets.json & settings.json ロード)
    
    List --> Add : 「➕ 新規追加」クリック
    List --> Edit : 「✏️ 編集」クリック
    List --> Compare : 「差分比較」タブ or 「2つを比較する」クリック
    List --> Merge : 「複数結合」タブ or 「結合してコピー」経由
    List --> Performance : 「性能メーター」タブクリック
    
    Add --> List : 「💾 保存する」 or 「❌ キャンセル」
    
    state Edit {
        [*] --> EditForm
        EditForm --> List : 「💾 保存する」 or 「❌ キャンセル」
        EditForm --> List : 「🗑️ 定型文を削除」 (論理削除)
        EditForm --> List : 「🔄 アーカイブから復元」
        EditForm --> List : 「🗑️ 完全に削除する」 (物理削除)
    }
    
    Compare --> List : 「🔙 一覧に戻る」
    Merge --> List : 「🔙 一覧に戻る」
    Performance --> List : 「🔙 一覧に戻る」
```

---

## 3. データ構造モデル

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

## 4. シーケンスフロー

### 4.1. テーマ切り替えの永続化
ユーザーがUI上で「テーマ切り替え」ボタンを押してから、描画が更新され設定が保存されるまでの流れです。

```mermaid
sequenceDiagram
    actor User
    participant UI as UI Loop (egui)
    participant App as SnippetManagerApp
    participant Settings as AppSettings
    participant JSON as settings.json

    User->>UI: 「☀ ライト」または「🌙 ダーク」をクリック
    UI->>App: クリックイベント検知
    App->>App: is_dark_mode トグル反転
    App->>Settings: settings.save() 呼び出し
    Settings->>JSON: 新しい設定値を書き出し
    App->>UI: Visuals および背景色を即時再描画
```

### 4.2. タグクラウドによるトグル絞り込み
ユーザーが一覧画面のタグクラウドで特定のタグを選択し、スニペット一覧がフィルタリングされる流れです。

```mermaid
sequenceDiagram
    actor User
    participant UI as UI Loop (egui)
    participant App as SnippetManagerApp

    Note over App: 起動時に全スニペットから一意なタグを抽出しソート保持
    User->>UI: タグクラウドの「#ビジネス」ボタンをクリック
    UI->>App: selected_tag = Some("ビジネス") に更新
    App->>App: リストフィルタリング時にタグ条件を追加
    App->>UI: 「#ビジネス」を含むスニペットのみを表示
```

### 4.3. アーカイブデータの復元と永久物理削除
削除済み（アーカイブ）スニペットに対して復元および永久削除を適用するデータフローです。

```mermaid
sequenceDiagram
    actor User
    participant UI as UI Loop (egui)
    participant App as SnippetManagerApp
    participant JSON as snippets.json

    User->>UI: 削除済みスニペットを選択し編集画面を開く
    Note over UI,App: is_deleted == true を検知し、「復元」「完全に削除」ボタンを表示
    
    alt 復元処理
        User->>UI: 「🔄 アーカイブから復元」をクリック
        UI->>App: is_deleted = false, deleted_at = None, updated_at = 現在日時
        App->>JSON: save_data() 呼び出し
    else 永久物理削除
        User->>UI: 「🗑️ 完全に削除する」をクリック
        UI->>App: snippets 配列から対象IDを除外
        App->>JSON: save_data() 呼び出し
    end
    
    App->>App: current_screen = List に遷移
    UI->>User: 一覧画面の再描画
```
