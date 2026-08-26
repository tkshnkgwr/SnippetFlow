use crate::models::{SearchResult, SnippetStats, TauriSnippet, TopSnippet};

/// 2つのテキスト間で行単位の差分（LCS: 最長共通部分列）をRust側で高速計算して返します。
///
/// # Arguments
/// * `old_text` - 比較元のテキスト（A）
/// * `new_text` - 比較先のテキスト（B）
#[tauri::command]
pub fn compute_snippet_diff(old_text: String, new_text: String) -> Vec<common_lib::text::DiffPart> {
    common_lib::text::compute_diff(&old_text, &new_text)
}

/// スニペット全件に対し、キーワード検索・複数タグ絞り込み・論理削除フィルタ・ソートをRust側で超高速実行します。
///
/// # Arguments
/// * snippets - 検索対象のスニペット一覧
/// * search_text - 検索キーワード
/// * selected_tags - 絞り込み対象のタグリスト（選択されたタグすべてを含むAND条件で一致）
/// * show_deleted - 削除済みデータを含めるかどうかのフラグ
/// * sort_criterion - 並び替えの基準 ("updated_at_desc", "updated_at_asc", "created_at_desc", "title_asc", "copy_count_desc")
#[tauri::command]
pub fn search_snippets(
    snippets: Vec<TauriSnippet>,
    search_text: String,
    selected_tags: Vec<String>,
    show_deleted: bool,
    sort_criterion: String,
) -> SearchResult {
    let start = std::time::Instant::now();
    let lower_search = search_text.trim().to_lowercase();

    let mut filtered: Vec<TauriSnippet> = snippets
        .into_iter()
        .filter(|s| {
            if s.is_deleted && !show_deleted {
                return false;
            }

            if !selected_tags.is_empty() {
                let has_matching_tag = selected_tags.iter().all(|st| s.tags.contains(st));
                if !has_matching_tag {
                    return false;
                }
            }

            if !lower_search.is_empty() {
                let matches_title = s.title.to_lowercase().contains(&lower_search);
                let matches_content = s.content.to_lowercase().contains(&lower_search);
                let matches_desc = s.description.to_lowercase().contains(&lower_search);
                let matches_id = s.id.to_string() == lower_search;
                let matches_tags = s
                    .tags
                    .iter()
                    .any(|t| t.to_lowercase().contains(&lower_search));
                return matches_title
                    || matches_content
                    || matches_desc
                    || matches_id
                    || matches_tags;
            }

            true
        })
        .collect();

    filtered.sort_by(|a, b| {
        let pin_a = if a.is_pinned { 1 } else { 0 };
        let pin_b = if b.is_pinned { 1 } else { 0 };
        if pin_b != pin_a {
            return pin_b.cmp(&pin_a);
        }

        match sort_criterion.as_str() {
            "updated_at_asc" => a.updated_at.cmp(&b.updated_at),
            "created_at_desc" => b.created_at.cmp(&a.created_at),
            "title_asc" => a.title.cmp(&b.title),
            "copy_count_desc" => b.copy_count.cmp(&a.copy_count),
            _ => b.updated_at.cmp(&a.updated_at),
        }
    });

    let elapsed = start.elapsed().as_secs_f64() * 1000.0;
    SearchResult {
        filtered_snippets: filtered,
        query_time_ms: elapsed,
    }
}

