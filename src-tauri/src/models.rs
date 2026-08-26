use serde::{Deserialize, Serialize};

/// データベース（snippets.json）保存形式のスニペット構造体。
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DbSnippet {
    /// 定型文の一意な識別ID
    pub id: usize,
    /// 定型文のタイトル
    pub title: String,
    /// 定型文の本文
    pub content: String,
    /// 定型文の補足・説明テキスト
    #[serde(default)]
    pub description: String,
    /// 作成日時 (ISO 8601 フォーマット)
    #[serde(alias = "created_at")]
    pub created_at: String,
    /// 最終更新日時 (ISO 8601 フォーマット)
    #[serde(alias = "updated_at")]
    pub updated_at: String,
    /// 論理削除日時 (`Option<String>`)
    #[serde(default, alias = "deleted_at")]
    pub deleted_at: Option<String>,
    /// 論理削除フラグ (true の場合ゴミ箱内)
    #[serde(default, alias = "is_deleted")]
    pub is_deleted: bool,
    /// 関連付けられたタグリスト
    #[serde(default)]
    pub tags: Vec<String>,
    /// 最上部ピン留め表示フラグ
    #[serde(default, alias = "is_pinned")]
    pub is_pinned: bool,
    /// コピー累計回数
    #[serde(default, alias = "copy_count")]
    pub copy_count: u32,
    /// コピーにより節約された推定短縮時間（秒単位）
    #[serde(default, alias = "saved_time_sec")]
    pub saved_time_sec: u32,
}

/// Tauri IPCコマンドとの相互やり取りに使用するスニペット構造体。
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TauriSnippet {
    /// 定型文の一意な識別ID
    pub id: usize,
    /// 定型文のタイトル
    pub title: String,
    /// 定型文の本文
    pub content: String,
    /// 定型文の補足・説明テキスト
    #[serde(default)]
    pub description: String,
    /// 作成日時 (ISO 8601 フォーマット)
    #[serde(alias = "created_at")]
    pub created_at: String,
    /// 最終更新日時 (ISO 8601 フォーマット)
    #[serde(alias = "updated_at")]
    pub updated_at: String,
    /// 論理削除日時 (`Option<String>`)
    #[serde(default, alias = "deleted_at")]
    pub deleted_at: Option<String>,
    /// 論理削除フラグ
    #[serde(default, alias = "is_deleted")]
    pub is_deleted: bool,
    /// 関連付けられたタグリスト
    #[serde(default)]
    pub tags: Vec<String>,
    /// 最上部ピン留め表示フラグ
    #[serde(default, alias = "is_pinned")]
    pub is_pinned: bool,
    /// コピー累計回数
    #[serde(default, alias = "copy_count")]
    pub copy_count: u32,
    /// コピーにより節約された推定短縮時間（秒単位）
    #[serde(default, alias = "saved_time_sec")]
    pub saved_time_sec: u32,
}

impl From<DbSnippet> for TauriSnippet {
    fn from(db: DbSnippet) -> Self {
        Self {
            id: db.id,
            title: db.title,
            content: db.content,
            description: db.description,
            created_at: db.created_at,
            updated_at: db.updated_at,
            deleted_at: db.deleted_at,
            is_deleted: db.is_deleted,
            tags: db.tags,
            is_pinned: db.is_pinned,
            copy_count: db.copy_count,
            saved_time_sec: db.saved_time_sec,
        }
    }
}

impl From<TauriSnippet> for DbSnippet {
    fn from(tauri: TauriSnippet) -> Self {
        Self {
            id: tauri.id,
            title: tauri.title,
            content: tauri.content,
            description: tauri.description,
            created_at: tauri.created_at,
            updated_at: tauri.updated_at,
            deleted_at: tauri.deleted_at,
            is_deleted: tauri.is_deleted,
            tags: tauri.tags,
            is_pinned: tauri.is_pinned,
            copy_count: tauri.copy_count,
            saved_time_sec: tauri.saved_time_sec,
        }
    }
}

/// Rustバックエンドでの検索・フィルタリング・ソート結果を表す構造体。
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    /// 絞り込みおよびソート済みのスニペットリスト。
    pub filtered_snippets: Vec<TauriSnippet>,
    /// バックエンドでのクエリ検索処理時間（ミリ秒単位）。
    pub query_time_ms: f64,
}

/// よく使われる定型文の簡易情報
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TopSnippet {
    pub id: usize,
    pub title: String,
    pub copy_count: u32,
    pub saved_time_sec: u32,
}

/// データベース全体の統計・アナリティクス情報を表す構造体。
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SnippetStats {
    /// 総スニペット件数
    pub total_count: usize,
    /// 有効なスニペット件数
    pub active_count: usize,
    /// 論理削除済みスニペット件数
    pub deleted_count: usize,
    /// 総コピー回数
    pub total_copies: u32,
    /// 累計節約時間（秒）
    pub total_saved_sec: u32,
    /// 概算ファイルサイズ（KB）
    pub kb_size: String,
    /// コピー回数の多いトップ3スニペット
    pub top_snippets: Vec<TopSnippet>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_db_snippet_conversion() {
        let db = DbSnippet {
            id: 1,
            title: "Test Title".to_string(),
            content: "Test Content".to_string(),
            description: "Test Desc".to_string(),
            created_at: "2026-07-23 12:00:00".to_string(),
            updated_at: "2026-07-23 12:00:00".to_string(),
            deleted_at: None,
            is_deleted: false,
            tags: vec!["tag1".to_string()],
            is_pinned: true,
            copy_count: 5,
            saved_time_sec: 30,
        };

        let tauri: TauriSnippet = db.clone().into();
        assert_eq!(tauri.id, 1);
        assert_eq!(tauri.title, "Test Title");
        assert!(tauri.is_pinned);
    }

    #[test]
    fn test_tauri_snippet_deserialization_with_missing_fields() {
        let json_str = r#"[{"id": 99, "title": "Minimal", "content": "Minimal Content", "createdAt": "2026-07-23", "updatedAt": "2026-07-23"}]"#;
        let db_list: Vec<DbSnippet> =
            serde_json::from_str(json_str).expect("Deserialization failed");
        assert_eq!(db_list.len(), 1);
        assert_eq!(db_list[0].id, 99);
        assert_eq!(db_list[0].description, "");
        assert!(!db_list[0].is_deleted);
        assert!(!db_list[0].is_pinned);
    }
}
