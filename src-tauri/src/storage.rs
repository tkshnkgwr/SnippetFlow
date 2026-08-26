use std::fs;
use std::path::PathBuf;
use tauri::Manager;

use crate::models::{DbSnippet, TauriSnippet};

/// 一時ファイルを経由したアトミック保存処理。Windowsでの上書き移動失敗に対する保護を含みます。
pub fn atomic_write<P: AsRef<std::path::Path>>(path: P, content: &str) -> Result<(), String> {
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
pub fn get_storage_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir の取得に失敗: {e}"))?;
    fs::create_dir_all(&data_dir).map_err(|e| format!("データディレクトリの作成に失敗: {e}"))?;
    Ok(data_dir.join("snippets.json"))
}

/// ローカルストレージ（snippets.json）からスニペット一覧を読み込みます。
/// 暗号化されている場合は透過的に復号し、存在しない/破損時はデフォルトサンプルを復元生成します。
#[tauri::command]
pub fn load_snippets(app: tauri::AppHandle) -> Result<Vec<TauriSnippet>, String> {
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

/// スニペット全件データをアトミックに保存します。必要に応じて暗号化保存を適用します。
///
/// # Arguments
/// * snippets - 保存するスニペット配列
/// * ncrypt - 明示的な暗号化フラグ（指定なしの場合は既存ファイルの保存状態を維持）
#[tauri::command]
pub fn save_snippets(
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

/// 現在の snippets.json が暗号化保存されているかを判定して返します。
#[tauri::command]
pub fn is_storage_encrypted(app: tauri::AppHandle) -> Result<bool, String> {
    let path = get_storage_path(&app)?;
    if let Ok(content) = fs::read_to_string(&path) {
        Ok(common_lib::crypto::is_encrypted(&content))
    } else {
        Ok(false)
    }
}

/// OSネイティブの保存ダイアログを表示し、スニペットのJSONデータをローカルファイルへ保存します。
#[tauri::command]
pub fn export_snippets_json(json_str: String) -> Result<(), String> {
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

/// OSネイティブのファイル選択ダイアログを表示し、選択されたJSONファイルをインポート用に読み込みます。
/// （暗号化ファイルの場合は透過的に復号して返します）
#[tauri::command]
pub fn import_snippets_json() -> Result<String, String> {
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

#[cfg(test)]
mod tests {
    #[test]
    fn test_crypto_integration() {
        let plain = "Hello SnippetFlow";
        let encrypted =
            common_lib::crypto::encrypt_data(plain, common_lib::crypto::DEFAULT_SECRET_KEY);
        assert!(common_lib::crypto::is_encrypted(&encrypted));

        let decrypted =
            common_lib::crypto::decrypt_data(&encrypted, common_lib::crypto::DEFAULT_SECRET_KEY)
                .expect("Decryption failed");
        assert_eq!(decrypted, plain);
    }
}
