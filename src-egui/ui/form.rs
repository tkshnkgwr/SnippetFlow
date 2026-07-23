use crate::app::SnippetManagerApp;
use crate::model::{AppScreen, Snippet};
use crate::theme::theme_card_frame;
use chrono::Local;
use eframe::egui;
use std::time::Instant;

impl SnippetManagerApp {
    // B. 追加・編集（変更）画面の描画
    pub fn draw_edit_form(&mut self, ui: &mut egui::Ui, edit_id: Option<usize>) {
        if edit_id.is_some() {
            ui.heading("✏️ 定型文の編集・削除");
        } else {
            ui.heading("➕ 新規定型文の追加");
        }
        ui.add_space(8.0);

        if let Some(id) = edit_id {
            if let Some(snip) = self.snippets.iter().find(|s| s.id == id) {
                theme_card_frame(self.settings.is_dark_mode).show(ui, |ui| {
                    ui.horizontal(|ui| {
                        ui.label(format!("ID: {}", snip.id));
                        ui.label(format!("作成日: {}", snip.created_at));
                        ui.label(format!("更新日: {}", snip.updated_at));
                    });
                });
                ui.add_space(4.0);
            }
        }

        egui::ScrollArea::vertical()
            .max_height(420.0)
            .show(ui, |ui| {
                egui::Grid::new("edit_form_grid")
                    .num_columns(2)
                    .spacing([12.0, 12.0])
                    .min_row_height(28.0)
                    .show(ui, |ui| {
                        ui.label("タイトル:");
                        ui.add(
                            egui::TextEdit::singleline(&mut self.form_title)
                                .desired_width(f32::INFINITY),
                        );
                        ui.end_row();

                        ui.label("本文:");
                        ui.add(
                            egui::TextEdit::multiline(&mut self.form_content)
                                .desired_width(f32::INFINITY)
                                .desired_rows(12),
                        );
                        ui.end_row();

                        ui.label("説明文:");
                        ui.add(
                            egui::TextEdit::singleline(&mut self.form_description)
                                .desired_width(f32::INFINITY),
                        );
                        ui.end_row();

                        ui.label("タグ追加:");
                        ui.horizontal(|ui| {
                            ui.add(
                                egui::TextEdit::singleline(&mut self.tag_input)
                                    .desired_width(200.0),
                            );
                            if ui.button("➕ 追加").clicked() && !self.tag_input.is_empty() {
                                if !self.form_tags.contains(&self.tag_input) {
                                    self.form_tags.push(self.tag_input.clone());
                                }
                                self.tag_input.clear();
                            }
                        });
                        ui.end_row();
                    });
                ui.add_space(8.0);

                // おすすめタグ推薦表示
                let suggestions = self.get_suggested_tags();
                if !suggestions.is_empty() {
                    ui.horizontal(|ui| {
                        ui.colored_label(egui::Color32::from_rgb(251, 191, 36), "💡 おすすめ:");
                        for (tag, score) in suggestions {
                            if ui.button(format!("#{} ({})", tag, score)).clicked()
                                && !self.form_tags.contains(&tag)
                            {
                                self.form_tags.push(tag);
                            }
                        }
                    });
                    ui.add_space(6.0);
                }

                // 付与予定タグ一覧
                if !self.form_tags.is_empty() {
                    ui.horizontal(|ui| {
                        ui.label("登録タグ (クリックで除外):");
                        let mut tag_to_remove = None;
                        for (idx, t) in self.form_tags.iter().enumerate() {
                            if ui.button(format!("#{} ×", t)).clicked() {
                                tag_to_remove = Some(idx);
                            }
                        }
                        if let Some(idx) = tag_to_remove {
                            self.form_tags.remove(idx);
                        }
                    });
                }
            });

        ui.separator();
        ui.add_space(8.0);

        // ボタン操作部
        ui.horizontal(|ui| {
            // 保存処理
            if ui.button("💾 保存する").clicked() && !self.form_title.is_empty() {
                let now_str = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

                if let Some(id) = edit_id {
                    // 編集更新
                    if let Some(snip) = self.snippets.iter_mut().find(|s| s.id == id) {
                        snip.title = self.form_title.clone();
                        snip.content = self.form_content.clone();
                        snip.description = self.form_description.clone();
                        snip.tags = self.form_tags.clone();
                        snip.updated_at = now_str;
                    }
                    self.last_action_message = "✅ 定型文を更新保存しました。".to_string();
                } else {
                    // 新規追加
                    let new_id = self.snippets.iter().map(|s| s.id).max().unwrap_or(0) + 1;
                    let new_snip = Snippet {
                        id: new_id,
                        title: self.form_title.clone(),
                        content: self.form_content.clone(),
                        description: self.form_description.clone(),
                        created_at: now_str.clone(),
                        updated_at: now_str,
                        deleted_at: None,
                        is_deleted: false,
                        tags: self.form_tags.clone(),
                        is_pinned: false,
                        copy_count: 0,
                        saved_time_sec: 0,
                    };
                    self.snippets.push(new_snip);
                    self.last_action_message = "✅ 新しい定型文を追加しました。".to_string();
                }

                self.save_data();
                self.last_action_time = Some(Instant::now());
                self.current_screen = AppScreen::List;
            }

            // キャンセル戻る
            if ui.button("❌ キャンセル").clicked() {
                self.current_screen = AppScreen::List;
            }

            // 削除ボタン (既存の編集時のみ有効)
            if let Some(id) = edit_id {
                let is_deleted = self
                    .snippets
                    .iter()
                    .find(|s| s.id == id)
                    .map(|s| s.is_deleted)
                    .unwrap_or(false);
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    if !is_deleted {
                        if ui.button("🗑️ 定型文を削除").clicked() {
                            let now_str = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
                            if let Some(snip) = self.snippets.iter_mut().find(|s| s.id == id) {
                                snip.is_deleted = true;
                                snip.deleted_at = Some(now_str.clone());
                                snip.updated_at = now_str;
                            }
                            self.selected_ids.remove(&id); // 選択状態からも除外
                            self.save_data();
                            self.last_action_message = "🗑️ 定型文を削除しました。".to_string();
                            self.last_action_time = Some(Instant::now());
                            self.current_screen = AppScreen::List;
                        }
                    } else {
                        if ui.button("🗑️ 完全に削除する").clicked() {
                            self.snippets.retain(|s| s.id != id);
                            self.selected_ids.remove(&id);
                            self.save_data();
                            self.last_action_message = "🗑️ 定型文を永久削除しました。".to_string();
                            self.last_action_time = Some(Instant::now());
                            self.current_screen = AppScreen::List;
                        }
                        if ui.button("🔄 アーカイブから復元").clicked() {
                            let now_str = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
                            if let Some(snip) = self.snippets.iter_mut().find(|s| s.id == id) {
                                snip.is_deleted = false;
                                snip.deleted_at = None;
                                snip.updated_at = now_str;
                            }
                            self.save_data();
                            self.last_action_message = "🔄 定型文を復元しました。".to_string();
                            self.last_action_time = Some(Instant::now());
                            self.current_screen = AppScreen::List;
                        }
                    }
                });
            }
        });
    }
}
