/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Zap, HardDrive, BarChart3, ShieldAlert, Sparkles } from 'lucide-react';
import { Snippet } from '../types';

interface StatsPanelProps {
  snippets: Snippet[];
  onGenerateMock: (count: number) => void;
  onClearMock: () => void;
  queryTimeMs: number;
}

export default function StatsPanel({
  snippets,
  onGenerateMock,
  onClearMock,
  queryTimeMs,
}: StatsPanelProps) {
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchTime, setBenchTime] = useState<number | null>(null);

  const totalCount = snippets.length;
  const activeCount = snippets.filter(s => !s.isDeleted).length;
  const deletedCount = snippets.filter(s => s.isDeleted).length;

  // Calculate approximate database size in bytes
  const serializedSize = JSON.stringify(snippets).length;
  const kbSize = (serializedSize / 1024).toFixed(2);

  // Simple benchmark runner: runs search 100 times to get average speed
  const runBenchmark = () => {
    setBenchmarking(true);
    setTimeout(() => {
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        // Mock a complex search query: filtering by tag 'ビジネス' and title contains 'テスト'
        snippets.filter(s => 
          (s.title.toLowerCase().includes('自動生成') || s.content.includes('〇〇')) &&
          s.tags.some(t => t.includes('ビジネス') || t.includes('開発'))
        );
      }
      const end = performance.now();
      setBenchTime(Number(((end - start) / 100).toFixed(4)));
      setBenchmarking(false);
    }, 100);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 max-w-4xl mx-auto" id="stats-panel-root">
      {/* UPDATE 2026-06-30: 診断器カードをダークモード（dark:bg-slate-900 dark:border-slate-800）に対応 */}
      {/* UPDATE 2026-06-30: 区切り境界線をダークモードに対応 */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          {/* UPDATE 2026-06-30: アイコン背景をダークモードに対応 */}
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">
            <Database className="w-5 h-5" id="stats-db-icon" />
          </div>
          <div>
            {/* UPDATE 2026-06-30: タイトル色をダークモード（dark:text-slate-100）に対応 */}
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 font-sans" id="stats-title">データベース・パフォーマンス診断器</h2>
            {/* UPDATE 2026-06-30: サブタイトルをダークモード（dark:text-slate-400）に対応 */}
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans" id="stats-sub">JSON/DBの読込速度・容量計測と大量データ検証</p>
          </div>
        </div>
        {/* UPDATE 2026-06-30: バッジをダークモードに対応 */}
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
          <Zap className="w-3 h-3 mr-1" />
          現在最適化済み
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" id="stats-grid">
        {/* UPDATE 2026-06-30: 各メトリクスカードをダークモード（dark:bg-slate-950 dark:border-slate-800）に対応 */}
        <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-400 font-sans">総定型文数 (レコード数)</div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-100 mt-1 font-mono">{totalCount} <span className="text-sm font-normal text-slate-400">件</span></div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            有効: {activeCount} / 削除済: {deletedCount}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-400 font-sans">推測ファイルサイズ (JSON)</div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-100 mt-1 font-mono">{kbSize} <span className="text-sm font-normal text-slate-400">KB</span></div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            ブラウザ容量上限: 約 5,000 KB (5MB)
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-400 font-sans">直近の検索クエリ速度</div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-100 mt-1 font-mono">
            {queryTimeMs < 0.1 ? '< 0.1' : queryTimeMs.toFixed(2)} <span className="text-sm font-normal text-slate-400">ms</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            超高速 (推奨: 16ms以内)
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-400 font-sans">100回試行平均検索速度</div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-100 mt-1 font-mono">
            {benchTime !== null ? `${benchTime} ms` : '未計測'}
          </div>
          {/* UPDATE 2026-06-30: リンク文字色をダークモード（dark:text-indigo-400 dark:hover:text-indigo-300）に対応 */}
          <button
            onClick={runBenchmark}
            disabled={benchmarking}
            className="text-[11px] text-blue-600 dark:text-indigo-400 hover:text-blue-700 dark:hover:text-indigo-300 font-medium mt-1 underline focus:outline-none cursor-pointer"
            id="btn-run-benchmark"
          >
            {benchmarking ? '計測中...' : 'ベンチマーク実行'}
          </button>
        </div>
      </div>

      {/* Load Testing Area */}
      {/* UPDATE 2026-06-30: 負荷テストカード背景をダークモード（dark:bg-slate-950 dark:border-slate-800）に対応 */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-5 border border-slate-100 dark:border-slate-800 mb-8" id="stats-load-testing">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-2 mb-2 font-sans">
          <BarChart3 className="w-4 h-4 text-indigo-500" />
          <span>大量データ負荷テスト（動作が重いかどうかの検証）</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
          「JSON保存で件数が増えると重くならないか、検索が遅くならないか」という懸念を検証するため、一時的に大量の擬似データ（ダミー定型文）を追加できます。1,000件や5,000件のデータを追加し、一覧画面でのフィルタ検索やタグ検索の速度を実際に体験してください。
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => onGenerateMock(1000)}
            className="px-3 py-1.5 bg-indigo-550 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition cursor-pointer"
            id="btn-mock-1000"
          >
            +1,000件追加
          </button>
          <button
            onClick={() => onGenerateMock(2000)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition cursor-pointer"
            id="btn-mock-2000"
          >
            +2,000件追加
          </button>
          <button
            onClick={() => onGenerateMock(5000)}
            className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-medium transition cursor-pointer"
            id="btn-mock-5000"
          >
            +5,000件追加
          </button>
          {/* UPDATE 2026-06-30: 一括削除ボタン背景をダークモード（dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300）に対応 */}
          <button
            onClick={onClearMock}
            disabled={snippets.length <= 5}
            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
            id="btn-mock-clear"
          >
            生成したダミーデータを一括削除
          </button>
        </div>
      </div>

      {/* Architecture Guidance (JSON vs DB) */}
      {/* UPDATE 2026-06-30: 区切り境界線をダークモード（dark:border-slate-800）に対応 */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-6" id="stats-architecture-guide">
        {/* UPDATE 2026-06-30: タイトル色をダークモードに対応 */}
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2 mb-4 font-sans">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>開発計画：JSONからリレーショナルDB（SQL / Rust）への移行指標</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* UPDATE 2026-06-30: アーキテクチャガイドカードをダークモード（dark:bg-slate-950 dark:border-slate-800）に対応 */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-950">
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              {/* UPDATE 2026-06-30: カード内タイトルをダークモードに対応 */}
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">1. 〜3,000件 (JSON / Local)</h4>
            </div>
            {/* UPDATE 2026-06-30: カード内テキストをダークモードに対応 */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong>推奨構成：JSON / localStorage</strong>
              <br />
              ファイルサイズ is 1MB 未満に収まり、メモリ上での検索は常に <strong className="text-emerald-600 dark:text-emerald-400 font-mono">1ms未満</strong> で完了します。インフラやバックエンドは一切不要で、動作が重くなる心配はありません。
            </p>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-950">
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              {/* UPDATE 2026-06-30: カード内タイトルをダークモードに対応 */}
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">2. 3,000〜1万件 (軽量DB / Rust)</h4>
            </div>
            {/* UPDATE 2026-06-30: カード内テキストをダークモードに対応 */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong>推奨構成：SQLite / Rust Tauri</strong>
              <br />
              localStorage の容量制限（5MB）に近づくため、デスクトップアプリ（Rust Tauri）と埋め込み型データベース（SQLite / SQL）への移行を推奨します。インデックスにより検索速度は超高速を維持できます。
            </p>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-950">
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              {/* UPDATE 2026-06-30: カード内タイトルをダークモードに対応 */}
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">3. 1万件以上 or 複数ユーザー</h4>
            </div>
            {/* UPDATE 2026-06-30: カード内テキストをダークモードに対応 */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong>推奨構成：PostgreSQL (Cloud SQL)</strong>
              <br />
              サーバー側でデータを一元管理し、複数端末での自動同期、チーム間での定型文共有、高度なフルテキスト検索（PGroonga等）を実装する場合の選択肢です。堅牢なトランザクションが保証されます。
            </p>
          </div>
        </div>

        {/* UPDATE 2026-06-30: アドバイス枠の背景・枠線をダークモード（dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-300）に対応 */}
        <div className="mt-5 p-3.5 bg-blue-50 dark:bg-indigo-950/20 border border-blue-100 dark:border-indigo-900/40 rounded-xl flex items-start space-x-3 text-xs text-blue-800 dark:text-indigo-300 leading-relaxed">
          <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <strong>アドバイス：</strong>
            まずは現在の <strong>JSON + LocalStorage 構成</strong> で開発をスタートし、容量が 2MB を超えたり、複数PCでの同期が必要になった段階で <strong>Tauri（Rust + SQLite）</strong> への移植を行うアプローチが、開発コストを抑えつつ最大のパフォーマンスを得られるため最もお勧めです。
          </div>
        </div>
      </div>
    </div>
  );
}
