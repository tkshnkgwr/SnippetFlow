use crate::app::SnippetManagerApp;
use crate::model::Snippet;
use chrono::Local;

pub const STORAGE_FILE: &str = "snippets.json";

impl SnippetManagerApp {
    // 起動時のJSONロード処理
    pub fn load_data() -> Vec<Snippet> {
        if let Ok(file_content) = std::fs::read_to_string(STORAGE_FILE) {
            if let Ok(snippets) = serde_json::from_str::<Vec<Snippet>>(&file_content) {
                return snippets;
            }
        }

        // 初期サンプルデータ
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let samples = vec![
            Snippet {
                id: 1,
                title: "ビジネスメール：打ち合わせ調整".to_string(),
                content: "お世話になっております。日程の候補は以下となります。\n1. 〇月〇日 10:00-\n2. 〇月〇日 14:00-".to_string(),
                description: "社外向けの返信時に使用する挨拶と日程候補".to_string(),
                created_at: now.clone(),
                updated_at: now.clone(),
                deleted_at: None,
                is_deleted: false,
                tags: vec!["メール".to_string(), "ビジネス".to_string()],
                is_pinned: false,
                copy_count: 0,
                saved_time_sec: 0,
            },
            Snippet {
                id: 2,
                title: "定型：謝罪メール".to_string(),
                content: "ご不便をおかけし大変申し訳ございません。早急に原因を究明し対応いたします。".to_string(),
                description: "システムトラブルや不具合発生時の一次謝罪テンプレート".to_string(),
                created_at: now.clone(),
                updated_at: now.clone(),
                deleted_at: None,
                is_deleted: false,
                tags: vec!["メール".to_string(), "緊急".to_string()],
                is_pinned: false,
                copy_count: 0,
                saved_time_sec: 0,
            },
        ];

        // 初期ファイル保存
        if let Ok(json) = serde_json::to_string_pretty(&samples) {
            let _ = std::fs::write(STORAGE_FILE, json);
        }

        samples
    }

    // JSON保存処理
    pub fn save_data(&self) {
        if let Ok(json) = serde_json::to_string_pretty(&self.snippets) {
            let _ = std::fs::write(STORAGE_FILE, json);
        }
    }
}
