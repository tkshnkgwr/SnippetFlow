use std::fs;
use std::path::PathBuf;
use tauri::Manager;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DbSnippet {
    pub id: usize,
    pub title: String,
    pub content: String,
    #[serde(default)]
    pub description: String,
    #[serde(alias = "created_at")]
    pub created_at: String,
    #[serde(alias = "updated_at")]
    pub updated_at: String,
    #[serde(default, alias = "deleted_at")]
    pub deleted_at: Option<String>,
    #[serde(default, alias = "is_deleted")]
    pub is_deleted: bool,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default, alias = "is_pinned")]
    pub is_pinned: bool,
    #[serde(default, alias = "copy_count")]
    pub copy_count: u32,
    #[serde(default, alias = "saved_time_sec")]
    pub saved_time_sec: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TauriSnippet {
    pub id: usize,
    pub title: String,
    pub content: String,
    #[serde(default)]
    pub description: String,
    #[serde(alias = "created_at")]
    pub created_at: String,
    #[serde(alias = "updated_at")]
    pub updated_at: String,
    #[serde(default, alias = "deleted_at")]
    pub deleted_at: Option<String>,
    #[serde(default, alias = "is_deleted")]
    pub is_deleted: bool,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default, alias = "is_pinned")]
    pub is_pinned: bool,
    #[serde(default, alias = "copy_count")]
    pub copy_count: u32,
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

/// 一時ファイルを経由したアトミック保存処理。Windowsでの上書き移動失敗に対する保護を含みます。
fn atomic_write<P: AsRef<std::path::Path>>(path: P, content: &str) -> Result<(), String> {
    let path = path.as_ref();
    let tmp_path = path.with_extension("json.tmp");
    fs::write(&tmp_path, content).map_err(|e| format!("一時保存に失敗: {e}"))?;

    if path.exists() {
        let _ = fs::remove_file(path);
    }

    if let Err(e) = fs::rename(&tmp_path, path) {
        fs::copy(&tmp_path, path)
            .map_err(|err| format!("ファイル保存に失敗: {err} (rename error: {e})"))?;
        let _ = fs::remove_file(&tmp_path);
    }
    Ok(())
}

/// アプリデータディレクトリ内の snippets.json へのパスを返す。
/// ディレクトリが存在しない場合は自動的に作成する。
fn get_storage_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir の取得に失敗: {e}"))?;
    fs::create_dir_all(&data_dir).map_err(|e| format!("データディレクトリの作成に失敗: {e}"))?;
    Ok(data_dir.join("snippets.json"))
}

