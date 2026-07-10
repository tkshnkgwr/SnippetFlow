use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Snippet {
    pub id: usize,                  // ユニークナンバー
    pub title: String,              // 定型文タイトル
    pub content: String,            // 定型文本文
    pub description: String,        // 定型文説明
    pub created_at: String,         // 作成日 (YYYY-MM-DD HH:MM:SS)
    pub updated_at: String,         // 更新日
    pub deleted_at: Option<String>, // 削除日
    pub is_deleted: bool,           // 削除フラグ
    pub tags: Vec<String>,          // タグ
    #[serde(default)]
    pub is_pinned: bool, // ピン留めフラグ
    #[serde(default)]
    pub copy_count: u32, // コピー累計回数
    #[serde(default)]
    pub saved_time_sec: u32, // 累計短縮時間 (秒)
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Default)]
pub enum SortCriterion {
    #[default]
    UpdatedAtDesc, // 更新日時が新しい順 (デフォルト)
    UpdatedAtAsc,  // 更新日時が古い順
    CreatedAtDesc, // 作成日時が新しい順
    TitleAsc,      // タイトル順
    CopyCountDesc, // コピー回数 (多い順)
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppSettings {
    pub is_dark_mode: bool,
    #[serde(default)]
    pub sort_criterion: SortCriterion,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            is_dark_mode: true,
            sort_criterion: SortCriterion::default(),
        }
    }
}

pub const SETTINGS_FILE: &str = "settings.json";

impl AppSettings {
    pub fn load() -> Self {
        if let Ok(content) = std::fs::read_to_string(SETTINGS_FILE) {
            if let Ok(settings) = serde_json::from_str::<AppSettings>(&content) {
                return settings;
            }
        }
        AppSettings::default()
    }

    pub fn save(&self) {
        if let Ok(json) = serde_json::to_string_pretty(self) {
            let _ = std::fs::write(SETTINGS_FILE, json);
        }
    }
}

#[derive(Clone, Copy, PartialEq, Debug)]
pub enum AppScreen {
    List,
    Add,
    Edit(usize), // 編集対象のスニペットID
    Compare,
    Merge,
    Performance,
}
