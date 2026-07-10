use crate::model::{AppScreen, AppSettings, Snippet};
use eframe::egui;
use std::collections::HashSet;
use std::time::{Duration, Instant};

pub struct SnippetManagerApp {
    pub snippets: Vec<Snippet>,

    // 画面遷移管理
    pub current_screen: AppScreen,

    // 一覧画面用検索条件
    pub search_query: String,
    pub tag_search_query: String,
    pub show_deleted: bool,

    // タグクラウド選択フィルタ
    pub selected_tag: Option<String>,

    // 複数選択
    pub selected_ids: HashSet<usize>,

    // アプリ設定 (テーマ等)
    pub settings: AppSettings,

    // 追加・編集フォーム用の一時変数
    pub form_title: String,
    pub form_content: String,
    pub form_description: String,
    pub form_tags: Vec<String>,
    pub tag_input: String,

    // クリップボードとフィードバック
    pub last_action_message: String,
    pub last_action_time: Option<Instant>,
    pub clipboard: Option<arboard::Clipboard>,

    // 比較画面用
    pub compare_id_a: Option<usize>,
    pub compare_id_b: Option<usize>,

    // 結合画面用
    pub merge_ids: Vec<usize>,
    pub merge_separator: String,

    // 性能モニター用
    pub query_time_ms: f64,
    pub bench_time_ms: Option<f64>,
    pub initialized: bool,
}

impl Default for SnippetManagerApp {
    fn default() -> Self {
        Self {
            snippets: Self::load_data(),
            current_screen: AppScreen::List,
            search_query: "".to_string(),
            tag_search_query: "".to_string(),
            show_deleted: false,
            selected_tag: None,
            selected_ids: HashSet::new(),
            settings: AppSettings::load(),
            form_title: "".to_string(),
            form_content: "".to_string(),
            form_description: "".to_string(),
            form_tags: Vec::new(),
            tag_input: "".to_string(),
            last_action_message: "".to_string(),
            last_action_time: None,
            clipboard: arboard::Clipboard::new().ok(),
            compare_id_a: None,
            compare_id_b: None,
            merge_ids: Vec::new(),
            merge_separator: "\n\n".to_string(),
            query_time_ms: 0.0,
            bench_time_ms: None,
            initialized: false,
        }
    }
}

impl SnippetManagerApp {
    // フォームの初期化 (追加用)
    pub fn open_add_form(&mut self) {
        self.form_title.clear();
        self.form_content.clear();
        self.form_description.clear();
        self.form_tags.clear();
        self.tag_input.clear();
        self.current_screen = AppScreen::Add;
    }

    // フォームへのロード (編集用)
    pub fn open_edit_form(&mut self, id: usize) {
        if let Some(snippet) = self.snippets.iter().find(|s| s.id == id) {
            self.form_title = snippet.title.clone();
            self.form_content = snippet.content.clone();
            self.form_description = snippet.description.clone();
            self.form_tags = snippet.tags.clone();
            self.tag_input.clear();
            self.current_screen = AppScreen::Edit(id);
        }
    }

    // 既存タグからのおすすめタグ推薦アルゴリズム (common_lib の共有関数を利用)
    pub fn get_suggested_tags(&self) -> Vec<(String, usize)> {
        let mut all_tags = HashSet::new();
        for snippet in &self.snippets {
            for tag in &snippet.tags {
                all_tags.insert(tag.clone());
            }
        }
        let existing_tags: Vec<String> = all_tags.into_iter().collect();

        common_lib::suggest_tags(
            &self.form_title,
            &self.form_content,
            &self.form_description,
            &existing_tags,
            &self.form_tags,
        )
    }
}