/// 既存スニペットの全体使用頻度と入力テキストとの出現スコア（タイトル重み2倍）を合算し、
/// 最適なおすすめタグ Top 5 をRust側で高速生成して返します。
///
/// # Arguments
/// * snippets - スニペットデータ全件
/// * 	itle - 入力・編集中のタイトル
/// * content - 入力・編集中の本文
/// * description - 入力・編集中の説明文
/// * current_tags - 現在すでに登録されているタグ（候補から除外）
#[tauri::command]
pub fn suggest_tags_cmd(
    snippets: Vec<TauriSnippet>,
    title: String,
    content: String,
    description: String,
    current_tags: Vec<String>,
) -> Vec<String> {
    use std::collections::HashMap;

    let mut frequency_map: HashMap<String, usize> = HashMap::new();
    for s in &snippets {
        for t in &s.tags {
            if !t.is_empty() {
                *frequency_map.entry(t.clone()).or_insert(0) += 1;
            }
        }
    }

    let all_candidates: Vec<String> = frequency_map.keys().cloned().collect();

    let mut scored: Vec<(String, usize, usize)> = all_candidates
        .into_iter()
        .filter(|t| !current_tags.contains(t))
        .map(|tag| {
            let lower_tag = tag.to_lowercase();
            let mut text_score = 0;
            text_score += common_lib::text::count_occurrences(&title, &lower_tag) * 2;
            text_score += common_lib::text::count_occurrences(&content, &lower_tag);
            text_score += common_lib::text::count_occurrences(&description, &lower_tag);
            let freq = *frequency_map.get(&tag).unwrap_or(&0);
            (tag, text_score, freq)
        })
        .collect();

    scored.sort_by(|a, b| {
        if b.1 != a.1 {
            b.1.cmp(&a.1)
        } else if b.2 != a.2 {
            b.2.cmp(&a.2)
        } else {
            a.0.cmp(&b.0)
        }
    });

    scored.truncate(5);
    scored.into_iter().map(|(tag, _, _)| tag).collect()
}

/// 選択されたスニペットを順序通りに抽出して指定区切り文字でRust側で超高速結合します。
///
/// # Arguments
/// * snippets - 定型文全件データ
/// * ordered_ids - 結合するスニペットIDの順序配列
/// * separator - 結合時の区切り文字列
#[tauri::command]
pub fn merge_snippets(
    snippets: Vec<TauriSnippet>,
    ordered_ids: Vec<usize>,
    separator: String,
) -> String {
    let mut selected_contents = Vec::with_capacity(ordered_ids.len());
    for id in ordered_ids {
        if let Some(s) = snippets.iter().find(|item| item.id == id) {
            selected_contents.push(s.content.as_str());
        }
    }
    selected_contents.join(&separator)
}

/// 大量負荷検証用のモックスニペットデータをRust側で超高速生成して返します。
///
/// # Arguments
/// * count - 生成するスニペットの件数
/// * start_id - 生成開始ID番号
#[tauri::command]
pub fn generate_mock_snippets(count: usize, start_id: usize) -> Vec<TauriSnippet> {
    let base_tags = [
        "ビジネス",
        "開発",
        "サポート",
        "マーケティング",
        "プライベート",
        "テンプレ",
        "SNS",
        "重要",
    ];
    let templates = [
        (
            "【自動生成】定期週次ミーティングの議事録テンプレート",
            "## 週次ミーティング議事録\n日時：毎週月曜 10:00-\n場所：会議室A または オンライン\n出席者：開発チーム全体\n\n### 【議題】\n1. 先週の進捗報告\n2. 今週のタスク・目標\n3. 課題と相談事項\n\n### 【決定事項】\n- \n\n### 【次回タスク】\n- [ ] ",
            "定期的に開催される週次ミーティングの議事録用フォーマットです。",
        ),
        (
            "【自動生成】お客様への問い合わせへの初期対応・自動返信",
            "〇〇様\n\nお問い合わせありがとうございます。サポートチームです。\n現在内容を確認しております。通常24時間以内に回答いたしますので、今しばらくお待ちください。",
            "ユーザーからの一般的な問い合わせに対するファーストレスポンスです。",
        ),
        (
            "【自動生成】ブログ記事用：導入挨拶テンプレート",
            "こんにちは、[あなたの名前]です！\n今回は〇〇について分かりやすく解説していきます。\n「〇〇について知りたいけれど何から始めればいいか分からない…」とお悩みの方は、ぜひ最後までご覧ください。",
            "個人ブログやテックブログのオープニング文章です。",
        ),
    ];

    let now_dt = chrono::Local::now();
    let mut mock_data = Vec::with_capacity(count);

    for i in 0..count {
        let tpl = &templates[i % templates.len()];
        let tag_count = 1 + (i % 3);
        let mut item_tags = Vec::with_capacity(tag_count);
        for tc in 0..tag_count {
            let tag = base_tags[(i + tc * 2) % base_tags.len()].to_string();
            if !item_tags.contains(&tag) {
                item_tags.push(tag);
            }
        }

        let days_offset = chrono::Duration::days((i % 60) as i64);
        let item_time = (now_dt - days_offset)
            .format("%Y-%m-%d %H:%M:%S")
            .to_string();

        mock_data.push(TauriSnippet {
            id: start_id + i,
            title: format!("{} #{}", tpl.0, i + 1),
            content: format!("{}\n\n[管理用シリアル: SN-{}]", tpl.1, 100000 + i),
            description: format!("{} (シミュレーション用データ #{})", tpl.2, i + 1),
            created_at: item_time.clone(),
            updated_at: item_time,
            deleted_at: None,
            is_deleted: false,
            tags: item_tags,
            is_pinned: false,
            copy_count: 0,
            saved_time_sec: 0,
        });
    }

    mock_data
}

