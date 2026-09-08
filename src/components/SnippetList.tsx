/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Info } from 'lucide-react';
import { Snippet, SortCriterion } from '../types';
import SnippetSearchBar from './SnippetSearchBar';
import SnippetCard from './SnippetCard';
import SnippetMultiSelectBar from './SnippetMultiSelectBar';
import SnippetTooltip, { TooltipData } from './SnippetTooltip';

/**
 * スニペット一覧画面コンポーネントのProps定義。
 */
export interface SnippetListProps {
  /** スニペットデータ全件 */
  snippets: Snippet[];
  /** 現在選択中のソート基準 */
  sortCriterion: SortCriterion;
  /** ソート基準変更イベントハンドラー */
  onSortCriterionChange: (criterion: SortCriterion) => void;
  /** 新規作成画面遷移ハンドラー */
  onAddSnippet: () => void;
  /** 編集画面遷移ハンドラー */
  onEditSnippet: (id: number) => void;
  /** テキストコピーハンドラー */
  onCopyText: (text: string, label: string, id?: number | number[]) => void;
  /** ピン留めトグルハンドラー */
  onTogglePin: (id: number) => void;
  /** 差分比較画面遷移ハンドラー */
  onGoToCompare: (idA?: number, idB?: number) => void;
  /** 複数マージ画面遷移ハンドラー */
  onGoToMerge: (ids: number[]) => void;
  /** パフォーマンス画面遷移ハンドラー */
  onGoToPerformance: () => void;
  /** JSONインポートハンドラー */
  onImportJSON: (data: Snippet[]) => void;
  /** クエリ処理時間記録ハンドラー */
  onRecordQueryTime: (timeMs: number) => void;
  /** 一括論理削除ハンドラー */
  onBulkSoftDelete?: (ids: number[]) => void;
  /** 一括復元ハンドラー */
  onBulkRestore?: (ids: number[]) => void;
  /** 一括完全削除ハンドラー */
  onBulkHardDelete?: (ids: number[]) => void;
}

/**
 * 定型文一覧、検索・タグクラウド・ソート・一括操作を提供するメインコンポーネント。
 */