#[tauri::command]
fn load_snippets(app: tauri::AppHandle) -> Result<Vec<TauriSnippet>, String> {
    let path = get_storage_path(&app)?;

    if let Ok(file_content) = fs::read_to_string(&path) {
        let json_content = if common_lib::crypto::is_encrypted(&file_content) {
            common_lib::crypto::decrypt_data(&file_content, common_lib::crypto::DEFAULT_SECRET_KEY)
                .ok()
        } else {
            Some(file_content.clone())
        };

        if let Some(valid_json) = json_content {
            if let Ok(db_snippets) = serde_json::from_str::<Vec<DbSnippet>>(&valid_json) {
                let tauri_snippets: Vec<TauriSnippet> =
                    db_snippets.into_iter().map(TauriSnippet::from).collect();
                return Ok(tauri_snippets);
            }
        }

        // ファイル破損時：安全のため既存ファイルを .bak にバックアップ保存
        let bak_path = path.with_extension("json.bak");
        let _ = fs::copy(&path, &bak_path);
    }

    // ファイルが存在しない、またはパースエラーの場合、初期のデフォルトデータを生成して保存
    let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let samples = vec![
        DbSnippet {
            id: 1001,
            title: "ビジネスメール：打ち合わせ日程調整".to_string(),
            content: "〇〇株式会社\n〇〇様\n\nいつもお世話になっております。\n株式会社△△の [あなたの名前] です。\n\n先日に引き続き、新しいプロジェクトに関するお打ち合わせの日程を調整したくご連絡いたしました。\n\n恐れ入りますが、以下の候補日の中でご都合の良い日時がございましたら、ご教示いただけますと幸いです。\n\n【候補日程】\n1. 〇月〇日(月) 10:00 - 12:00\n2. 〇月〇日(水) 13:00 - 15:00\n3. 〇月〇日(金) 15:00 - 17:00\n\n上記以外でのご希望がございましたら、お気軽にお申し付けください。\n何卒よろしくお願い申し上げます。".to_string(),
            description: "新規取引先やプロジェクト開始前の打ち合わせ日程調整用メールテンプレートです。".to_string(),
            created_at: now.clone(),
            updated_at: now.clone(),
            deleted_at: None,
            is_deleted: false,
            tags: vec!["ビジネス".to_string(), "日程調整".to_string(), "メール".to_string()],
            is_pinned: false,
            copy_count: 0,
            saved_time_sec: 0,
        },
        DbSnippet {
            id: 1002,
            title: "ビジネスメール：お礼とお見積り送付".to_string(),
            content: "〇〇株式会社\n〇〇様\n\n平素は格別のご高配を賜り、厚く御礼申し上げます。\n株式会社△△の [あなたの名前] です。\n\n本日はお忙しい中、貴重なお時間をいただき誠にありがとうございました。\n本日ご相談いただきました内容に基づき、お見積書を添付にて送付いたします。\n\n【添付内容】\n・御見積書_〇〇プロジェクト_20260630.pdf\n\n【お見積り概要】\n・総額：￥〇〇,〇〇〇 (税別)\n・納期：〇月〇日まで\n\nご不明な点や、調整のご要望などがございましたら、どうぞお気軽にお問い合わせください。\nご検討のほど、何卒よろしくお願い申し上げます。".to_string(),
            description: "商談や打ち合わせ後の迅速なお礼および見積書の送付メールテンプレートです。".to_string(),
            created_at: now.clone(),
            updated_at: now.clone(),
            deleted_at: None,
            is_deleted: false,
            tags: vec!["ビジネス".to_string(), "お見積り".to_string(), "メール".to_string()],
            is_pinned: false,
            copy_count: 0,
            saved_time_sec: 0,
        },
    ];

    if let Ok(json) = serde_json::to_string_pretty(&samples) {
        let _ = atomic_write(&path, &json);
    }

    let tauri_snippets = samples.into_iter().map(TauriSnippet::from).collect();
    Ok(tauri_snippets)
}

#[tauri::command]
fn save_snippets(
    app: tauri::AppHandle,
    snippets: Vec<TauriSnippet>,
    encrypt: Option<bool>,
) -> Result<(), String> {
    let path = get_storage_path(&app)?;
    let db_snippets: Vec<DbSnippet> = snippets.into_iter().map(DbSnippet::from).collect();
    let json = serde_json::to_string_pretty(&db_snippets).map_err(|e| e.to_string())?;

    let should_encrypt = match encrypt {
        Some(val) => val,
        None => {
            if let Ok(existing) = fs::read_to_string(&path) {
                common_lib::crypto::is_encrypted(&existing)
            } else {
                false
            }
        }
    };

    let content_to_save = if should_encrypt {
        common_lib::crypto::encrypt_data(&json, common_lib::crypto::DEFAULT_SECRET_KEY)
    } else {
        json
    };

    atomic_write(&path, &content_to_save)
}

#[tauri::command]
fn is_storage_encrypted(app: tauri::AppHandle) -> Result<bool, String> {
    let path = get_storage_path(&app)?;
    if let Ok(content) = fs::read_to_string(&path) {
        Ok(common_lib::crypto::is_encrypted(&content))
    } else {
        Ok(false)
    }
}

#[tauri::command]
fn export_snippets_json(json_str: String) -> Result<(), String> {
    if let Some(path) = rfd::FileDialog::new()
        .add_filter("json", &["json"])
        .save_file()
    {
        atomic_write(path, &json_str)?;
        Ok(())
    } else {
        Err("Cancelled".to_string())
    }
}

