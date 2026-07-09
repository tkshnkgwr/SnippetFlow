/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, ChevronUp, ChevronDown, ListPlus, FileText } from 'lucide-react';
import { Snippet } from '../types';

interface SnippetMergeProps {
  snippets: Snippet[];
  selectedSnippetIds: number[];
  onBack: () => void;
  onCopyText: (text: string, label: string, id?: number | number[]) => void;
}

export default function SnippetMerge({
  snippets,
  selectedSnippetIds,
  onBack,
  onCopyText,
}: SnippetMergeProps) {
  // アーカイブ（論理削除）されていない有効なスニペットのみ結合対象とする
  const activeSnippets = snippets.filter(s => !s.isDeleted);

  // 選択されたスニペットIDの順序リストを保持
  const [orderedIds, setOrderedIds] = useState<number[]>([]);
  const [separator, setSeparator] = useState<string>('\n\n');
  const [copied, setCopied] = useState(false);

  // 初期表示時、propsから渡された選択リストがある場合はそれをセットし、無ければ最初の2件をデフォルトにする
  useEffect(() => {
    if (selectedSnippetIds.length > 0) {
      setOrderedIds(selectedSnippetIds);
    } else {
      // 直感的に使い始められるよう、有効なスニペットの最初の2件をデフォルト選択とする
      const defaults = activeSnippets.slice(0, 2).map(s => s.id);
      setOrderedIds(defaults);
    }
  }, [selectedSnippetIds]);

  // 選択/非選択の切り替え処理
  const handleToggleSelect = (id: number) => {
    if (orderedIds.includes(id)) {
      setOrderedIds(prev => prev.filter(item => item !== id));
    } else {
      setOrderedIds(prev => [...prev, id]);
    }
  };

  // リスト内での表示順を1つ上に移動する
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setOrderedIds(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  // リスト内での表示順を1つ下に移動する
  const handleMoveDown = (index: number) => {
    if (index === orderedIds.length - 1) return;
    setOrderedIds(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  // 選択された順序で区切り文字を用いてテキストを結合する
  const getMergedText = () => {
    const selectedSnippets = orderedIds
      .map(id => snippets.find(s => s.id === id))
      .filter((s): s is Snippet => !!s);
    
    return selectedSnippets.map(s => s.content).join(separator);
  };

  const handleCopy = () => {
    const text = getMergedText();
    if (text) {
      onCopyText(text, '結合された定型文', orderedIds);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="snippet-merge-root">
      {/* Back Button Header */}
      <div className="flex items-center justify-between">
        {/* UPDATE 2026-06-30: 戻るボタンの文字色をダークモードに対応 */}
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-medium transition cursor-pointer"
          id="btn-merge-back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>一覧画面に戻る</span>
        </button>
        <span className="text-xs text-slate-400 font-sans">
          複数の定型文を並べ替えて1つにマージ
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Select and Order Templates */}
        <div className="lg:col-span-5 space-y-6">
          {/* List selection checklist */}
          {/* UPDATE 2026-06-30: 選択カード全体をダークモード（dark:bg-slate-900 dark:border-slate-800）に対応 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans mb-1">
              1. 結合する定型文を選択 ({orderedIds.length}件選択中)
            </h3>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {activeSnippets.map(s => {
                const isSelected = orderedIds.includes(s.id);
                return (
                  /* UPDATE 2026-06-30: チェックボックス行の背景をダークモードに対応 */
                  <label
                    key={s.id}
                    className={`flex items-center space-x-3 p-2 rounded-lg border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40 text-indigo-950 dark:text-indigo-200 font-medium'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(s.id)}
                      className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="truncate flex-1">{s.title}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Ordering card */}
          {/* UPDATE 2026-06-30: 順序カード全体をダークモード（dark:bg-slate-900 dark:border-slate-800）に対応 */}
          {orderedIds.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans mb-1">
                2. 結合順序の調整 (上から順にマージされます)
              </h3>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {orderedIds.map((id, index) => {
                  const s = snippets.find(snippet => snippet.id === id);
                  if (!s) return null;
                  return (
                    /* UPDATE 2026-06-30: 順序リストアイテムの背景をダークモード（dark:bg-slate-950 dark:border-slate-850）に対応 */
                    <div
                      key={id}
                      className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                    >
                      {/* UPDATE 2026-06-30: 順序テキストカラーをダークモード（dark:text-slate-300）に対応 */}
                      <span className="truncate text-slate-700 dark:text-slate-300 font-sans font-medium flex-1 mr-2">
                        {index + 1}. {s.title}
                      </span>
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          // UPDATE 2026-06-30: 順序アップボタンのホバー色をダークモード（dark:hover:bg-slate-800）に対応
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 rounded text-slate-500 dark:text-slate-400 transition cursor-pointer"
                          title="上に移動"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === orderedIds.length - 1}
                          // UPDATE 2026-06-30: 順序ダウンボタンのホバー色をダークモード（dark:hover:bg-slate-800）に対応
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 rounded text-slate-500 dark:text-slate-400 transition cursor-pointer"
                          title="下に移動"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Separator card */}
          {/* UPDATE 2026-06-30: 区切り文字カード全体をダークモード（dark:bg-slate-900 dark:border-slate-800）に対応 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
              3. 区切り文字の選択
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* UPDATE 2026-06-30: ボタンをダークモード（dark:bg-slate-950 dark:border-slate-850 dark:text-slate-400）に対応 */}
              <button
                onClick={() => setSeparator('\n\n')}
                className={`py-1.5 px-2 rounded-lg border font-sans transition cursor-pointer ${
                  separator === '\n\n'
                    ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                改行2つ
              </button>
              {/* UPDATE 2026-06-30: ボタンをダークモードに対応 */}
              <button
                onClick={() => setSeparator('\n')}
                className={`py-1.5 px-2 rounded-lg border font-sans transition cursor-pointer ${
                  separator === '\n'
                    ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                改行1つ
              </button>
              {/* UPDATE 2026-06-30: ボタンをダークモードに対応 */}
              <button
                onClick={() => setSeparator('\n\n---\n\n')}
                className={`py-1.5 px-2 rounded-lg border font-sans transition cursor-pointer ${
                  separator === '\n\n---\n\n'
                    ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                区切り線 (---)
              </button>
              {/* UPDATE 2026-06-30: ボタンをダークモードに対応 */}
              <button
                onClick={() => setSeparator('\n\n====================\n\n')}
                className={`py-1.5 px-2 rounded-lg border font-sans transition cursor-pointer ${
                  separator === '\n\n====================\n\n'
                    ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                区切り線 (===)
              </button>
              {/* UPDATE 2026-06-30: ボタンをダークモードに対応 */}
              <button
                onClick={() => setSeparator('、')}
                className={`py-1.5 px-2 rounded-lg border font-sans transition cursor-pointer ${
                  separator === '、'
                    ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                読点 (、)
              </button>
              {/* UPDATE 2026-06-30: ボタンをダークモードに対応 */}
              <button
                onClick={() => setSeparator('')}
                className={`py-1.5 px-2 rounded-lg border font-sans transition cursor-pointer ${
                  separator === ''
                    ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                区切りなし
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Combined Preview Output */}
        <div className="lg:col-span-7">
          {/* UPDATE 2026-06-30: プレビューカードをダークモード（dark:bg-slate-900 dark:border-slate-800）に対応 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[480px]">
            {/* Output header */}
            {/* UPDATE 2026-06-30: プレビューヘッダーをダークモード（dark:bg-slate-950 dark:border-slate-800）に対応 */}
            <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <ListPlus className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm font-sans">
                  プレビュー（結合結果）
                </span>
              </div>
              {orderedIds.length > 0 && (
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition focus:outline-none cursor-pointer"
                  id="btn-merge-copy"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>コピー完了</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>結果をクリップボードへ</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Output preview area */}
            {/* UPDATE 2026-06-30: プレビュー表示エリア背景色をダークモード（dark:bg-slate-950/40）に対応 */}
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50/30 dark:bg-slate-950/40">
              {orderedIds.length > 0 ? (
                // UPDATE 2026-06-30: プレビューテキストをダークモード（dark:text-slate-300）に対応
                <pre className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap font-mono leading-relaxed break-all">
                  {getMergedText()}
                </pre>
              ) : (
                // UPDATE 2026-06-30: 未選択時プレースホルダーをダークモード（dark:text-slate-500）に対応
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm font-sans text-center space-y-2 py-12">
                  <FileText className="w-12 h-12 text-slate-200 dark:text-slate-800" />
                  <p>結合する定型文を左側の一覧から選択してください。</p>
                  <p className="text-xs text-slate-400 dark:text-slate-600">複数チェックを入れるとここに結合されたプレビューが自動で組み立てられます。</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
