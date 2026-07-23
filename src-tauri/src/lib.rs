use std::fs;
use std::path::PathBuf;
use tauri::Manager;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DbSnippet {
    pub id: usize,
    pub title: String,
    pub content: String,
    pub description: String,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub is_deleted: bool,
    pub tags: Vec<String>,
    #[serde(default)]
    pub is_pinned: bool,
    #[serde(default)]
    pub copy_count: u32,
    #[serde(default)]
    pub saved_time_sec: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TauriSnippet {
    pub id: usize,
    pub title: String,
    pub content: String,
    pub description: String,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub is_deleted: bool,
    pub tags: Vec<String>,
    pub is_pinned: bool,
    pub copy_count: u32,
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
            import_snippets_json
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
}
