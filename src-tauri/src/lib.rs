//! # SnippetFlow バックエンドライブラリ
//!
//! Windowsデスクトップ向けの定型文クリップボードマネージャー「SnippetFlow」の
//! Rustバックエンド実装モジュール群です。
//!
//! ## モジュール構成
//! - [`models`][]: スニペットデータ構造、検索結果、統計情報の定義
//! - [`storage`][]: JSONストレージの読み書き、透過的暗号化、インポート/エクスポート
//! - [`operations`][]: 高速LCS差分比較、テキスト検索、タグ推薦、マージ、性能ベンチマーク

use tauri::Manager;

pub mod models;
pub mod operations;
pub mod storage;

pub use models::*;
pub use operations::*;
pub use storage::*;

/// Tauriアプリケーションのエントリポイント。
/// 二重起動防止プラグインの登録、IPCコマンドのバインド、およびハンドラーの起動を行います。
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
            storage::load_snippets,
            storage::save_snippets,
            storage::is_storage_encrypted,
            storage::export_snippets_json,
            storage::import_snippets_json,
            operations::compute_snippet_diff,
            operations::search_snippets,
            operations::suggest_tags_cmd,
            operations::merge_snippets,
            operations::generate_mock_snippets,
            operations::get_snippet_stats,
            operations::benchmark_search
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
