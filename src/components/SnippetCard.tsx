/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Copy, Check, Edit2, Pin } from 'lucide-react';
import { Snippet } from '../types';

/**
 * 検索キーワードに一致する文字列をカラーハイライト表示する関数。
 */
export const highlightText = (text: string, highlight: string) => {
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

export interface SnippetCardProps {
  /** スニペットデータ */
  snippet: Snippet;
  /** 複数選択チェック中フラグ */
  isSelected: boolean;
  /** 検索文字列（ハイライト用） */
  searchText: string;
  /** 直近にコピーされたスニペットのID */
  copiedId: number | null;
  /** 編集画面遷移ハンドラー */
  onEditSnippet: (id: number) => void;
  /** 選択トグルハンドラー */
  onToggleSelect: (id: number) => void;
  /** 単一コピーハンドラー */
  onCopySingle: (e: React.MouseEvent, snippet: Snippet) => void;
  /** ピン留めトグルハンドラー */
  onTogglePin: (id: number) => void;
  /** タグ絞り込みトグルハンドラー */
  onToggleTag: (tag: string) => void;
  /** マウス移動ハンドラー（ツールチップ表示用） */
  onMouseMoveSnippet: (e: React.MouseEvent, snippet: Snippet) => void;
  /** マウス離脱ハンドラー（ツールチップ非表示用） */
  onMouseLeaveSnippet: () => void;
}

/**
 * 個別スニペットカードの描画コンポーネント。
 */
export const SnippetCard: React.FC<SnippetCardProps> = ({
  snippet,
  isSelected,
  searchText,
  copiedId,
  onEditSnippet,
  onToggleSelect,
  onCopySingle,
  onTogglePin,
  onToggleTag,
  onMouseMoveSnippet,
  onMouseLeaveSnippet,
}) => {
  return (
    <div
      onClick={() => onEditSnippet(snippet.id)}
      onMouseMove={(e) => onMouseMoveSnippet(e, snippet)}
      onMouseLeave={onMouseLeaveSnippet}
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
      {/* チェックボックスと左側コンテンツ */}
      <div className="flex items-start space-x-3.5 flex-1 min-w-0">
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (!snippet.isDeleted) {
              onToggleSelect(snippet.id);
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

          {/* 本文プレビュー */}
          <p className={`text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-mono ${snippet.isDeleted ? 'opacity-50' : ''}`}>
            {highlightText(snippet.content, searchText)}
          </p>

          {/* タグ一覧 */}
          {snippet.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {snippet.tags.map(t => (
                <span
                  key={t}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTag(t);
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

      {/* 右側エリア：更新日およびアクションボタン群 */}
      <div className="flex flex-row md:flex-col items-start md:items-end justify-between w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 gap-2">
        <span className="text-[10px] text-slate-400 font-sans text-left md:text-right">
          更新: {new Date(snippet.updatedAt).toLocaleDateString('ja-JP')}
        </span>

        <div className="flex items-center space-x-1.5">
          {/* コピーボタン */}
          <button
            onClick={(e) => onCopySingle(e, snippet)}
            title={copiedId === snippet.id ? "コピー完了！" : "クリップボードへコピー"}
            aria-label={copiedId === snippet.id ? "コピー完了" : "クリップボードへコピー"}
            className={`inline-flex items-center justify-center p-2 rounded-lg transition ${
              copiedId === snippet.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white cursor-pointer'
            }`}
          >
            {copiedId === snippet.id ? (
              <Check className="w-4 h-4 animate-bounce" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* 編集ボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditSnippet(snippet.id);
            }}
            title="編集画面へ"
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* ピン留めボタン */}
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
};

export default SnippetCard;
