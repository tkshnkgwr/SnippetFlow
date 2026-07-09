/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Tag,
  Copy,
  Check,
  Edit2,
  Trash2,
  Combine,
  ArrowLeftRight,
  Plus,
  FileDown,
  FileUp,
  History,
  Info,
  Layers,
  Database,
  Pin
} from 'lucide-react';
import { Snippet, SortCriterion } from '../types';

const highlightText = (text: string, highlight: string) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-250 dark:bg-yellow-800 text-slate-900 dark:text-slate-100 rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

interface SnippetListProps {
  snippets: Snippet[];
  sortCriterion: SortCriterion;
  onSortCriterionChange: (criterion: SortCriterion) => void;
  onAddSnippet: () => void;
  onEditSnippet: (id: number) => void;
  onCopyText: (text: string, label: string, id?: number | number[]) => void;
  onTogglePin: (id: number) => void;
  onGoToCompare: (idA?: number, idB?: number) => void;
  onGoToMerge: (ids: number[]) => void;
  onGoToPerformance: () => void;
  onImportJSON: (data: Snippet[]) => void;
  onRecordQueryTime: (timeMs: number) => void;
}

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
}: SnippetListProps) {
  // ローカル（コンポーネント内）状態管理
  const [searchText, setSearchText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [isTauri, setIsTauri] = useState(false);
  React.useEffect(() => {
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

  // UPDATE 2026-07-01: 子コンポーネントのレンダーフェーズ中に親コンポーネントの setState (onRecordQueryTime) を
  // 直接呼び出すと React の「Cannot update a component while rendering a different component」警告が発生するため、
  // 計算処理 (useMemo) から計測時間を返し、useEffect を介して安全に親コンポーネントのステートを更新するように修正。
  // 検索条件に基づきフィルタリングを行い、かつ検索にかかった処理時間を計測する
  const { filteredSnippets, queryTime } = useMemo(() => {
    const start = performance.now();
    
    const lowerSearch = searchText.toLowerCase().trim();
    const result = snippets.filter(s => {
      // 1. 論理削除フラグの検証（非表示設定の場合はスキップ）
      if (s.isDeleted && !showDeleted) return false;

      // 2. 選択されたタグに一致するか検証
      if (selectedTag && !s.tags.includes(selectedTag)) return false;

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
      queryTime: end - start
    };
  }, [snippets, searchText, selectedTag, showDeleted, sortCriterion]);

  React.useEffect(() => {
    onRecordQueryTime(queryTime);
  }, [queryTime, onRecordQueryTime]);
  // END UPDATE 2026-07-01

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
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `定型文バックアップ_${new Date().toISOString().split('T')[0]}.json`);
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
          // 簡易的なデータ整合性のバリデーションチェック
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
          // 簡易的なデータ整合性のバリデーションチェック
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
      } catch (err) {
        alert('JSONファイルのパースに失敗しました。ファイルが破損していないか確認してください。');
      }
    };
    reader.readAsText(file);
    // ファイル選択フォームの入力値をリセット
    if (e.target) e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 sm:p-6 md:p-8 space-y-6" id="snippet-list-root">
      {/* Search and Control Row */}
      {/* UPDATE 2026-06-30: 検索部カードの背景とボーダーをダークモード（dark:bg-slate-900 dark:border-slate-800）に対応 */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-850 shadow-sm space-y-4 shrink-0" id="list-search-section">
        {/* Top input & add button row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            {/* UPDATE 2026-06-30: 検索入力フィールドの背景色と文字色をダークモード（dark:bg-slate-800 dark:text-slate-100）に対応。ライトモードではさらにしろ基調へ */}
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="タイトル、本文、説明、ID、またはタグでリアルタイム検索..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50/20 dark:bg-slate-800 hover:bg-slate-50/50 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition font-sans"
              id="list-search-input"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* 並び替え用セレクトボックス */}
            <select
              value={sortCriterion}
              onChange={(e) => onSortCriterionChange(e.target.value as SortCriterion)}
              className="px-3 py-2.5 text-xs bg-slate-50/30 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer font-sans shrink-0"
              id="list-sort-select"
            >
              <option value="updated_at_desc">更新が新しい順</option>
              <option value="updated_at_asc">更新が古い順</option>
              <option value="created_at_desc">作成が新しい順</option>
              <option value="title_asc">タイトル順</option>
              <option value="copy_count_desc">よく使う順 (コピー数)</option>
            </select>

            {/* UPDATE 2026-06-30: 追加ボタンの背景色を bg-indigo-650 から bg-indigo-600 へ変更。文字が白色で見えない視認性不良の不具合を解消しました */}
            <button
              onClick={onAddSnippet}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
              id="btn-list-add"
            >
              <Plus className="w-4 h-4" />
              <span>新規定型文を追加</span>
            </button>

            {/* Utility Dropdown buttons */}
            {/* UPDATE 2026-06-30: インポート・エクスポート用ユーティリティボタンをダークモード（dark:bg-slate-800 dark:border-slate-700）に対応 */}
            <button
              onClick={handleExportJSON}
              title="JSONデータベースのエクスポート"
              className="p-2.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg transition shrink-0 cursor-pointer"
              id="btn-list-export"
            >
              <FileDown className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={handleImportClick}
              title="JSONデータベースのインポート"
              className="p-2.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg transition shrink-0 cursor-pointer"
              id="btn-list-import"
            >
              <FileUp className="w-4.5 h-4.5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Dynamic Tag Clouds Row */}
        {/* UPDATE 2026-06-30: タグクラウド行の枠線をダークモード（dark:border-slate-800）に対応 */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs" id="list-tag-cloud">
          <span className="text-slate-400 font-medium flex items-center mr-1 font-sans">
            <Tag className="w-3.5 h-3.5 mr-1" />
            タグ：
          </span>
          {/* UPDATE 2026-06-30: 「すべて表示」ボタンの背景色と文字色をダークモード（dark:bg-slate-200 dark:text-slate-900 / dark:bg-slate-800 dark:text-slate-350）に対応 */}
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 rounded-md transition font-sans cursor-pointer ${
              selectedTag === null
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-medium'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            すべて表示
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-1 rounded-md transition font-sans cursor-pointer ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-350 hover:bg-indigo-100/80 dark:hover:bg-indigo-900 border border-indigo-100/50 dark:border-indigo-900/50'
              }`}
            >
              {/* UPDATE 2026-06-30: 個別タグボタンのアクティブ・非アクティブ配色をダークモード（dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50）に対応 */}
              #{tag}
            </button>
          ))}
        </div>
 
        {/* Filters/Toggles & Benchmark display footer */}
        {/* UPDATE 2026-06-30: フィルター表示トグル・フッター行の枠線と文字色をダークモード（dark:border-slate-800 dark:text-slate-400）に対応 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 font-sans">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              id="checkbox-show-deleted"
            />
            {/* UPDATE 2026-06-30: 削除済みトグルラベル文字色をダークモード（dark:text-slate-300）に対応 */}
            <span className="flex items-center text-slate-600 dark:text-slate-300 font-medium">
              <History className="w-3.5 h-3.5 mr-1 text-slate-400" />
              削除した定型文（過去ログ）を表示する
            </span>
          </label>
 
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 flex items-center">
              <Database className="w-3.5 h-3.5 mr-1" />
              データベース件数: {snippets.length}件 (フィルタ一致: {filteredSnippets.length}件)
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            {/* UPDATE 2026-06-30: 性能メーター遷移リンク文字色をダークモード（dark:text-indigo-400）に対応 */}
            <button
              onClick={onGoToPerformance}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline font-medium cursor-pointer"
            >
              JSON/DB性能診断 →
            </button>
          </div>
        </div>
      </div>
 
      {/* Main List Grid of Cards */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-3.5 pr-1" id="list-scroll-container">
        {filteredSnippets.length > 0 ? (
          <div className="space-y-3" id="snippet-cards-container">
          {/* List selection helper header */}
          {/* UPDATE 2026-06-30: カード一覧ヘッダーの選択コントロールラベル色をダークモードに対応 */}
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

          {filteredSnippets.map((snippet) => {
            const isSelected = selectedIds.includes(snippet.id);
            return (
              <div
                key={snippet.id}
                onClick={() => onEditSnippet(snippet.id)}
                // UPDATE 2026-06-30: 定型文アイテムカードの境界線と背景色をダークモード（dark:bg-slate-900 / dark:border-slate-800）に対応。選択状態やホバー効果、削除フラグ状態も調整
                className={`group relative rounded-xl border transition-all duration-150 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:shadow-md ${
                  snippet.isDeleted
                    ? 'border-amber-200/60 bg-amber-50/20 dark:bg-amber-950/10 dark:border-amber-900/40'
                    : isSelected
                    ? 'border-indigo-400 dark:border-indigo-500/80 bg-indigo-50/10 dark:bg-indigo-950/20 shadow-sm'
                    : snippet.isPinned
                    ? 'border-indigo-300 dark:border-indigo-500 bg-indigo-50/5 dark:bg-indigo-950/10 shadow-sm'
                    : 'border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Checkbox and Left Column */}
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!snippet.isDeleted) {
                        handleToggleSelect(snippet.id);
                      }
                    }}
                    className={`pt-1 shrink-0 ${snippet.isDeleted ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={snippet.isDeleted}
                      readOnly
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        #{snippet.id}
                      </span>
                      <h3 className={`text-sm font-semibold text-slate-800 dark:text-slate-200 font-sans truncate ${snippet.isDeleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                        {highlightText(snippet.title, searchText)}
                      </h3>
                      {snippet.isDeleted && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 font-sans font-medium">
                          削除済
                        </span>
                      )}
                    </div>

                    {/* Preview of content */}
                    <p className={`text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-mono ${snippet.isDeleted ? 'opacity-50' : ''}`}>
                      {highlightText(snippet.content, searchText)}
                    </p>

                    {/* Tag list */}
                    {snippet.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {snippet.tags.map(t => (
                          <span
                            key={t}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTag(t);
                            }}
                            className="text-[10px] px-2 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium font-sans"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Area: Description & Action Buttons */}
                <div className="flex flex-row md:flex-col items-start md:items-end justify-between w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 gap-2">
                  <span className="text-[10px] text-slate-400 font-sans text-left md:text-right">
                    更新: {new Date(snippet.updatedAt).toLocaleDateString('ja-JP')}
                  </span>
                  
                  <div className="flex items-center space-x-1.5">
                    {/* Copy Button (List page action) */}
                    <button
                      onClick={(e) => handleCopySingle(e, snippet)}
                      title="クリップボードへコピー"
                      className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        copiedId === snippet.id
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white cursor-pointer'
                      }`}
                    >
                      {copiedId === snippet.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 animate-bounce" />
                          <span>コピー済!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>コピー</span>
                        </>
                      )}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditSnippet(snippet.id);
                      }}
                      title="編集画面へ"
                      // UPDATE 2026-06-30: 編集(鉛筆)ボタンをダークモード（dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-800）に対応
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Pin button */}
                    {!snippet.isDeleted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(snippet.id);
                        }}
                        title={snippet.isPinned ? "ピン留め解除" : "ピン留め"}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          snippet.isPinned
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900'
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Pin className={`w-3.5 h-3.5 ${snippet.isPinned ? 'fill-current text-amber-500' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // UPDATE 2026-06-30: 検索結果がゼロの時の空状態カードの配色もダークモードに対応（dark:bg-slate-900 / dark:border-slate-800）
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
          <Info className="w-12 h-12 text-slate-200 dark:text-slate-700" />
          <p className="text-sm font-sans font-medium text-slate-600 dark:text-slate-300">合致する定型文が見つかりません</p>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            入力された検索キーワードまたはタグが登録された定型文に存在しないか、削除した定型文非表示の状態で検索している可能性があります。
          </p>
          <div className="flex gap-2.5 pt-2">
            {(searchText || selectedTag || showDeleted) && (
              <button
                onClick={() => {
                  setSearchText('');
                  setSelectedTag(null);
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

      {/* Floating Interactive Toolbar for Multi-select Operations */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center justify-between gap-6 border border-slate-800 shrink-0 z-50 animate-slide-up">
          <div className="flex items-center space-x-2 text-xs font-sans">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span><strong>{selectedIds.length}</strong> 件の定型文を選択中</span>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Compare Button (Available when exactly 2 are selected) */}
            <button
              onClick={() => {
                if (selectedIds.length === 2) {
                  onGoToCompare(selectedIds[0], selectedIds[1]);
                } else {
                  alert('比較機能を使用するには、定型文を正確に2件選択してください。');
                }
              }}
              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                selectedIds.length === 2
                  ? 'bg-slate-800 text-slate-100 hover:bg-slate-750 hover:text-white cursor-pointer'
                  : 'bg-slate-850 text-slate-500 cursor-not-allowed opacity-50'
              }`}
              title="2件を選択して差分比較"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>2件を比較</span>
            </button>

            {/* Merge/Combine Button */}
            <button
              onClick={() => onGoToMerge(selectedIds)}
              className="inline-flex items-center space-x-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold transition cursor-pointer"
              title="複数を選択して順序よく結合"
            >
              <Combine className="w-3.5 h-3.5" />
              <span>選んだ定型文を結合</span>
            </button>

            {/* Clear selection */}
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-400 hover:text-white px-1.5 transition cursor-pointer font-sans"
            >
              解除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
