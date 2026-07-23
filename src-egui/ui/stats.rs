use crate::app::SnippetManagerApp;
use crate::model::{AppScreen, Snippet};
use crate::theme::theme_card_frame;
use chrono::Local;
use eframe::egui;
use std::time::Instant;

impl SnippetManagerApp {
    // E. 性能モニター画面の描画
    pub fn draw_performance_screen(&mut self, ui: &mut egui::Ui) {
        ui.heading("📊 性能メーター & テスト");
        ui.add_space(8.0);

        let total_count = self.snippets.len();
        let active_count = self.snippets.iter().filter(|s| !s.is_deleted).count();
        let deleted_count = total_count - active_count;

        // 推測されるJSONサイズ
        let json_size = serde_json::to_string(&self.snippets)
            .map(|s| s.len())
            .unwrap_or(0);
        let kb_size = json_size as f64 / 1024.0;

        theme_card_frame(self.settings.is_dark_mode).show(ui, |ui| {
            ui.strong("データベース・メトリクス情報");
            ui.add_space(4.0);
            ui.label(format!(
                "総定型文数: {} 件 (有効: {} / 削除済: {})",
                total_count, active_count, deleted_count
            ));
            ui.label(format!("推定JSONファイルサイズ: {:.2} KB", kb_size));
            ui.label(format!(
                "直近の検索クエリ時間: {:.4} ms",
                self.query_time_ms
            ));

            ui.add_space(4.0);
            ui.horizontal(|ui| {
                if ui.button("⚡ 100回平均ベンチマーク実行").clicked() {
                    let start = Instant::now();
                    for _ in 0..100 {
                        let _temp: Vec<&Snippet> = self
                            .snippets
                            .iter()
                            .filter(|s| !s.is_deleted)
                            .filter(|s| s.title.contains("自動生成") || s.content.contains("調整"))
                            .collect();
                    }
                    let elapsed = start.elapsed().as_secs_f64() * 1000.0 / 100.0;
                    self.bench_time_ms = Some(elapsed);
                }

                if let Some(bench) = self.bench_time_ms {
                    ui.label(format!("平均速度: {:.4} ms", bench));
                }
            });
        });

        ui.add_space(10.0);

        let total_copies: u32 = self.snippets.iter().map(|s| s.copy_count).sum();
        let total_saved_sec: u32 = self.snippets.iter().map(|s| s.saved_time_sec).sum();

        let format_saved_time = |total_seconds: u32| -> String {
            let hours = total_seconds / 3600;
            let minutes = (total_seconds % 3600) / 60;
            let seconds = total_seconds % 60;
            if hours > 0 {
                format!("{} 時間 {} 分 {} 秒", hours, minutes, seconds)
            } else if minutes > 0 {
                format!("{} 分 {} 秒", minutes, seconds)
            } else {
                format!("{} 秒", seconds)
            }
        };

        let mut ranked_snippets = self.snippets.clone();
        ranked_snippets.sort_by_key(|b| std::cmp::Reverse(b.copy_count));
        let top_snippets: Vec<&Snippet> = ranked_snippets
            .iter()
            .filter(|s| s.copy_count > 0)
            .take(3)
            .collect();

        theme_card_frame(self.settings.is_dark_mode).show(ui, |ui| {
            ui.strong("📈 使用統計 (アナリティクス)");
            ui.add_space(4.0);
            ui.label(format!("総コピー回数: {} 回", total_copies));
            ui.label(format!(
                "累計短縮時間: {}",
                format_saved_time(total_saved_sec)
            ));
            ui.label("※1文字あたり0.3秒のタイピング時間を想定");

            ui.add_space(6.0);
            ui.strong("よく使う定型文トップ3:");
            if !top_snippets.is_empty() {
                for (i, snip) in top_snippets.iter().enumerate() {
                    ui.label(format!(
                        "{}. {} ({}回コピー / 短縮: {})",
                        i + 1,
                        snip.title,
                        snip.copy_count,
                        format_saved_time(snip.saved_time_sec)
                    ));
                }
            } else {
                ui.label("まだコピーされた定型文はありません。");
            }
        });

        ui.add_space(10.0);

        theme_card_frame(self.settings.is_dark_mode).show(ui, |ui| {
            ui.strong("大量データ負荷テスト（ダミー生成）");
            ui.add_space(4.0);
            ui.label("件数が増えた際、メモリ検索の速度や描画負荷がどう変化するか検証できます。");
            ui.add_space(4.0);
            ui.horizontal(|ui| {
                if ui.button("+1,000件追加").clicked() {
                    self.generate_mock_snippets(1000);
                }
                if ui.button("+2,000件追加").clicked() {
                    self.generate_mock_snippets(2000);
                }
                if ui.button("+5,000件追加").clicked() {
                    self.generate_mock_snippets(5000);
                }
                if total_count > 0 && ui.button("ダミーデータ一括削除").clicked() {
                    self.clear_mock_snippets();
                }
            });
        });

        ui.add_space(10.0);

        theme_card_frame(self.settings.is_dark_mode).show(ui, |ui| {
            ui.strong("JSONデータベースバックアップ & 復元");
            ui.add_space(4.0);
            ui.horizontal(|ui| {
                if ui.button("📤 JSONエクスポート").clicked() {
                    self.export_json_dialog();
                }
                if ui.button("📥 JSONインポート").clicked() {
                    self.import_json_dialog();
                }
            });
        });

        ui.separator();
        ui.add_space(8.0);
        if ui.button("🔙 一覧に戻る").clicked() {
            self.current_screen = AppScreen::List;
        }
    }

