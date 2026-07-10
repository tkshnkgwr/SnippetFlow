use eframe::egui;

pub fn setup_custom_fonts(ctx: &egui::Context) {
    let mut fonts = egui::FontDefinitions::default();

    // Windowsの標準日本語フォント候補をロード
    let font_paths = [
        "C:\\Windows\\Fonts\\meiryo.ttc",
        "C:\\Windows\\Fonts\\msgothic.ttc",
        "C:\\Windows\\Fonts\\msjh.ttc",
    ];
    let mut loaded_data = None;
    for path in &font_paths {
        if let Ok(data) = std::fs::read(path) {
            loaded_data = Some(data);
            break;
        }
    }

    if let Some(font_data) = loaded_data {
        fonts.font_data.insert(
            "japanese_font".to_owned(),
            egui::FontData::from_owned(font_data),
        );

        // 比例幅フォントの優先登録
        if let Some(vec) = fonts.families.get_mut(&egui::FontFamily::Proportional) {
            vec.insert(0, "japanese_font".to_owned());
        }
        // 等幅フォントの優先登録
        if let Some(vec) = fonts.families.get_mut(&egui::FontFamily::Monospace) {
            vec.insert(0, "japanese_font".to_owned());
        }
    }

    ctx.set_fonts(fonts);
}

pub fn theme_card_frame(is_dark: bool) -> egui::Frame {
    let bg = if is_dark {
        egui::Color32::from_rgb(30, 41, 59) // Slate 800
    } else {
        egui::Color32::from_rgb(255, 255, 255) // 純白
    };
    let stroke = if is_dark {
        egui::Stroke::new(1.0, egui::Color32::from_rgb(51, 65, 85)) // Slate 700
    } else {
        egui::Stroke::new(1.0, egui::Color32::from_rgb(226, 232, 240)) // Slate 200
    };
    egui::Frame::none()
        .fill(bg)
        .stroke(stroke)
        .rounding(8.0)
        .inner_margin(10.0)
}

pub fn theme_card_frame_ext(is_dark: bool, is_pinned: bool) -> egui::Frame {
    let bg = if is_dark {
        if is_pinned {
            egui::Color32::from_rgb(30, 41, 70) // Pinned (slightly blue slate)
        } else {
            egui::Color32::from_rgb(30, 41, 59) // Slate 800
        }
    } else {
        if is_pinned {
            egui::Color32::from_rgb(240, 244, 255) // Pinned (soft Indigo/Blue)
        } else {
            egui::Color32::from_rgb(255, 255, 255) // 純白
        }
    };
    let stroke = if is_pinned {
        egui::Stroke::new(1.5, egui::Color32::from_rgb(99, 102, 241)) // Indigo 500
    } else if is_dark {
        egui::Stroke::new(1.0, egui::Color32::from_rgb(51, 65, 85)) // Slate 700
    } else {
        egui::Stroke::new(1.0, egui::Color32::from_rgb(226, 232, 240)) // Slate 200
    };
    egui::Frame::none()
        .fill(bg)
        .stroke(stroke)
        .rounding(8.0)
        .inner_margin(10.0)
}

pub fn highlight_text(
    text: &str,
    query: &str,
    font_id: egui::FontId,
    is_dark_mode: bool,
) -> egui::text::LayoutJob {
    let mut job = egui::text::LayoutJob::default();

    let normal_color = if is_dark_mode {
        egui::Color32::from_rgb(220, 225, 235)
    } else {
        egui::Color32::from_rgb(15, 23, 42)
    };
    let normal_format = egui::TextFormat {
        font_id: font_id.clone(),
        color: normal_color,
        ..Default::default()
    };

    let highlight_bg = if is_dark_mode {
        egui::Color32::from_rgb(234, 179, 8) // 黄色 (dark)
    } else {
        egui::Color32::from_rgb(254, 240, 138) // 薄い黄色 (light)
    };
    let highlight_color = if is_dark_mode {
        egui::Color32::BLACK
    } else {
        egui::Color32::from_rgb(133, 77, 14)
    };
    let highlight_format = egui::TextFormat {
        font_id,
        color: highlight_color,
        background: highlight_bg,
        ..Default::default()
    };

    if query.is_empty() {
        job.append(text, 0.0, normal_format);
        return job;
    }

    let text_lower = text.to_lowercase();
    let query_lower = query.to_lowercase();

    let mut start_idx = 0;
    while let Some(match_pos) = text_lower[start_idx..].find(&query_lower) {
        let actual_match_pos = start_idx + match_pos;

        if actual_match_pos > start_idx {
            job.append(
                &text[start_idx..actual_match_pos],
                0.0,
                normal_format.clone(),
            );
        }

        let end_pos = actual_match_pos + query.len();
        job.append(
            &text[actual_match_pos..end_pos],
            0.0,
            highlight_format.clone(),
        );

        start_idx = end_pos;
    }

    if start_idx < text.len() {
        job.append(&text[start_idx..], 0.0, normal_format);
    }

    job
}
