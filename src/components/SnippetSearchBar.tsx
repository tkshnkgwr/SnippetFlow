/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Search,
  Tag,
  Plus,
  FileDown,
  FileUp,
  History,
  Database,
} from 'lucide-react';
import { SortCriterion } from '../types';

export interface SnippetSearchBarProps {
  /** 検索入力文字列 */
  searchText: string;
  /** 検索文字列変更ハンドラー */
  onSearchTextChange: (text: string) => void;
  /** 現在のソート基準 */
  sortCriterion: SortCriterion;
  /** ソート基準変更ハンドラー */
  onSortCriterionChange: (criterion: SortCriterion) => void;
  /** 新規定型文追加ハンドラー */
  onAddSnippet: () => void;
  /** JSONエクスポートハンドラー */
  onExportJSON: () => void;
  /** JSONインポートクリックハンドラー */
  onImportClick: () => void;
  /** 非表示のファイル入力inputへの参照 */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  /** ファイル選択変更ハンドラー */
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** 登録されている全タグの一覧 */
  allTags: string[];
  /** 現在選択中のタグ一覧 */
  selectedTags: string[];
  /** タグ選択トグルハンドラー */
  onToggleTag: (tag: string) => void;
  /** タグ選択リセットハンドラー */
  onResetTags: () => void;
  /** 削除済みスニペット表示フラグ */
  showDeleted: boolean;
  /** 削除済み表示トグルハンドラー */
  onToggleShowDeleted: (show: boolean) => void;
  /** 登録定型文の総件数 */
  totalSnippetsCount: number;
  /** フィルタ適用後の件数 */
  filteredSnippetsCount: number;
  /** 性能診断画面遷移ハンドラー */
  onGoToPerformance: () => void;
}

/**
 * 検索入力・ソート・追加/入出力・タグクラウド・件数ステータスを管理するツールバーコンポーネント。
 */
export const SnippetSearchBar: React.FC<SnippetSearchBarProps> = ({
  searchText,
  onSearchTextChange,
  sortCriterion,
  onSortCriterionChange,
  onAddSnippet,
  onExportJSON,
  onImportClick,
  fileInputRef,
  onFileChange,
  allTags,
  selectedTags,
  onToggleTag,
  onResetTags,
  showDeleted,
  onToggleShowDeleted,
  totalSnippetsCount,
  filteredSnippetsCount,
  onGoToPerformance,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-850 shadow-sm space-y-4 shrink-0" id="list-search-section">
      {/* 検索入力欄 & コントロール行 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchText}
            onChange={(e) => onSearchTextChange(e.target.value)}
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

          {/* 新規定型文追加ボタン */}
          <button
            onClick={onAddSnippet}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
            id="btn-list-add"
          >
            <Plus className="w-4 h-4" />
            <span>新規定型文を追加</span>
          </button>

          {/* JSONエクスポート・インポートボタン */}
          <button
            onClick={onExportJSON}
            title="JSONデータベースのエクスポート"
            className="p-2.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg transition shrink-0 cursor-pointer"
            id="btn-list-export"
          >
            <FileDown className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={onImportClick}
            title="JSONデータベースのインポート"
            className="p-2.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg transition shrink-0 cursor-pointer"
            id="btn-list-import"
          >
            <FileUp className="w-4.5 h-4.5" />
          </button>
          <input
            type="file"
            ref={fileInputRef as React.RefObject<HTMLInputElement>}
            onChange={onFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* 動的タグクラウド行 */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs" id="list-tag-cloud">
        <span className="text-slate-400 font-medium flex items-center mr-1 font-sans">
          <Tag className="w-3.5 h-3.5 mr-1" />
          タグ：
        </span>
        <button
          onClick={onResetTags}
          className={`px-2.5 py-1 rounded-md transition font-sans cursor-pointer flex items-center space-x-1 ${
            selectedTags.length === 0
              ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-medium'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <span>すべて表示</span>
          {selectedTags.length > 0 && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-rose-500 text-white rounded-full font-bold">
              リセット
            </span>
          )}
        </button>
        {allTags.map(tag => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`px-2.5 py-1 rounded-md transition font-sans cursor-pointer border ${
                isSelected
                  ? 'bg-indigo-600 dark:bg-indigo-600 text-white font-medium border-indigo-600 dark:border-indigo-500 shadow-sm'
                  : 'bg-indigo-50/80 dark:bg-slate-800/90 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-slate-700 border-indigo-200/80 dark:border-slate-700'
              }`}
            >
              #{tag}
            </button>
          );
        })}
      </div>

      {/* 削除済みトグル & データベース件数・性能診断フッター */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 font-sans">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => onToggleShowDeleted(e.target.checked)}
            className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            id="checkbox-show-deleted"
          />
          <span className="flex items-center text-slate-600 dark:text-slate-300 font-medium">
            <History className="w-3.5 h-3.5 mr-1 text-slate-400" />
            削除した定型文を表示する
          </span>
        </label>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400 flex items-center">
            <Database className="w-3.5 h-3.5 mr-1" />
            データベース件数: {totalSnippetsCount}件 (フィルタ一致: {filteredSnippetsCount}件)
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <button
            onClick={onGoToPerformance}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline font-medium cursor-pointer"
          >
            JSON/DB性能診断 →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SnippetSearchBar;