    pub fn generate_mock_snippets(&mut self, count: usize) {
        let now_str = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let start_id = self.snippets.iter().map(|s| s.id).max().unwrap_or(2000) + 1;

        for i in 0..count {
            self.snippets.push(Snippet {
                id: start_id + i,
                title: format!("【自動生成】テストデータタイトル #{}", start_id + i),
                content: format!(
                    "これはダミーの本文データです。インクリメンタル検索のテスト用。シリアル: SN-{}",
                    100000 + i
                ),
                description: format!("シミュレーション用データ #{} (テスト用)", i + 1),
                created_at: now_str.clone(),
                updated_at: now_str.clone(),
                deleted_at: None,
                is_deleted: false,
                tags: vec!["テストデータ".to_string(), "自動生成".to_string()],
                is_pinned: false,
                copy_count: 0,
                saved_time_sec: 0,
            });
        }
        self.save_data();
        self.last_action_message = format!("✅ ダミーデータを {}件 追加しました。", count);
        self.last_action_time = Some(Instant::now());
    }

    pub fn clear_mock_snippets(&mut self) {
        self.snippets.retain(|s| s.id < 2000);
        self.save_data();
        self.last_action_message = "🗑️ 生成したダミーデータを一括削除しました。".to_string();
        self.last_action_time = Some(Instant::now());
    }

    pub fn export_json_dialog(&mut self) {
        if let Some(path) = rfd::FileDialog::new()
            .add_filter("json", &["json"])
            .set_file_name("定型文バックアップ.json")
            .save_file()
        {
            if let Ok(json) = serde_json::to_string_pretty(&self.snippets) {
                if std::fs::write(&path, json).is_ok() {
                    self.last_action_message =
                        format!("📤 保存しました: {}", path.to_string_lossy());
                    self.last_action_time = Some(Instant::now());
                }
            }
        }
    }

    pub fn import_json_dialog(&mut self) {
        if let Some(path) = rfd::FileDialog::new()
            .add_filter("json", &["json"])
            .pick_file()
        {
            if let Ok(content) = std::fs::read_to_string(&path) {
                if let Ok(parsed) = serde_json::from_str::<Vec<Snippet>>(&content) {
                    self.snippets = parsed;
                    self.save_data();
                    self.last_action_message =
                        format!("📥 読み込みました: {}件", self.snippets.len());
                    self.last_action_time = Some(Instant::now());
                } else {
                    self.last_action_message = "❌ JSONファイルの解析に失敗しました。".to_string();
                    self.last_action_time = Some(Instant::now());
                }
            }
        }
    }
}
