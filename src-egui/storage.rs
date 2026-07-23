use crate::app::SnippetManagerApp;
use crate::model::Snippet;
use chrono::Local;

pub const STORAGE_FILE: &str = "snippets.json";

/// 一時ファイルを経由したアトミック保存処理
fn atomic_write(path: &str, content: &str) {
    let tmp_path = format!("{}.tmp", path);
    if std::fs::write(&tmp_path, content).is_ok() {
        let _ = std::fs::rename(&tmp_path, path);
    }
}

impl SnippetManagerApp {
    // 起動時のJSONロード処理
    pub fn load_data() -> Vec<Snippet> {
        if let Ok(file_content) = std::fs::read_to_string(STORAGE_FILE) {
            let json_content = if common_lib::crypto::is_encrypted(&file_content) {
                common_lib::crypto::decrypt_data(
                    &file_content,
                    common_lib::crypto::DEFAULT_SECRET_KEY,
                )
                .ok()
            } else {
                Some(file_content.clone())
            };

            if let Some(valid_json) = json_content {
                if let Ok(snippets) = serde_json::from_str::<Vec<Snippet>>(&valid_json) {
                    return snippets;
                }
            }

            // ファイル破損時：安全のため既存ファイルを .bak にバックアップ保存
            let bak_path = format!("{}.bak", STORAGE_FILE);
            let _ = std::fs::copy(STORAGE_FILE, bak_path);
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
            atomic_write(STORAGE_FILE, &json);
        }

        samples
    }

    // JSON保存処理
    pub fn save_data(&self) {
        if let Ok(json) = serde_json::to_string_pretty(&self.snippets) {
            atomic_write(STORAGE_FILE, &json);
        }
    }

    // 暗号化JSON保存処理
    #[allow(dead_code)]
    pub fn save_data_encrypted(&self) {
        if let Ok(json) = serde_json::to_string_pretty(&self.snippets) {
            let encrypted =
                common_lib::crypto::encrypt_data(&json, common_lib::crypto::DEFAULT_SECRET_KEY);
            atomic_write(STORAGE_FILE, &encrypted);
        }
    }
}