/// スニペット全件データから統計・アナリティクス情報および概算ファイルサイズをRust側で高速集計して返します。
///
/// # Arguments
/// * snippets - スニペット全件データ
#[tauri::command]
pub fn get_snippet_stats(snippets: Vec<TauriSnippet>) -> SnippetStats {
    let total_count = snippets.len();
    let mut active_count = 0;
    let mut deleted_count = 0;
    let mut total_copies = 0;
    let mut total_saved_sec = 0;

    let mut copied_snippets: Vec<TopSnippet> = Vec::new();

    for s in &snippets {
        if s.is_deleted {
            deleted_count += 1;
        } else {
            active_count += 1;
        }
        total_copies += s.copy_count;
        total_saved_sec += s.saved_time_sec;

        if s.copy_count > 0 {
            copied_snippets.push(TopSnippet {
                id: s.id,
                title: s.title.clone(),
                copy_count: s.copy_count,
                saved_time_sec: s.saved_time_sec,
            });
        }
    }

    copied_snippets.sort_by_key(|b| std::cmp::Reverse(b.copy_count));
    copied_snippets.truncate(3);

    // 概算ファイルサイズ（KB）の算出
    let serialized_size = serde_json::to_string(&snippets)
        .map(|s| s.len())
        .unwrap_or(0);
    let kb_size = format!("{:.2}", (serialized_size as f64) / 1024.0);

    SnippetStats {
        total_count,
        active_count,
        deleted_count,
        total_copies,
        total_saved_sec,
        kb_size,
        top_snippets: copied_snippets,
    }
}

