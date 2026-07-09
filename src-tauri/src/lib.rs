use std::fs;
use tauri::Manager;

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