impl eframe::App for SnippetManagerApp {
    fn update(&mut self, ctx: &egui::Context, frame: &mut eframe::Frame) {
        // 初回フレームのみサイズキャッシュを無視して強制的に 1000x900 に変更
        if !self.initialized {
            frame.set_window_size(egui::vec2(1000.0, 900.0));
            self.initialized = true;
        }

        // 低リソース動作のため、1秒に1回の描画更新に制限
        ctx.request_repaint_after(Duration::from_millis(1000));

        // コピー完了メッセージの時間制限クリア (3秒)
        if let Some(time) = self.last_action_time {
            if time.elapsed() > Duration::from_secs(3) {
                self.last_action_message.clear();
                self.last_action_time = None;
            }
        }

        // テーマの動的適用
        ctx.set_visuals(if self.settings.is_dark_mode {
            egui::Visuals::dark()
        } else {
            let mut visuals = egui::Visuals::light();
            visuals.widgets.noninteractive.bg_fill = egui::Color32::from_rgb(255, 255, 255);
            visuals.widgets.inactive.bg_fill = egui::Color32::from_rgb(248, 250, 252);
            visuals.widgets.hovered.bg_fill = egui::Color32::from_rgb(241, 245, 249);
            visuals.widgets.active.bg_fill = egui::Color32::from_rgb(226, 232, 240);
            visuals.window_fill = egui::Color32::WHITE;
            visuals.window_stroke =
                egui::Stroke::new(1.0_f32, egui::Color32::from_rgb(226, 232, 240));
            visuals
        });

        // 太字・視認性の高いカスタムフォント設定
        let mut visual_style = (*ctx.style()).clone();
        visual_style.text_styles.insert(
            egui::TextStyle::Heading,
            egui::FontId::new(22.0, egui::FontFamily::Proportional),
        );
        visual_style.text_styles.insert(
            egui::TextStyle::Body,
            egui::FontId::new(16.0, egui::FontFamily::Proportional),
        );
        visual_style.text_styles.insert(
            egui::TextStyle::Button,
            egui::FontId::new(16.0, egui::FontFamily::Proportional),
        );
        ctx.set_style(visual_style);

        // 常時最前面、背景透過コンテナ (テーマに応じて切り替え)
        let panel_color = if self.settings.is_dark_mode {
            egui::Color32::from_rgba_unmultiplied(15, 23, 42, 230) // Slate 900
        } else {
            egui::Color32::from_rgba_unmultiplied(255, 255, 255, 245) // 純白に近い透過
        };

        let panel_frame = egui::Frame::none().fill(panel_color).inner_margin(8.0);

        // ヘッダー固定パネル
        egui::TopBottomPanel::top("top_panel")
            .frame(panel_frame)
            .show(ctx, |ui| {
                // ヘッダー UI
                ui.horizontal(|ui| {
                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        // テーマ切り替えボタン
                        let theme_btn_label = if self.settings.is_dark_mode {
                            "☀ ライトモード"
                        } else {
                            "🌙 ダークモード"
                        };
                        if ui.button(theme_btn_label).clicked() {
                            self.settings.is_dark_mode = !self.settings.is_dark_mode;
                            self.settings.save();
                        }
                    });
                });

                ui.add_space(4.0);

                // ナビゲーションタブ
                ui.horizontal(|ui| {
                    if ui
                        .selectable_label(self.current_screen == AppScreen::List, "定型文一覧")
                        .clicked()
                    {
                        self.current_screen = AppScreen::List;
                    }
                    if ui
                        .selectable_label(self.current_screen == AppScreen::Add, "新規登録")
                        .clicked()
                    {
                        self.open_add_form();
                    }
                    if ui
                        .selectable_label(self.current_screen == AppScreen::Compare, "差分比較")
                        .clicked()
                    {
                        if self.compare_id_a.is_none() || self.compare_id_b.is_none() {
                            let active_ids: Vec<usize> = self
                                .snippets
                                .iter()
                                .filter(|s| !s.is_deleted)
                                .map(|s| s.id)
                                .take(2)
                                .collect();
                            if !active_ids.is_empty() {
                                self.compare_id_a = Some(active_ids[0]);
                                self.compare_id_b =
                                    Some(*active_ids.get(1).unwrap_or(&active_ids[0]));
                            }
                        }
                        self.current_screen = AppScreen::Compare;
                    }
                    if ui
                        .selectable_label(self.current_screen == AppScreen::Merge, "複数結合")
                        .clicked()
                    {
                        if self.merge_ids.is_empty() {
                            let active_ids: Vec<usize> = self
                                .snippets
                                .iter()
                                .filter(|s| !s.is_deleted)
                                .map(|s| s.id)
                                .take(2)
                                .collect();
                            self.merge_ids = active_ids;
                        }
                        self.current_screen = AppScreen::Merge;
                    }
                    if ui
                        .selectable_label(
                            self.current_screen == AppScreen::Performance,
                            "性能メーター",
                        )
                        .clicked()
                    {
                        self.current_screen = AppScreen::Performance;
                    }
                });

                ui.separator();
            });

        // フッター固定パネル
        let show_footer = self.current_screen == AppScreen::List && !self.selected_ids.is_empty();
        if show_footer || !self.last_action_message.is_empty() {
            egui::TopBottomPanel::bottom("bottom_panel")
                .frame(panel_frame)
                .show(ctx, |ui| {
                    // コピー完了通知エリア
                    if !self.last_action_message.is_empty() {
                        ui.colored_label(egui::Color32::LIGHT_GREEN, &self.last_action_message);
                        ui.add_space(4.0);
                    }
                    if self.current_screen == AppScreen::List {
                        self.draw_list_footer(ui);
                    }
                });
        }

        // メインコンテンツエリア
        egui::CentralPanel::default()
            .frame(egui::Frame::none().fill(panel_color).inner_margin(8.0))
            .show(ctx, |ui| {
                // 画面別の描画分岐
                match self.current_screen {
                    AppScreen::List => self.draw_list_screen(ui),
                    AppScreen::Add => self.draw_edit_form(ui, None),
                    AppScreen::Edit(id) => self.draw_edit_form(ui, Some(id)),
                    AppScreen::Compare => self.draw_compare_screen(ui),
                    AppScreen::Merge => self.draw_merge_screen(ui),
                    AppScreen::Performance => self.draw_performance_screen(ui),
                }
            });
    }
}
