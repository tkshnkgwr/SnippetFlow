use crate::app::SnippetManagerApp;
use crate::model::{AppScreen, Snippet, SortCriterion};
use crate::theme::{highlight_text, theme_card_frame, theme_card_frame_ext};
use chrono::Local;
use common_lib::{compute_diff, DiffType};
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
