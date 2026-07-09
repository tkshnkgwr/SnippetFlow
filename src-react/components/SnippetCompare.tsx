/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Copy, Check, FileText, Split, ArrowLeft } from 'lucide-react';
import { Snippet } from '../types';
import { computeDiff, DiffPart } from '../utils';

interface SnippetCompareProps {
  snippets: Snippet[];
  initialSnippetAId?: number;
  initialSnippetBId?: number;
  onBack: () => void;
  onCopyText: (text: string, label: string, id?: number | number[]) => void;
}

export default function SnippetCompare({
  snippets,
  initialSnippetAId,
  initialSnippetBId,
  onBack,
  onCopyText,
}: SnippetCompareProps) {
  // デフォルトではアーカイブ（論理削除）されていないスニペット同士を比較対象とします（初期ロード時を除く）
  const availableSnippets = snippets.filter(s => !s.isDeleted || s.id === initialSnippetAId || s.id === initialSnippetBId);

  const [snippetAId, setSnippetAId] = useState<number>(
    initialSnippetAId || availableSnippets[0]?.id || 0
  );
  const [snippetBId, setSnippetBId] = useState<number>(
    initialSnippetBId || availableSnippets[1]?.id || availableSnippets[0]?.id || 0
  );

  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);

  const snippetA = snippets.find(s => s.id === snippetAId);
  const snippetB = snippets.find(s => s.id === snippetBId);

  const [diffParts, setDiffParts] = useState<DiffPart[]>([]);

  useEffect(() => {
    if (snippetA && snippetB) {
      const parts = computeDiff(snippetA.content, snippetB.content);
      setDiffParts(parts);
    } else {
      setDiffParts([]);
    }
  }, [snippetAId, snippetBId, snippets, snippetA, snippetB]);

  const handleSwap = () => {
    const temp = snippetAId;
    setSnippetAId(snippetBId);
    setSnippetBId(temp);
  };

  const handleCopyA = () => {
    if (snippetA) {
      onCopyText(snippetA.content, '比較元(A)の定型文', snippetA.id);
      setCopiedA(true);
      setTimeout(() => setCopiedA(false), 2000);
    }
  };

  const handleCopyB = () => {
    if (snippetB) {
      onCopyText(snippetB.content, '比較先(B)の定型文', snippetB.id);
      setCopiedB(true);
      setTimeout(() => setCopiedB(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" id="snippet-compare-root">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* UPDATE 2026-06-30: 戻るボタンの文字色をダークモード（dark:text-slate-400 dark:hover:text-slate-200）に対応 */}
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-medium transition cursor-pointer"
          id="btn-compare-back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>一覧画面に戻る</span>
        </button>
        <span className="text-xs text-slate-400 font-sans">
          選択された2つの定型文の差分をリアルタイム比較
        </span>
      </div>

      {/* Snippet Selection Selector Header */}
      {/* UPDATE 2026-06-30: 比較対象セレクトボックスカードをダークモード（dark:bg-slate-900 dark:border-slate-800）に対応 */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Selector A */}
        <div className="w-full md:w-5/12">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider font-sans">比較元 (A) - 変更前</label>
          {/* UPDATE 2026-06-30: セレクトボックスをダークモード（dark:bg-slate-950 dark:text-slate-200 dark:border-slate-850 dark:hover:bg-slate-900）に対応 */}
          <select
            value={snippetAId}
            onChange={(e) => setSnippetAId(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            id="compare-select-a"
          >
            <option value="0">定型文を選択してください</option>
            {availableSnippets.map(s => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.tags.slice(0, 1).join('') || 'タグ無'})
              </option>
            ))}
          </select>
        </div>

        {/* Swap Action Button */}
        {/* UPDATE 2026-06-30: Swapボタンをダークモード（dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750）に対応 */}
        <button
          onClick={handleSwap}
          className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full transition focus:outline-none cursor-pointer"
          title="左右の定型文を入れ替える"
          id="btn-compare-swap"
        >
          <ArrowLeftRight className="w-5 h-5" />
        </button>

        {/* Selector B */}
        <div className="w-full md:w-5/12">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider font-sans">比較先 (B) - 変更後</label>
          {/* UPDATE 2026-06-30: セレクトボックスBをダークモードに対応 */}
          <select
            value={snippetBId}
            onChange={(e) => setSnippetBId(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            id="compare-select-b"
          >
            <option value="0">定型文を選択してください</option>
            {availableSnippets.map(s => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.tags.slice(0, 1).join('') || 'タグ無'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Content Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card A */}
        {/* UPDATE 2026-06-30: 比較元Aカードをダークモードに対応 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[400px]">
          {/* UPDATE 2026-06-30: 比較元Aカードヘッダーをダークモードに対応 */}
          <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2 overflow-hidden mr-2">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm truncate font-sans">
                {snippetA ? snippetA.title : '未選択'}
              </span>
            </div>
            {snippetA && (
              <button
                onClick={handleCopyA}
                // UPDATE 2026-06-30: コピーボタンをダークモード（dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200）に対応
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
                title="Aの本文をコピー"
                id="btn-compare-copy-a"
              >
                {copiedA ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
          {/* UPDATE 2026-06-30: 本文表示エリア背景色をダークモード（dark:bg-slate-950/40）に対応 */}
          <div className="p-4 overflow-y-auto flex-1 bg-slate-50/30 dark:bg-slate-950/40">
            {snippetA ? (
              // UPDATE 2026-06-30: プレビューテキストの文字色をダークモード（dark:text-slate-300）に対応
              <pre className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap font-mono leading-relaxed break-all">
                {snippetA.content}
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-sans">
                比較元 (A) を選択してください
              </div>
            )}
          </div>
        </div>

        {/* Card B */}
        {/* UPDATE 2026-06-30: Bカード全体をダークモード（dark:bg-slate-900 dark:border-slate-800）に対応 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[400px]">
          {/* UPDATE 2026-06-30: Bカードヘッダーをダークモードに対応 */}
          <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2 overflow-hidden mr-2">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm truncate font-sans">
                {snippetB ? snippetB.title : '未選択'}
              </span>
            </div>
            {snippetB && (
              <button
                onClick={handleCopyB}
                // UPDATE 2026-06-30: コピーボタンをダークモード（dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200）に対応
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
                title="Bの本文をコピー"
                id="btn-compare-copy-b"
              >
                {copiedB ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
          {/* UPDATE 2026-06-30: 本文表示エリア背景色をダークモード（dark:bg-slate-950/40）に対応 */}
          <div className="p-4 overflow-y-auto flex-1 bg-slate-50/30 dark:bg-slate-950/40">
            {snippetB ? (
              // UPDATE 2026-06-30: プレビューテキストの文字色をダークモード（dark:text-slate-300）に対応
              <pre className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap font-mono leading-relaxed break-all">
                {snippetB.content}
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-sans">
                比較先 (B) を選択してください
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Line-by-Line Difference Analysis */}
      {/* UPDATE 2026-06-30: 差分ビューアーカードをダークモード（dark:bg-slate-900 dark:border-slate-800）に対応 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-slate-100 px-4 py-3 border-b border-slate-800 flex items-center space-x-2 shrink-0">
          <Split className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-sm font-sans">差分分析ビューアー (LCS行比較)</h3>
        </div>
        <div className="p-5 bg-slate-950 font-mono text-sm overflow-y-auto max-h-[300px]">
          {snippetA && snippetB ? (
            <div className="space-y-1">
              {diffParts.map((part, index) => {
                if (part.type === 'added') {
                  return (
                    <div
                      key={index}
                      className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border-l-4 border-emerald-500 whitespace-pre-wrap break-all"
                    >
                      + {part.value || ' '}
                    </div>
                  );
                } else if (part.type === 'removed') {
                  return (
                    <div
                      key={index}
                      className="px-2 py-0.5 bg-rose-950 text-rose-300 border-l-4 border-rose-500 line-through whitespace-pre-wrap break-all"
                    >
                      - {part.value || ' '}
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={index}
                      className="px-2 py-0.5 text-slate-400 border-l-4 border-transparent whitespace-pre-wrap break-all"
                    >
                        {part.value || ' '}
                    </div>
                  );
                }
              })}
              {diffParts.length === 0 && (
                <div className="text-slate-500 text-center py-6 font-sans">
                  本文は完全に一致しています
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500 text-center py-6 font-sans">
              2つの定型文を選択すると、ここに差分（追加行：緑、削除行：赤）が表示されます
            </div>
          )}
        </div>
        {/* UPDATE 2026-06-30: 差分ビューアーのヘルプフッターをダークモード（dark:bg-slate-950 dark:border-slate-850 dark:text-slate-400）に対応 */}
        <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2.5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-sans">
          <span>※行全体の差分で計算されるため、少しの変更でも行全体が差分として検出されます。</span>
          <span className="flex space-x-4">
            <span className="flex items-center"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm mr-1"></span>追加された行</span>
            <span className="flex items-center"><span className="w-2.5 h-2.5 bg-rose-500 rounded-sm mr-1"></span>変更・削除された行</span>
          </span>
        </div>
      </div>
    </div>
  );
}
