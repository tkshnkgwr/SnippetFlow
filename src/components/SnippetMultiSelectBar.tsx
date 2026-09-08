/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowLeftRight,
  Combine,
  History,
  Trash2,
} from 'lucide-react';

export interface SnippetMultiSelectBarProps {
  /** 選択中のスニペットID一覧 */
  selectedIds: number[];
  /** 削除済みスニペット表示中フラグ */
  showDeleted: boolean;
  /** 差分比較画面遷移ハンドラー */
  onGoToCompare: (idA: number, idB: number) => void;
  /** 複数マージ画面遷移ハンドラー */
  onGoToMerge: (ids: number[]) => void;
  /** 一括復元ハンドラー */
  onBulkRestore?: (ids: number[]) => void;
  /** 一括完全削除ハンドラー */
  onBulkHardDelete?: (ids: number[]) => void;
  /** 一括論理削除ハンドラー */
  onBulkSoftDelete?: (ids: number[]) => void;
  /** 選択解除ハンドラー */
  onClearSelection: () => void;
}

/**
 * 複数選択時に画面下部にフロート表示される一括操作アクションバー。
 */
export const SnippetMultiSelectBar: React.FC<SnippetMultiSelectBarProps> = ({
  selectedIds,
  showDeleted,
  onGoToCompare,
  onGoToMerge,
  onBulkRestore,
  onBulkHardDelete,
  onBulkSoftDelete,
  onClearSelection,
}) => {
  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center justify-between gap-4 border border-slate-800 shrink-0 z-50 animate-slide-up">
      <div className="flex items-center space-x-2 text-xs font-sans">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
        <span><strong>{selectedIds.length}</strong> 件選択中</span>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        {/* 比較ボタン (2件選択時のみ有効) */}
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
          <span>比較</span>
        </button>

        {/* 結合ボタン */}
        <button
          onClick={() => onGoToMerge(selectedIds)}
          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold transition cursor-pointer"
          title="複数を選択して順序よく結合"
        >
          <Combine className="w-3.5 h-3.5" />
          <span>結合</span>
        </button>

        {/* ゴミ箱表示中の場合：一括復元 / 一括完全削除 */}
        {showDeleted ? (
          <>
            {onBulkRestore && (
              <button
                onClick={() => {
                  onBulkRestore(selectedIds);
                  onClearSelection();
                }}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold transition cursor-pointer"
                title="選択した定型文を元通り復元"
              >
                <History className="w-3.5 h-3.5" />
                <span>まとめて復元</span>
              </button>
            )}
            {onBulkHardDelete && (
              <button
                onClick={() => {
                  if (confirm(`選択した ${selectedIds.length} 件の定型文を完全に削除しますか？この操作は取り消せません。`)) {
                    onBulkHardDelete(selectedIds);
                    onClearSelection();
                  }
                }}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-xs font-bold transition cursor-pointer"
                title="データベースから永久削除"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>完全削除</span>
              </button>
            )}
          </>
        ) : (
          /* 通常時：まとめてゴミ箱へ移動（論理削除） */
          onBulkSoftDelete && (
            <button
              onClick={() => {
                if (confirm(`選択した ${selectedIds.length} 件の定型文をゴミ箱に移動しますか？`)) {
                  onBulkSoftDelete(selectedIds);
                  onClearSelection();
                }
              }}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-xs font-bold transition cursor-pointer"
              title="選択した定型文をまとめてゴミ箱へ移動"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>まとめて削除</span>
            </button>
          )
        )}

        {/* 選択解除 */}
        <button
          onClick={onClearSelection}
          className="text-xs text-slate-400 hover:text-white px-1.5 transition cursor-pointer font-sans"
        >
          解除
        </button>
      </div>
    </div>
  );
};

export default SnippetMultiSelectBar;
