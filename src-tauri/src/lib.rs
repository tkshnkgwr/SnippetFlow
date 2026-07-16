use std::fs;
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

const STORAGE_FILE: &str = "snippets.json";

#[tauri::command]
fn load_snippets() -> Result<Vec<TauriSnippet>, String> {
    if let Ok(file_content) = fs::read_to_string(STORAGE_FILE) {
        if let Ok(db_snippets) = serde_json::from_str::<Vec<DbSnippet>>(&file_content) {
            let tauri_snippets: Vec<TauriSnippet> = db_snippets.into_iter().map(TauriSnippet::from).collect();
            return Ok(tauri_snippets);
        }
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
        let _ = fs::write(STORAGE_FILE, json);
    }

    let tauri_snippets = samples.into_iter().map(TauriSnippet::from).collect();
    Ok(tauri_snippets)
}

#[tauri::command]
fn save_snippets(snippets: Vec<TauriSnippet>) -> Result<(), String> {
    let db_snippets: Vec<DbSnippet> = snippets.into_iter().map(DbSnippet::from).collect();
    let json = serde_json::to_string_pretty(&db_snippets).map_err(|e| e.to_string())?;
    fs::write(STORAGE_FILE, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn export_snippets_json(json_str: String) -> Result<(), String> {
    if let Some(path) = rfd::FileDialog::new()
        .add_filter("json", &["json"])
        .save_file()
    {
        fs::write(path, json_str).map_err(|e| e.to_string())?;
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
        Ok(content)
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
