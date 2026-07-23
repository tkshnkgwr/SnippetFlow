use crate::app::SnippetManagerApp;
use crate::model::{AppScreen, Snippet, SortCriterion};
use crate::theme::{highlight_text, theme_card_frame, theme_card_frame_ext};
use chrono::Local;
use eframe::egui;
use std::collections::HashSet;
use std::time::Instant;

impl SnippetManagerApp {
    // A. 一覧画面の描画
    pub fn draw_list_screen(&mut self, ui: &mut egui::Ui) {
        // 上部操作行
        ui.horizontal(|ui| {
            if ui.button("➕ 新規追加").clicked() {
                self.open_add_form();
            }
            ui.add_space(20.0);

            // 削除済みの表示切り替えチェックボックス
            if ui
                .checkbox(&mut self.show_deleted, "過去・削除済みを表示する")
                .changed()
            {
                if let Some(ref tag) = self.selected_tag {
                    let tag_exists = self
                        .snippets
                        .iter()
                        .filter(|s| !s.is_deleted || self.show_deleted)
                        .any(|s| s.tags.contains(tag));
                    if !tag_exists {
                        self.selected_tag = None;
                    }
                }
            }
        });

        ui.add_space(8.0);

        // 全ての一意なタグの抽出
        let mut unique_tags = HashSet::new();
        for snip in &self.snippets {
            if !snip.is_deleted || self.show_deleted {
                for tag in &snip.tags {
                    unique_tags.insert(tag.clone());
                }
            }
        }
        let mut sorted_tags: Vec<String> = unique_tags.into_iter().collect();
        sorted_tags.sort();

        // 検索フィルターエリア
        theme_card_frame(self.settings.is_dark_mode).show(ui, |ui| {
            ui.horizontal(|ui| {
                ui.label("検索:");
                ui.add(egui::TextEdit::singleline(&mut self.search_query).desired_width(200.0));
                ui.add_space(10.0);
                ui.label("タグ検索:");
                ui.add(egui::TextEdit::singleline(&mut self.tag_search_query).desired_width(150.0));
                ui.add_space(10.0);
                ui.label("並び替え:");
                let mut changed = false;
                egui::ComboBox::from_id_source("sort_criterion_select")
                    .width(180.0)
                    .selected_text(match self.settings.sort_criterion {
                        SortCriterion::UpdatedAtDesc => "更新日 (新しい順)",
                        SortCriterion::UpdatedAtAsc => "更新日 (古い順)",
                        SortCriterion::CreatedAtDesc => "作成日 (新しい順)",
                        SortCriterion::TitleAsc => "タイトル順",
                        SortCriterion::CopyCountDesc => "よく使う順 (コピー数)",
                    })
                    .show_ui(ui, |ui| {
                        changed |= ui
                            .selectable_value(
                                &mut self.settings.sort_criterion,
                                SortCriterion::UpdatedAtDesc,
                                "更新日 (新しい順)",
                            )
                            .changed();
                        changed |= ui
                            .selectable_value(
                                &mut self.settings.sort_criterion,
                                SortCriterion::UpdatedAtAsc,
                                "更新日 (古い順)",
                            )
                            .changed();
                        changed |= ui
                            .selectable_value(
                                &mut self.settings.sort_criterion,
                                SortCriterion::CreatedAtDesc,
                                "作成日 (新しい順)",
                            )
                            .changed();
                        changed |= ui
                            .selectable_value(
                                &mut self.settings.sort_criterion,
                                SortCriterion::TitleAsc,
                                "タイトル順",
                            )
                            .changed();
                        changed |= ui
                            .selectable_value(
                                &mut self.settings.sort_criterion,
                                SortCriterion::CopyCountDesc,
                                "よく使う順 (コピー数)",
                            )
                            .changed();
                    });
                if changed {
                    self.settings.save();
                }
            });

            if !sorted_tags.is_empty() {
                ui.add_space(4.0);
                ui.horizontal_wrapped(|ui| {
                    ui.label("タグ絞込:");
                    let is_all = self.selected_tag.is_none();
                    if ui.selectable_label(is_all, "すべて表示").clicked() {
                        self.selected_tag = None;
                    }
                    for tag in &sorted_tags {
                        let is_selected = self.selected_tag.as_ref() == Some(tag);
                        if ui
                            .selectable_label(is_selected, format!("#{}", tag))
                            .clicked()
                        {
                            if is_selected {
                                self.selected_tag = None;
                            } else {
                                self.selected_tag = Some(tag.clone());
                            }
                        }
                    }
                });
            }
        });

        ui.add_space(8.0);

        let start_time = Instant::now();
        let query = self.search_query.to_lowercase();
        let tag_query = self.tag_search_query.to_lowercase();

        // スニペットをフィルタリング
        let mut filtered_snippets: Vec<Snippet> = self
            .snippets
            .iter()
            .filter(|snip| {
                // 削除済みフィルタ
                if !self.show_deleted && snip.is_deleted {
                    return false;
                }

                // タグクラウド選択フィルタ
                if let Some(ref target_tag) = self.selected_tag {
                    if !snip.tags.contains(target_tag) {
                        return false;
                    }
                }

                // 検索一致
                let matches_text = query.is_empty()
                    || snip.title.to_lowercase().contains(&query)
                    || snip.content.to_lowercase().contains(&query)
                    || snip.description.to_lowercase().contains(&query);

                // タグ一致
                let matches_tag = tag_query.is_empty()
                    || snip
                        .tags
                        .iter()
                        .any(|t| t.to_lowercase().contains(&tag_query));

                matches_text && matches_tag
            })
            .cloned()
            .collect();

        // ソートの適用
        filtered_snippets.sort_by(|a, b| {
            // ピン留めされたアイテムを最優先とする
            let pin_cmp = b.is_pinned.cmp(&a.is_pinned);
            if pin_cmp != std::cmp::Ordering::Equal {
                return pin_cmp;
            }

            // 選択された基準でソート順を決定する
            match self.settings.sort_criterion {
                SortCriterion::UpdatedAtDesc => b.updated_at.cmp(&a.updated_at),
                SortCriterion::UpdatedAtAsc => a.updated_at.cmp(&b.updated_at),
                SortCriterion::CreatedAtDesc => b.created_at.cmp(&a.created_at),
                SortCriterion::TitleAsc => a.title.cmp(&b.title),
                SortCriterion::CopyCountDesc => b.copy_count.cmp(&a.copy_count),
            }
        });

        self.query_time_ms = start_time.elapsed().as_secs_f64() * 1000.0;

        // スニペット一覧表示スクロールエリア
        egui::ScrollArea::vertical().show(ui, |ui| {
            if filtered_snippets.is_empty() {
                ui.colored_label(egui::Color32::GRAY, "表示する定型文がありません。");
            } else {
                for snip in filtered_snippets {
                    theme_card_frame_ext(self.settings.is_dark_mode, snip.is_pinned).show(
                        ui,
                        |ui| {
                            ui.horizontal(|ui| {
                                // 選択チェックボックス
                                let mut is_selected = self.selected_ids.contains(&snip.id);
                                if ui.checkbox(&mut is_selected, "").changed() {
                                    if is_selected {
                                        self.selected_ids.insert(snip.id);
                                    } else {
                                        self.selected_ids.remove(&snip.id);
                                    }
                                }

                                // 削除済みスニペットは打消し・グレー表示
                                if snip.is_deleted {
                                    ui.add(
                                        egui::Label::new(format!("[削除済] {}", snip.title))
                                            .wrap(true),
                                    );
                                } else {
                                    let title_job = highlight_text(
                                        &snip.title,
                                        &self.search_query,
                                        egui::FontId::new(16.0, egui::FontFamily::Proportional),
                                        self.settings.is_dark_mode,
                                    );
                                    ui.add(egui::Label::new(title_job).wrap(true));
                                }

                                // コピー＆編集ボタンの配置
                                ui.with_layout(
                                    egui::Layout::right_to_left(egui::Align::Center),
                                    |ui| {
                                        if ui.button("✏️ 編集").clicked() {
                                            self.open_edit_form(snip.id);
                                        }
                                        if !snip.is_deleted {
                                            let pin_label = if snip.is_pinned {
                                                "📌 ピン解除"
                                            } else {
                                                "📌 ピン留め"
                                            };
                                            if ui.button(pin_label).clicked() {
                                                if let Some(target) = self
                                                    .snippets
                                                    .iter_mut()
                                                    .find(|s| s.id == snip.id)
                                                {
                                                    target.is_pinned = !target.is_pinned;
                                                    target.updated_at = Local::now()
                                                        .format("%Y-%m-%d %H:%M:%S")
                                                        .to_string();
                                                    self.save_data();
                                                }
                                            }
                                        }
                                        if ui.button("📋 コピー").clicked() {
                                            if let Some(ref mut cb) = self.clipboard {
                                                if cb.set_text(snip.content.clone()).is_ok() {
                                                    self.last_action_message =
                                                        format!("📋 コピー完了: {}", snip.title);
                                                    self.last_action_time = Some(Instant::now());

                                                    // 統計更新
                                                    if let Some(target) = self
                                                        .snippets
                                                        .iter_mut()
                                                        .find(|s| s.id == snip.id)
                                                    {
                                                        target.copy_count += 1;
                                                        let char_count =
                                                            snip.content.chars().count();
                                                        target.saved_time_sec +=
                                                            (char_count as f64 * 0.3) as u32;
                                                        self.save_data();
                                                    }
                                                }
                                            }
                                        }
                                    },
                                );
                            });

                            // 説明
                            let desc_job = highlight_text(
                                &snip.description,
                                &self.search_query,
                                egui::FontId::new(12.0, egui::FontFamily::Proportional),
                                self.settings.is_dark_mode,
                            );
                            ui.add(egui::Label::new(desc_job).wrap(true));

                            // タグ表示と日付
                            ui.horizontal(|ui| {
                                for t in &snip.tags {
                                    ui.colored_label(egui::Color32::LIGHT_BLUE, format!("#{}", t));
                                }
                                ui.with_layout(
                                    egui::Layout::right_to_left(egui::Align::Center),
                                    |ui| {
                                        ui.colored_label(
                                            egui::Color32::GRAY,
                                            format!("更新: {}", snip.updated_at),
                                        );
                                    },
                                );
                            });
                        },
                    );
                    ui.add_space(4.0);
                }
            }
        });
    }

    pub fn draw_list_footer(&mut self, ui: &mut egui::Ui) {
        ui.horizontal(|ui| {
            let select_count = self.selected_ids.len();
            ui.label(format!("選択中: {}件", select_count));

            let merge_btn_enabled = select_count >= 1;
            if ui
                .add_enabled(merge_btn_enabled, egui::Button::new("🔗 結合画面へ"))
                .clicked()
            {
                self.merge_ids = self.selected_ids.iter().cloned().collect();
                self.current_screen = AppScreen::Merge;
            }

            let compare_btn_enabled = select_count == 2;
            if ui
                .add_enabled(compare_btn_enabled, egui::Button::new("🔍 2つを比較する"))
                .clicked()
            {
                let selected_vec: Vec<usize> = self.selected_ids.iter().cloned().collect();
                self.compare_id_a = Some(selected_vec[0]);
                self.compare_id_b = Some(selected_vec[1]);
                self.current_screen = AppScreen::Compare;
            }
        });
    }
}