/// 検索処理のシミュレーションを100回実行し、平均実行速度（ミリ秒）をRust側で正確に計測して返します。
///
/// # Arguments
/// * snippets - 検索対象のスニペット一覧
#[tauri::command]
pub fn benchmark_search(snippets: Vec<TauriSnippet>) -> f64 {
    let start = std::time::Instant::now();
    for _ in 0..100 {
        let _ = snippets
            .iter()
            .filter(|s| {
                let matches_text = s.title.contains("自動生成") || s.content.contains("〇〇");
                let matches_tag = s
                    .tags
                    .iter()
                    .any(|t| t.contains("ビジネス") || t.contains("開発"));
                matches_text && matches_tag
            })
            .count();
    }
    let elapsed = start.elapsed().as_secs_f64() * 1000.0;
    (elapsed / 100.0 * 10000.0).round() / 10000.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_snippet_diff_cmd() {
        let diff = compute_snippet_diff("Hello".to_string(), "World".to_string());
        assert!(!diff.is_empty());
    }

    #[test]
    fn test_search_snippets_cmd() {
        let sample_a = TauriSnippet {
            id: 1,
            title: "Rust Guide".to_string(),
            content: "Hello Rust".to_string(),
            description: "Desc Rust".to_string(),
            created_at: "2026-08-01 10:00:00".to_string(),
            updated_at: "2026-08-01 10:00:00".to_string(),
            deleted_at: None,
            is_deleted: false,
            tags: vec!["mail".to_string(), "rust".to_string()],
            is_pinned: false,
            copy_count: 10,
            saved_time_sec: 100,
        };
        let sample_b = TauriSnippet {
            id: 2,
            title: "JS Note".to_string(),
            content: "Hello JS".to_string(),
            description: "Desc JS".to_string(),
            created_at: "2026-08-02 10:00:00".to_string(),
            updated_at: "2026-08-02 10:00:00".to_string(),
            deleted_at: None,
            is_deleted: false,
            tags: vec!["js".to_string()],
            is_pinned: true,
            copy_count: 2,
            saved_time_sec: 20,
        };

        let snippets = vec![sample_a, sample_b];
        let res = search_snippets(
            snippets.clone(),
            "rust".to_string(),
            vec![],
            false,
            "updated_at_desc".to_string(),
        );

        assert_eq!(res.filtered_snippets.len(), 1);
        assert_eq!(res.filtered_snippets[0].id, 1);

        let res_pin = search_snippets(
            snippets.clone(),
            "".to_string(),
            vec![],
            false,
            "updated_at_asc".to_string(),
        );

        // ピン留めされた ID: 2 がソート順（updated_at_asc）に関わらず最上位に優先される
        assert_eq!(res_pin.filtered_snippets[0].id, 2);

        // 複数タグ選択時のAND条件検証
        let res_and = search_snippets(
            snippets,
            "".to_string(),
            vec!["mail".to_string(), "rust".to_string()],
            false,
            "updated_at_desc".to_string(),
        );
        assert_eq!(res_and.filtered_snippets.len(), 1);
        assert_eq!(res_and.filtered_snippets[0].id, 1);
    }

    #[test]
    fn test_search_snippets_show_deleted_filter() {
        let active_snippet = TauriSnippet {
            id: 1,
            title: "Active".to_string(),
            content: "Active".to_string(),
            description: "".to_string(),
            created_at: "2026-08-01 10:00:00".to_string(),
            updated_at: "2026-08-01 10:00:00".to_string(),
            deleted_at: None,
            is_deleted: false,
            tags: vec![],
            is_pinned: false,
            copy_count: 0,
            saved_time_sec: 0,
        };
        let deleted_snippet = TauriSnippet {
            id: 2,
            title: "Deleted".to_string(),
            content: "Deleted".to_string(),
            description: "".to_string(),
            created_at: "2026-08-01 10:00:00".to_string(),
            updated_at: "2026-08-01 10:00:00".to_string(),
            deleted_at: Some("2026-08-02 10:00:00".to_string()),
            is_deleted: true,
            tags: vec![],
            is_pinned: false,
            copy_count: 0,
            saved_time_sec: 0,
        };

        let snippets = vec![active_snippet, deleted_snippet];

        let hide_del = search_snippets(
            snippets.clone(),
            "".to_string(),
            vec![],
            false,
            "updated_at_desc".to_string(),
        );
        assert_eq!(hide_del.filtered_snippets.len(), 1);

        let show_del = search_snippets(
            snippets,
            "".to_string(),
            vec![],
            true,
            "updated_at_desc".to_string(),
        );
        assert_eq!(show_del.filtered_snippets.len(), 2);
    }

    #[test]
    fn test_suggest_tags_cmd() {
        let snippet = TauriSnippet {
            id: 1,
            title: "Business Email".to_string(),
            content: "Content".to_string(),
            description: "".to_string(),
            created_at: "".to_string(),
            updated_at: "".to_string(),
            deleted_at: None,
            is_deleted: false,
            tags: vec!["business".to_string(), "email".to_string()],
            is_pinned: false,
            copy_count: 0,
            saved_time_sec: 0,
        };

        let suggestions = suggest_tags_cmd(
            vec![snippet],
            "Business Meeting".to_string(),
            "".to_string(),
            "".to_string(),
            vec!["email".to_string()],
        );

        assert!(suggestions.contains(&"business".to_string()));
        assert!(!suggestions.contains(&"email".to_string()));
    }

    #[test]
    fn test_merge_snippets_cmd() {
        let snippet_a = TauriSnippet {
            id: 1,
            title: "Part1".to_string(),
            content: "Hello".to_string(),
            description: "".to_string(),
            created_at: "".to_string(),
            updated_at: "".to_string(),
            deleted_at: None,
            is_deleted: false,
            tags: vec![],
            is_pinned: false,
            copy_count: 0,
            saved_time_sec: 0,
        };
        let snippet_b = TauriSnippet {
            id: 2,
            title: "Part2".to_string(),
            content: "World".to_string(),
            description: "".to_string(),
            created_at: "".to_string(),
            updated_at: "".to_string(),
            deleted_at: None,
            is_deleted: false,
            tags: vec![],
            is_pinned: false,
            copy_count: 0,
            saved_time_sec: 0,
        };

        let merged = merge_snippets(
            vec![snippet_a, snippet_b],
            vec![2, 1],
            "\n---\n".to_string(),
        );
        assert_eq!(merged, "World\n---\nHello");
    }

    #[test]
    fn test_generate_mock_snippets_cmd() {
        let mocks = generate_mock_snippets(10, 2000);
        assert_eq!(mocks.len(), 10);
        assert_eq!(mocks[0].id, 2000);
        assert_eq!(mocks[9].id, 2009);
        assert!(!mocks[0].title.is_empty());
        assert!(!mocks[0].tags.is_empty());
    }

    #[test]
    fn test_get_snippet_stats_cmd() {
        let snippet_a = TauriSnippet {
            id: 1,
            title: "Item A".to_string(),
            content: "AAA".to_string(),
            description: "Desc A".to_string(),
            created_at: "2026-08-01 10:00:00".to_string(),
            updated_at: "2026-08-01 10:00:00".to_string(),
            deleted_at: None,
            is_deleted: false,
            tags: vec!["tag1".to_string()],
            is_pinned: false,
            copy_count: 10,
            saved_time_sec: 100,
        };
        let snippet_b = TauriSnippet {
            id: 2,
            title: "Item B".to_string(),
            content: "BBB".to_string(),
            description: "Desc B".to_string(),
            created_at: "2026-08-02 10:00:00".to_string(),
            updated_at: "2026-08-02 10:00:00".to_string(),
            deleted_at: Some("2026-08-03 10:00:00".to_string()),
            is_deleted: true,
            tags: vec![],
            is_pinned: false,
            copy_count: 5,
            saved_time_sec: 50,
        };

        let stats = get_snippet_stats(vec![snippet_a, snippet_b]);
        assert_eq!(stats.total_count, 2);
        assert_eq!(stats.active_count, 1);
        assert_eq!(stats.deleted_count, 1);
        assert_eq!(stats.total_copies, 15);
        assert_eq!(stats.total_saved_sec, 150);
        assert_eq!(stats.top_snippets.len(), 2);
        assert_eq!(stats.top_snippets[0].id, 1);
        assert_eq!(stats.top_snippets[0].copy_count, 10);
    }

    #[test]
    fn test_benchmark_search_cmd() {
        let mocks = generate_mock_snippets(50, 2000);
        let time_ms = benchmark_search(mocks);
        assert!(time_ms >= 0.0);
    }
}