#[tauri::command]
fn import_snippets_json() -> Result<String, String> {
    if let Some(path) = rfd::FileDialog::new()
        .add_filter("json", &["json"])
        .pick_file()
    {
        let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
        if common_lib::crypto::is_encrypted(&content) {
            common_lib::crypto::decrypt_data(&content, common_lib::crypto::DEFAULT_SECRET_KEY)
        } else {
            Ok(content)
        }
    } else {
        Err("Cancelled".to_string())
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

/// 2つのテキスト間で行単位の差分（LCS: 最長共通部分列）をRust側で高速計算して返します。
///
/// # Arguments
/// * `old_text` - 比較元のテキスト（A）
/// * `new_text` - 比較先のテキスト（B）
#[tauri::command]
fn compute_snippet_diff(old_text: String, new_text: String) -> Vec<common_lib::text::DiffPart> {
    common_lib::text::compute_diff(&old_text, &new_text)
}

/// スニペット全件に対し、キーワード検索・複数タグ絞り込み・論理削除フィルタ・ソートをRust側で超高速実行します。
///
/// # Arguments
/// * `snippets` - 検索対象のスニペット一覧
/// * `search_text` - 検索キーワード
/// * `selected_tags` - 絞り込み対象のタグリスト（いずれかを含む場合一致）
/// * `show_deleted` - 削除済みデータを含めるかどうかのフラグ
/// * `sort_criterion` - 並び替えの基準 ("updated_at_desc", "updated_at_asc", "created_at_desc", "title_asc", "copy_count_desc")
#[tauri::command]
fn search_snippets(
    snippets: Vec<TauriSnippet>,
    search_text: String,
    selected_tags: Vec<String>,
    show_deleted: bool,
    sort_criterion: String,
) -> SearchResult {
    let start = std::time::Instant::now();
    let lower_search = search_text.trim().to_lowercase();

    let mut filtered: Vec<TauriSnippet> = snippets
        .into_iter()
        .filter(|s| {
            if s.is_deleted && !show_deleted {
                return false;
            }

            if !selected_tags.is_empty() {
                let has_matching_tag = selected_tags.iter().any(|st| s.tags.contains(st));
                if !has_matching_tag {
                    return false;
                }
            }

            if !lower_search.is_empty() {
                let matches_title = s.title.to_lowercase().contains(&lower_search);
                let matches_content = s.content.to_lowercase().contains(&lower_search);
                let matches_desc = s.description.to_lowercase().contains(&lower_search);
                let matches_id = s.id.to_string() == lower_search;
                let matches_tags = s
                    .tags
                    .iter()
                    .any(|t| t.to_lowercase().contains(&lower_search));
                return matches_title
                    || matches_content
                    || matches_desc
                    || matches_id
                    || matches_tags;
            }

            true
        })
        .collect();

    filtered.sort_by(|a, b| {
        let pin_a = if a.is_pinned { 1 } else { 0 };
        let pin_b = if b.is_pinned { 1 } else { 0 };
        if pin_b != pin_a {
            return pin_b.cmp(&pin_a);
        }

        match sort_criterion.as_str() {
            "updated_at_asc" => a.updated_at.cmp(&b.updated_at),
            "created_at_desc" => b.created_at.cmp(&a.created_at),
            "title_asc" => a.title.cmp(&b.title),
            "copy_count_desc" => b.copy_count.cmp(&a.copy_count),
            _ => b.updated_at.cmp(&a.updated_at),
        }
    });

    let elapsed = start.elapsed().as_secs_f64() * 1000.0;
    SearchResult {
        filtered_snippets: filtered,
        query_time_ms: elapsed,
    }
}

/// 既存スニペットの全体使用頻度と入力テキストとの出現スコア（タイトル重み2倍）を合算し、
/// 最適なおすすめタグ Top 5 をRust側で高速生成して返します。
///
/// # Arguments
/// * `snippets` - スニペットデータ全件
/// * `title` - 入力・編集中のタイトル
/// * `content` - 入力・編集中の本文
/// * `description` - 入力・編集中の説明文
/// * `current_tags` - 現在すでに登録されているタグ（候補から除外）
#[tauri::command]
fn suggest_tags_cmd(
    snippets: Vec<TauriSnippet>,
    title: String,
    content: String,
    description: String,
    current_tags: Vec<String>,
) -> Vec<String> {
    use std::collections::HashMap;

    let mut frequency_map: HashMap<String, usize> = HashMap::new();
    for s in &snippets {
        for t in &s.tags {
            if !t.is_empty() {
                *frequency_map.entry(t.clone()).or_insert(0) += 1;
            }
        }
    }

    let all_candidates: Vec<String> = frequency_map.keys().cloned().collect();

    let mut scored: Vec<(String, usize, usize)> = all_candidates
        .into_iter()
        .filter(|t| !current_tags.contains(t))
        .map(|tag| {
            let lower_tag = tag.to_lowercase();
            let mut text_score = 0;
            text_score += common_lib::text::count_occurrences(&title, &lower_tag) * 2;
            text_score += common_lib::text::count_occurrences(&content, &lower_tag);
            text_score += common_lib::text::count_occurrences(&description, &lower_tag);
            let freq = *frequency_map.get(&tag).unwrap_or(&0);
            (tag, text_score, freq)
        })
        .collect();

    scored.sort_by(|a, b| {
        if b.1 != a.1 {
            b.1.cmp(&a.1)
        } else if b.2 != a.2 {
            b.2.cmp(&a.2)
        } else {
            a.0.cmp(&b.0)
        }
    });

    scored.truncate(5);
    scored.into_iter().map(|(tag, _, _)| tag).collect()
}

/// 選択されたスニペットを順序通りに抽出して指定区切り文字でRust側で超高速結合します。
///
/// # Arguments
/// * `snippets` - 定型文全件データ
/// * `ordered_ids` - 結合するスニペットIDの順序配列
/// * `separator` - 結合時の区切り文字列
#[tauri::command]
fn merge_snippets(
    snippets: Vec<TauriSnippet>,
    ordered_ids: Vec<usize>,
    separator: String,
) -> String {
    let mut selected_contents = Vec::with_capacity(ordered_ids.len());
    for id in ordered_ids {
        if let Some(s) = snippets.iter().find(|item| item.id == id) {
            selected_contents.push(s.content.as_str());
        }
    }
    selected_contents.join(&separator)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 2つ目のインスタンスが起動された際、既存のメインウィンドウを最前面に表示・フォーカスさせる
            let _ = app.get_webview_window("main").map(|w| {
                let _ = w.show();
                let _ = w.set_focus();
            });
        }))
        .invoke_handler(tauri::generate_handler![
            load_snippets,
            save_snippets,
            is_storage_encrypted,
            export_snippets_json,
            import_snippets_json,
            compute_snippet_diff,
            search_snippets,
            suggest_tags_cmd,
            merge_snippets
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::{
        compute_snippet_diff, merge_snippets, search_snippets, suggest_tags_cmd, DbSnippet,
        TauriSnippet,
    };

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

        let db_back: DbSnippet = tauri.into();
        assert_eq!(db_back.id, db.id);
        assert_eq!(db_back.title, db.title);
        assert_eq!(db_back.copy_count, db.copy_count);
    }

    #[test]
    fn test_crypto_integration() {
        let original_json = r#"[{"id":1,"title":"Sample"}]"#;
        let encrypted =
            common_lib::crypto::encrypt_data(original_json, common_lib::crypto::DEFAULT_SECRET_KEY);
        assert!(common_lib::crypto::is_encrypted(&encrypted));

        let decrypted =
            common_lib::crypto::decrypt_data(&encrypted, common_lib::crypto::DEFAULT_SECRET_KEY)
                .unwrap();
        assert_eq!(decrypted, original_json);
    }

    #[test]
    fn test_tauri_snippet_deserialization_with_missing_fields() {
        let json = r#"{
            "id": 1003,
            "title": "New Snippet",
            "content": "Content",
            "createdAt": "2026-07-23 14:00:00",
            "updatedAt": "2026-07-23 14:00:00"
        }"#;
        let snippet: Result<TauriSnippet, _> = serde_json::from_str(json);
        assert!(snippet.is_ok());
        let s = snippet.unwrap();
        assert_eq!(s.id, 1003);
        assert_eq!(s.description, "");
        assert!(!s.is_pinned);
        assert_eq!(s.copy_count, 0);
        assert_eq!(s.saved_time_sec, 0);
        assert_eq!(s.tags.len(), 0);
    }

    #[test]
    fn test_compute_snippet_diff_cmd() {
        let old_text = "line1\nline2".to_string();
        let new_text = "line1\nline3".to_string();
        let diff = compute_snippet_diff(old_text, new_text);
        assert_eq!(diff.len(), 3);
        assert_eq!(diff[0].diff_type, common_lib::text::DiffType::Unchanged);
        assert_eq!(diff[0].value, "line1");
    }

    #[test]
    fn test_search_snippets_cmd() {
        let sample_a = TauriSnippet {
            id: 1,
            title: "Rust Email".to_string(),
            content: "Hello Rust".to_string(),
            description: "Desc".to_string(),
            created_at: "2026-08-01 10:00:00".to_string(),
            updated_at: "2026-08-01 10:00:00".to_string(),
            deleted_at: None,
            is_deleted: false,
            tags: vec!["mail".to_string(), "rust".to_string()],
            is_pinned: false,
            copy_count: 10,
            saved_time_sec: 100,
        };
        let sample_b = TauriSnippet {
            id: 2,
            title: "JS Note".to_string(),
            content: "Hello JS".to_string(),
            description: "Desc JS".to_string(),
            created_at: "2026-08-02 10:00:00".to_string(),
            updated_at: "2026-08-02 10:00:00".to_string(),
            deleted_at: None,
            is_deleted: false,
            tags: vec!["js".to_string()],
            is_pinned: true,
            copy_count: 2,
            saved_time_sec: 20,
        };

        let snippets = vec![sample_a, sample_b];
        let res = search_snippets(
            snippets.clone(),
            "rust".to_string(),
            vec![],
            false,
            "updated_at_desc".to_string(),
        );

        assert_eq!(res.filtered_snippets.len(), 1);
        assert_eq!(res.filtered_snippets[0].id, 1);

        let res_pin = search_snippets(
            snippets,
            "".to_string(),
            vec![],
            false,
            "updated_at_asc".to_string(),
        );

        // ピン留めされた ID: 2 がソート順（updated_at_asc）に関わらず最上位に優先される
        assert_eq!(res_pin.filtered_snippets[0].id, 2);
    }

    #[test]
    fn test_suggest_tags_cmd() {
        let snippet = TauriSnippet {
            id: 1,
            title: "Business Email".to_string(),
            content: "Content".to_string(),
            description: "".to_string(),
            created_at: "".to_string(),
            updated_at: "".to_string(),
            deleted_at: None,
            is_deleted: false,
            tags: vec!["business".to_string(), "email".to_string()],
            is_pinned: false,
            copy_count: 0,
            saved_time_sec: 0,
        };

        let suggestions = suggest_tags_cmd(
            vec![snippet],
            "Business Meeting".to_string(),
            "".to_string(),
            "".to_string(),
            vec!["email".to_string()],
        );

        assert!(suggestions.contains(&"business".to_string()));
        assert!(!suggestions.contains(&"email".to_string()));
    }

    #[test]
    fn test_merge_snippets_cmd() {
        let snippet_a = TauriSnippet {
            id: 1,
            title: "Part1".to_string(),
            content: "Hello".to_string(),
            description: "".to_string(),
            created_at: "".to_string(),
            updated_at: "".to_string(),
            deleted_at: None,
            is_deleted: false,
            tags: vec![],
            is_pinned: false,
            copy_count: 0,
            saved_time_sec: 0,
        };
        let snippet_b = TauriSnippet {
            id: 2,
            title: "Part2".to_string(),
            content: "World".to_string(),
            description: "".to_string(),
            created_at: "".to_string(),
            updated_at: "".to_string(),
            deleted_at: None,
            is_deleted: false,
            tags: vec![],
            is_pinned: false,
            copy_count: 0,
            saved_time_sec: 0,
        };

        let merged = merge_snippets(
            vec![snippet_a, snippet_b],
            vec![2, 1],
            "\n---\n".to_string(),
        );
        assert_eq!(merged, "World\n---\nHello");
    }
}
