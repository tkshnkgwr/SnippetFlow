// Windowsのリリースビルド時に追加のコンソールウィンドウが開くのを防ぐ設定（削除不可）
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    app_lib::run();
}
