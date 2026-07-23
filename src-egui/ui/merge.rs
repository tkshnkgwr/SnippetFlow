use crate::app::SnippetManagerApp;
use crate::model::{AppScreen, Snippet};
use crate::theme::theme_card_frame;
use eframe::egui;
use std::time::Instant;

impl SnippetManagerApp {
    // D. 複数結合画面の描画
    pub fn draw_merge_screen(&mut self, ui: &mut egui::Ui) {
        ui.heading("🔗 複数スニペットの結合");
        ui.add_space(8.0);

        // 戻るボタン
        if ui.button("🔙 一覧画面に戻る").clicked() {
            self.current_screen = AppScreen::List;
            return;
        }
        ui.add_space(10.0);

        let active_snippets: Vec<Snippet> = self
            .snippets
            .iter()
            .filter(|s| !s.is_deleted)
            .cloned()
            .collect();

        // 左右2カラム
        ui.columns(2, |columns| {
            // 左カラム: スニペット選択と順序調整
            columns[0].vertical(|ui| {
                theme_card_frame(self.settings.is_dark_mode).show(ui, |ui| {
                    ui.strong("1. 結合する定型文を選択");
                    ui.add_space(4.0);
                    egui::ScrollArea::vertical()
                        .id_source("merge_select_scroll")
                        .max_height(180.0)
                        .show(ui, |ui| {
                            for s in &active_snippets {
                                let mut is_selected = self.merge_ids.contains(&s.id);
                                if ui.checkbox(&mut is_selected, &s.title).changed() {
                                    if is_selected {
                                        if !self.merge_ids.contains(&s.id) {
                                            self.merge_ids.push(s.id);
                                        }
                                    } else {
                                        self.merge_ids.retain(|&x| x != s.id);
                                    }
                                }
                            }
                        });
                });

                ui.add_space(10.0);

                if !self.merge_ids.is_empty() {
                    theme_card_frame(self.settings.is_dark_mode).show(ui, |ui| {
                        ui.strong("2. 結合順序の調整");
                        ui.add_space(4.0);
                        egui::ScrollArea::vertical()
                            .id_source("merge_order_scroll")
                            .max_height(180.0)
                            .show(ui, |ui| {
                                let mut to_move_up = None;
                                let mut to_move_down = None;

                                for (idx, &id) in self.merge_ids.iter().enumerate() {
                                    if let Some(s) = self.snippets.iter().find(|x| x.id == id) {
                                        ui.horizontal(|ui| {
                                            ui.label(format!("{}. {}", idx + 1, s.title));
                                            ui.with_layout(
                                                egui::Layout::right_to_left(egui::Align::Center),
                                                |ui| {
                                                    if ui.small_button("↓").clicked()
                                                        && idx < self.merge_ids.len() - 1
                                                    {
                                                        to_move_down = Some(idx);
                                                    }
                                                    if ui.small_button("↑").clicked() && idx > 0 {
                                                        to_move_up = Some(idx);
                                                    }
                                                },
                                            );
                                        });
                                    }
                                }

                                if let Some(idx) = to_move_up {
                                    self.merge_ids.swap(idx, idx - 1);
                                }
                                if let Some(idx) = to_move_down {
                                    self.merge_ids.swap(idx, idx + 1);
                                }
                            });
                    });
                }
            });

            // 右カラム: 区切り文字選択とプレビュー・コピー
            columns[1].vertical(|ui| {
                theme_card_frame(self.settings.is_dark_mode).show(ui, |ui| {
                    ui.strong("3. 区切り文字の選択");
                    ui.add_space(4.0);
                    ui.horizontal_wrapped(|ui| {
                        if ui
                            .selectable_label(self.merge_separator == "\n\n", "改行2つ")
                            .clicked()
                        {
                            self.merge_separator = "\n\n".to_string();
                        }
                        if ui
                            .selectable_label(self.merge_separator == "\n", "改行1つ")
                            .clicked()
                        {
                            self.merge_separator = "\n".to_string();
                        }
                        if ui
                            .selectable_label(self.merge_separator == "\n---\n", "---")
                            .clicked()
                        {
                            self.merge_separator = "\n---\n".to_string();
                        }
                        if ui
                            .selectable_label(self.merge_separator == "\n===\n", "===")
                            .clicked()
                        {
                            self.merge_separator = "\n===\n".to_string();
                        }
                        if ui
                            .selectable_label(self.merge_separator == "、", "読点")
                            .clicked()
                        {
                            self.merge_separator = "、".to_string();
                        }
                        if ui
                            .selectable_label(self.merge_separator.is_empty(), "区切りなし")
                            .clicked()
                        {
                            self.merge_separator = "".to_string();
                        }
                    });
                });

                ui.add_space(10.0);

                // 結合されたテキストの構築
                let mut merged_text = String::new();
                let selected_contents: Vec<String> = self
                    .merge_ids
                    .iter()
                    .filter_map(|&id| {
                        self.snippets
                            .iter()
                            .find(|x| x.id == id)
                            .map(|x| x.content.clone())
                    })
                    .collect();
                if !selected_contents.is_empty() {
                    merged_text = selected_contents.join(&self.merge_separator);
                }

                theme_card_frame(self.settings.is_dark_mode).show(ui, |ui| {
                    ui.strong("4. プレビューとコピー");
                    ui.add_space(4.0);
                    if ui.button("📋 結合してコピー").clicked() && !merged_text.is_empty()
                    {
                        if let Some(ref mut cb) = self.clipboard {
                            if cb.set_text(merged_text.clone()).is_ok() {
                                self.last_action_message =
                                    "📋 結合コピーが完了しました！".to_string();
                                self.last_action_time = Some(Instant::now());

                                // 結合された各スニペットの使用統計を更新する
                                for &id in &self.merge_ids {
                                    if let Some(target) =
                                        self.snippets.iter_mut().find(|s| s.id == id)
                                    {
                                        target.copy_count += 1;
                                        let char_count = target.content.chars().count();
                                        target.saved_time_sec += (char_count as f64 * 0.3) as u32;
                                    }
                                }
                                self.save_data();
                            }
                        }
                    }
                    ui.add_space(4.0);
                    egui::ScrollArea::vertical()
                        .id_source("merge_preview_scroll")
                        .max_height(140.0)
                        .show(ui, |ui| {
                            if merged_text.is_empty() {
                                ui.colored_label(
                                    egui::Color32::GRAY,
                                    "結合する定型文を選択してください。",
                                );
                            } else {
                                ui.label(&merged_text);
                            }
                        });
                });
            });
        });
    }
}
