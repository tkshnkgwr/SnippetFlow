#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app;
mod model;
mod storage;
mod theme;
mod ui;

use app::SnippetManagerApp;
use eframe::egui;

fn main() -> Result<(), eframe::Error> {
    // 多重起動防止 (Single Instance) のチェック
    if common_lib::check_single_instance("com.snippetflow.app", "SnippetFlow").is_err() {
        // すでに起動している場合は静かに終了する
        return Ok(());
    }

    // 常時最前面 (Always on Top) & タイトルバー非表示 (Decorated: false) & 背景透過 (Transparent: true) 設定
    // 初期ウィンドウサイズを 800x850 に拡大してレイアウトの収まりを改善
    let options = eframe::NativeOptions {
        always_on_top: false,
        decorated: true,
        transparent: false,
        resizable: true,
        initial_window_size: Some(egui::vec2(1000.0, 900.0)),
        ..Default::default()
    };

    let version = env!("CARGO_PKG_VERSION");
    eframe::run_native(
        &format!("定型文マネージャー v{} (Rust-egui Native)", version),
        options,
        Box::new(|cc| {
            theme::setup_custom_fonts(&cc.egui_ctx);
            Box::new(SnippetManagerApp::default())
        }),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use model::Snippet;

    #[test]
    fn test_snippet_default_data() {
        let app = SnippetManagerApp::default();
        assert!(!app.snippets.is_empty());
    }

    #[test]
    fn test_logical_deletion() {
        let mut snip = Snippet {
            id: 99,
            title: "Test Title".to_string(),
            content: "Test Content".to_string(),
            description: "Test Desc".to_string(),
            created_at: "2026-07-01 10:00:00".to_string(),
            updated_at: "2026-07-01 10:00:00".to_string(),
            deleted_at: None,
            is_deleted: false,
            tags: vec![],
            is_pinned: false,
            copy_count: 0,
            saved_time_sec: 0,
        };

        let now_str = "2026-07-01 12:00:00".to_string();
        snip.is_deleted = true;
        snip.deleted_at = Some(now_str.clone());
        snip.updated_at = now_str;

        assert!(snip.is_deleted);
        assert_eq!(snip.deleted_at.unwrap(), "2026-07-01 12:00:00");
    }

    #[test]
    fn test_get_suggested_tags() {
        let app = SnippetManagerApp {
            form_title: "ビジネスの緊急メール".to_string(),
            form_content: "調整をお願いします".to_string(),
            form_description: "メール連絡用".to_string(),
            ..Default::default()
        };

        let suggestions = app.get_suggested_tags();
        let tags: Vec<String> = suggestions.into_iter().map(|(t, _)| t).collect();
        assert!(tags.contains(&"メール".to_string()));
        assert!(tags.contains(&"ビジネス".to_string()));
    }

    #[test]
    fn test_settings_persistence() {
        let test_file = "test_settings_temp.json";

        #[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
        struct TempSettings {
            is_dark_mode: bool,
        }

        let settings = TempSettings {
            is_dark_mode: false,
        };
        let json = serde_json::to_string_pretty(&settings).unwrap();
        std::fs::write(test_file, json).unwrap();

        let content = std::fs::read_to_string(test_file).unwrap();
        let loaded: TempSettings = serde_json::from_str(&content).unwrap();
        assert!(!loaded.is_dark_mode);

        std::fs::remove_file(test_file).unwrap();
    }

    #[test]
    fn test_highlight_text() {
        let text = "Hello World rust";
        let query = "world";
        let font_id = egui::FontId::proportional(14.0);
        let job = theme::highlight_text(text, query, font_id, true);

        // 通常部分 ("Hello "), ハイライト部分 ("World"), 通常部分 (" rust")
        assert_eq!(job.sections.len(), 3);
    }

    #[test]
    fn test_sorting_snippets() {
        let mut snippets = [
            Snippet {
                id: 1,
                title: "B".to_string(),
                content: "".to_string(),
                description: "".to_string(),
                created_at: "2026-07-02 10:00:00".to_string(),
                updated_at: "2026-07-02 10:00:00".to_string(),
                deleted_at: None,
                is_deleted: false,
                tags: vec![],
                is_pinned: false,
                copy_count: 0,
                saved_time_sec: 0,
            },
            Snippet {
                id: 2,
                title: "A".to_string(),
                content: "".to_string(),
                description: "".to_string(),
                created_at: "2026-07-02 11:00:00".to_string(),
                updated_at: "2026-07-02 09:00:00".to_string(),
                deleted_at: None,
                is_deleted: false,
                tags: vec![],
                is_pinned: false,
                copy_count: 0,
                saved_time_sec: 0,
            },
        ];

        // タイトル順でソート
        snippets.sort_by(|a, b| a.title.cmp(&b.title));
        assert_eq!(snippets[0].title, "A");

        // 更新日順(新しい順)でソート
        snippets.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        assert_eq!(snippets[0].title, "B");
    }
}