export default function SnippetList({
  snippets,
  sortCriterion,
  onSortCriterionChange,
  onAddSnippet,
  onEditSnippet,
  onCopyText,
  onTogglePin,
  onGoToCompare,
  onGoToMerge,
  onGoToPerformance,
  onImportJSON,
  onRecordQueryTime,
  onBulkSoftDelete,
  onBulkRestore,
  onBulkHardDelete,
}: SnippetListProps) {
  // ローカル（コンポーネント内）状態管理
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  // マウスカーソル位置に追従する補足説明ツールチップ
  const [hoveredTooltip, setHoveredTooltip] = useState<TooltipData | null>(null);

  const handleMouseMoveSnippet = (e: React.MouseEvent, snippet: Snippet) => {
    if (!snippet.description) {
      if (hoveredTooltip) setHoveredTooltip(null);
      return;
    }

    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const tooltipWidth = 320;
    const tooltipHeight = 90;

    let x = mouseX + 14;
    let y = mouseY + 14;

    // 画面右端からはみ出る場合は左側に反転
    if (x + tooltipWidth > windowWidth - 16) {
      x = mouseX - tooltipWidth - 10;
    }

    // 画面下部からはみ出る場合は上側に反転
    if (y + tooltipHeight > windowHeight - 16) {
      y = mouseY - tooltipHeight - 10;
    }

    setHoveredTooltip({
      id: snippet.id,
      text: snippet.description,
      x: Math.max(10, x),
      y: Math.max(10, y),
    });
  };

  const handleMouseLeaveSnippet = () => {
    setHoveredTooltip(null);
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleResetTags = () => {
    setSelectedTags([]);
  };

  const [isTauri, setIsTauri] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      setIsTauri(true);
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 登録されているすべてのスニペットから一意なタグを収集する（タグクラウド表示用）
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    snippets.forEach(s => {
      if (!s.isDeleted || showDeleted) {
        s.tags.forEach(t => tagsSet.add(t));
      }
    });
    return Array.from(tagsSet);
  }, [snippets, showDeleted]);

  // 検索条件に基づきフィルタリングを行い、かつ検索にかかった処理時間を計測する
  const fallbackSearch = useMemo(() => {
    const start = performance.now();

    const lowerSearch = searchText.toLowerCase().trim();
    const result = snippets.filter(s => {
      // 1. 論理削除フラグの検証（非表示設定の場合はスキップ）
      if (s.isDeleted && !showDeleted) return false;

      // 2. 選択されたタグに一致するか検証（複数選択時：選択されたタグすべてを含むAND条件）
      if (selectedTags.length > 0) {
        const hasMatchingTag = selectedTags.every(t => s.tags.includes(t));
        if (!hasMatchingTag) return false;
      }

      // 3. 検索キーワード（部分一致・ID一致など）を検証
      if (lowerSearch) {
        const matchesTitle = s.title.toLowerCase().includes(lowerSearch);
        const matchesContent = s.content.toLowerCase().includes(lowerSearch);
        const matchesDesc = s.description.toLowerCase().includes(lowerSearch);
        const matchesId = s.id.toString() === lowerSearch;
        const matchesTags = s.tags.some(t => t.toLowerCase().includes(lowerSearch));
        return matchesTitle || matchesContent || matchesDesc || matchesId || matchesTags;
      }

      return true;
    });

    // 4. ソート基準（並び替え条件）の適用
    const sortedResult = [...result];
    sortedResult.sort((a, b) => {
      // ピン留め（お気に入り）されているスニペットを常に最優先する
      const pinA = a.isPinned ? 1 : 0;
      const pinB = b.isPinned ? 1 : 0;
      if (pinB !== pinA) {
        return pinB - pinA;
      }

      // 指定されたソート条件で並び替えを行う
      if (sortCriterion === 'updated_at_desc') {
        return b.updatedAt.localeCompare(a.updatedAt);
      } else if (sortCriterion === 'updated_at_asc') {
        return a.updatedAt.localeCompare(b.updatedAt);
      } else if (sortCriterion === 'created_at_desc') {
        return b.createdAt.localeCompare(a.createdAt);
      } else if (sortCriterion === 'title_asc') {
        return a.title.localeCompare(b.title);
      } else if (sortCriterion === 'copy_count_desc') {
        return (b.copyCount || 0) - (a.copyCount || 0);
      }
      return 0;
    });

    const end = performance.now();

    return {
      filteredSnippets: sortedResult,
      queryTime: end - start,
    };
  }, [snippets, searchText, selectedTags, showDeleted, sortCriterion]);

  const [filteredSnippets, setFilteredSnippets] = useState<Snippet[]>(fallbackSearch.filteredSnippets);

  useEffect(() => {
    let isMounted = true;
    const performSearch = async () => {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const res = await invoke<{ filteredSnippets: Snippet[]; queryTimeMs: number }>('search_snippets', {
            snippets,
            searchText,
            selectedTags,
            showDeleted,
            sortCriterion,
          });
          if (isMounted) {
            setFilteredSnippets(res.filteredSnippets);
            onRecordQueryTime(res.queryTimeMs);
            return;
          }
        } catch (e) {
          console.error('Failed to search snippets via Rust backend:', e);
        }
      }
      if (isMounted) {
        setFilteredSnippets(fallbackSearch.filteredSnippets);
        onRecordQueryTime(fallbackSearch.queryTime);
      }
    };
    performSearch();
    return () => {
      isMounted = false;
    };
  }, [snippets, searchText, selectedTags, showDeleted, sortCriterion, fallbackSearch, onRecordQueryTime]);

  // 単一スニペットのコピー処理を行う関数
  const handleCopySingle = (e: React.MouseEvent, snippet: Snippet) => {
    e.stopPropagation();
    onCopyText(snippet.content, snippet.title, snippet.id);
    setCopiedId(snippet.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // 複数選択用のチェックボックス制御処理
  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const activeFilteredIds = filteredSnippets.filter(s => !s.isDeleted).map(s => s.id);
    const allSelected = activeFilteredIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !activeFilteredIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...activeFilteredIds])));
    }
  };

  // データベース（スニペットデータ）をJSONファイルとしてエクスポート保存する関数
  const handleExportJSON = async () => {
    const jsonStr = JSON.stringify(snippets, null, 2);
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('export_snippets_json', { jsonStr });
      } catch (err) {
        if (err !== 'Cancelled') {
          alert('エクスポートに失敗しました: ' + err);
        }
      }
    } else {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonStr);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `定型文バックアップ_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  // JSONデータベースファイルのインポート処理を開始する関数
  const handleImportClick = async () => {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const content = await invoke<string>('import_snippets_json');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const isValid = parsed.every(item =>
            typeof item.id === 'number' &&
            typeof item.title === 'string' &&
            typeof item.content === 'string'
          );

          if (isValid) {
            onImportJSON(parsed);
          } else {
            alert('ファイルのデータ仕様が定型文フォーマットと一致しません。');
          }
        } else {
          alert('配列形式のJSONファイルを指定してください。');
        }
      } catch (err) {
        if (err !== 'Cancelled') {
          alert('インポートに失敗しました: ' + err);
        }
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const isValid = parsed.every(item =>
            typeof item.id === 'number' &&
            typeof item.title === 'string' &&
            typeof item.content === 'string'
          );

          if (isValid) {
            onImportJSON(parsed);
            alert(`JSONファイルから ${parsed.length} 件の定型文データを正常に読み込みました。`);
          } else {
            alert('ファイルのデータ仕様が定型文フォーマットと一致しません。');
          }
        } else {
          alert('配列形式のJSONファイルを指定してください。');
        }
      } catch {
        alert('JSONファイルのパースに失敗しました。ファイルが破損していないか確認してください。');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 sm:p-6 md:p-8 space-y-6" id="snippet-list-root">
      {/* 検索・ソート・タグ・各種コントロールツールバー */}
      <SnippetSearchBar
        searchText={searchText}
        onSearchTextChange={setSearchText}
        sortCriterion={sortCriterion}
        onSortCriterionChange={onSortCriterionChange}
        onAddSnippet={onAddSnippet}
        onExportJSON={handleExportJSON}
        onImportClick={handleImportClick}
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
        allTags={allTags}
        selectedTags={selectedTags}
        onToggleTag={handleToggleTag}
        onResetTags={handleResetTags}
        showDeleted={showDeleted}
        onToggleShowDeleted={setShowDeleted}
        totalSnippetsCount={snippets.length}
        filteredSnippetsCount={filteredSnippets.length}
        onGoToPerformance={onGoToPerformance}
      />

      {/* メインカード一覧スクロール領域 */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-3.5 pr-1" id="list-scroll-container">
        {filteredSnippets.length > 0 ? (
          <div className="space-y-3" id="snippet-cards-container">
            {/* 一覧ヘッダー（全選択チェックボックス） */}
            <div className="flex items-center justify-between px-2 text-xs text-slate-400 font-sans shrink-0">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={
                    filteredSnippets.filter(s => !s.isDeleted).length > 0 &&
                    filteredSnippets.filter(s => !s.isDeleted).every(s => selectedIds.includes(s.id))
                  }
                  onChange={handleSelectAll}
                  className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="font-medium text-slate-500 dark:text-slate-400">すべて選択</span>
              </div>
              <span>定型文タイトル・補足説明</span>
              <span>作成 / 最終更新</span>
            </div>

            {/* スニペットカード一覧 */}
            {filteredSnippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                isSelected={selectedIds.includes(snippet.id)}
                searchText={searchText}
                copiedId={copiedId}
                onEditSnippet={onEditSnippet}
                onToggleSelect={handleToggleSelect}
                onCopySingle={handleCopySingle}
                onTogglePin={onTogglePin}
                onToggleTag={handleToggleTag}
                onMouseMoveSnippet={handleMouseMoveSnippet}
                onMouseLeaveSnippet={handleMouseLeaveSnippet}
              />
            ))}
          </div>
        ) : (
          /* 検索結果がゼロ件の場合の空状態カード */
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <Info className="w-12 h-12 text-slate-200 dark:text-slate-700" />
            <p className="text-sm font-sans font-medium text-slate-600 dark:text-slate-300">合致する定型文が見つかりません</p>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              入力された検索キーワードまたはタグが登録された定型文に存在しないか、削除した定型文非表示の状態で検索している可能性があります。
            </p>
            <div className="flex gap-2.5 pt-2">
              {(searchText || selectedTags.length > 0 || showDeleted) && (
                <button
                  onClick={() => {
                    setSearchText('');
                    setSelectedTags([]);
                    setShowDeleted(true);
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg transition cursor-pointer"
                >
                  フィルターをリセット
                </button>
              )}
              <button
                onClick={onAddSnippet}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition cursor-pointer"
              >
                新しい定型文を登録
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 複数選択時のフローティング操作バー */}
      <SnippetMultiSelectBar
        selectedIds={selectedIds}
        showDeleted={showDeleted}
        onGoToCompare={(idA, idB) => onGoToCompare(idA, idB)}
        onGoToMerge={(ids) => onGoToMerge(ids)}
        onBulkRestore={onBulkRestore}
        onBulkHardDelete={onBulkHardDelete}
        onBulkSoftDelete={onBulkSoftDelete}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* 補足説明スマートツールチップ */}
      <SnippetTooltip tooltip={hoveredTooltip} />
    </div>
  );
}
