use crate::app::SnippetManagerApp;
use crate::model::AppScreen;
use crate::theme::theme_card_frame;
use common_lib::{compute_diff, DiffType};
use eframe::egui;

impl SnippetManagerApp {
    // C. 差分比較画面の描画
    pub fn draw_compare_screen(&mut self, ui: &mut egui::Ui) {
        ui.heading("🔍 定型文の比較");
        ui.add_space(8.0);

        // 比較対象のドロップダウン選択
        ui.horizontal(|ui| {
            ui.label("比較元 (A):");
            let mut selected_a = self.compare_id_a;
            egui::ComboBox::from_id_source("compare_select_box_a")
                .selected_text(
                    selected_a
                        .and_then(|id| self.snippets.iter().find(|s| s.id == id))
                        .map(|s| s.title.as_str())
                        .unwrap_or("選択してください"),
                )
                .show_ui(ui, |ui| {
                    for s in self
                        .snippets
                        .iter()
                        .filter(|s| !s.is_deleted || Some(s.id) == self.compare_id_a)
                    {
                        ui.selectable_value(&mut selected_a, Some(s.id), &s.title);
                    }
                });
            self.compare_id_a = selected_a;

            if ui.button("⇄ 左右入れ替え").clicked() {
                std::mem::swap(&mut self.compare_id_a, &mut self.compare_id_b);
            }

            ui.label("比較先 (B):");
            let mut selected_b = self.compare_id_b;
            egui::ComboBox::from_id_source("compare_select_box_b")
                .selected_text(
                    selected_b
                        .and_then(|id| self.snippets.iter().find(|s| s.id == id))
                        .map(|s| s.title.as_str())
                        .unwrap_or("選択してください"),
                )
                .show_ui(ui, |ui| {
                    for s in self
                        .snippets
                        .iter()
                        .filter(|s| !s.is_deleted || Some(s.id) == self.compare_id_b)
                    {
                        ui.selectable_value(&mut selected_b, Some(s.id), &s.title);
                    }
                });
            self.compare_id_b = selected_b;
        });

        ui.add_space(8.0);

        let snip_a = self
            .compare_id_a
            .and_then(|id| self.snippets.iter().find(|s| s.id == id))
            .cloned();
        let snip_b = self
            .compare_id_b
            .and_then(|id| self.snippets.iter().find(|s| s.id == id))
            .cloned();

        if snip_a.is_none() || snip_b.is_none() {
            ui.colored_label(
                egui::Color32::LIGHT_RED,
                "比較する2つの定型文を選択してください。",
            );
            if ui.button("🔙 一覧に戻る").clicked() {
                self.current_screen = AppScreen::List;
            }
            return;
        }

        let snip_a = snip_a.unwrap();
        let snip_b = snip_b.unwrap();

        ui.columns(2, |columns| {
            theme_card_frame(self.settings.is_dark_mode).show(&mut columns[0], |ui| {
                ui.colored_label(
                    egui::Color32::LIGHT_BLUE,
                    format!("ID: {} (A) - 変更前", snip_a.id),
                );
                ui.strong(&snip_a.title);
                ui.small(&snip_a.description);
                ui.separator();
                ui.label("本文プレビュー:");
                egui::ScrollArea::vertical()
                    .id_source("scroll_a_view")
                    .max_height(140.0)
                    .show(ui, |ui| {
                        ui.label(&snip_a.content);
                    });
            });

            theme_card_frame(self.settings.is_dark_mode).show(&mut columns[1], |ui| {
                ui.colored_label(
                    egui::Color32::LIGHT_BLUE,
                    format!("ID: {} (B) - 変更後", snip_b.id),
                );
                ui.strong(&snip_b.title);
                ui.small(&snip_b.description);
                ui.separator();
                ui.label("本文プレビュー:");
                egui::ScrollArea::vertical()
                    .id_source("scroll_b_view")
                    .max_height(140.0)
                    .show(ui, |ui| {
                        ui.label(&snip_b.content);
                    });
            });
        });

        ui.add_space(10.0);
        ui.strong("差分分析ビューアー (LCS行比較)");

        // 差分表示エリア
        egui::ScrollArea::vertical()
            .id_source("diff_scroll_view")
            .max_height(180.0)
            .show(ui, |ui| {
                let diff_parts = compute_diff(&snip_a.content, &snip_b.content);
                theme_card_frame(self.settings.is_dark_mode).show(ui, |ui| {
                    if diff_parts.is_empty() {
                        ui.colored_label(egui::Color32::GRAY, "本文は完全に一致しています。");
                    } else {
                        for part in diff_parts {
                            match part.diff_type {
                                DiffType::Added => {
                                    ui.colored_label(
                                        egui::Color32::LIGHT_GREEN,
                                        format!("+ {}", part.value),
                                    );
                                }
                                DiffType::Removed => {
                                    ui.colored_label(
                                        egui::Color32::LIGHT_RED,
                                        format!("- {}", part.value),
                                    );
                                }
                                DiffType::Unchanged => {
                                    ui.label(format!("  {}", part.value));
                                }
                            }
                        }
                    }
                });
            });

        ui.add_space(8.0);
        if ui.button("🔙 一覧に戻る").clicked() {
            self.current_screen = AppScreen::List;
        }
    }
}
