/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ClipboardList,
  Layers,
  ArrowLeftRight,
  Combine,
  Plus,
  HelpCircle,
  Database,
  CheckCircle,
  AlertCircle,
  Activity,
  FileText,
  // UPDATE 2026-06-30: ダークモード切り替え用の太陽・月アイコンを追加
  Sun,
  Moon,
  X
} from 'lucide-react';
import { useSnippets } from './hooks/useSnippets';
import packageJson from '../package.json';

// モジュール化されたカスタムコンポーネントをインポート
import SnippetList from './components/SnippetList';
import SnippetForm from './components/SnippetForm';
import SnippetCompare from './components/SnippetCompare';
import SnippetMerge from './components/SnippetMerge';
import StatsPanel from './components/StatsPanel';

export default function App() {
  const {
    isTauri,
    isDarkMode,
    themeMode,
    setThemeMode,
    snippets,
    activeTab,
    setActiveTab,
    selectedSnippetId,
    setSelectedSnippetId,
    selectedMergeIds,
    setSelectedMergeIds,
    compareIds,
    setCompareIds,
    sortCriterion,
    setSortCriterion,
    queryTimeMs,
    setQueryTimeMs,
    toasts,
    nextId,
    handleCloseApp,
    handleMinimizeApp,
    handleCopyText,
    handleSaveSnippet,
    handleSoftDeleteSnippet,
    handleRestoreSnippet,
    handleHardDeleteSnippet,
    handleBulkSoftDeleteSnippets,
    handleBulkRestoreSnippets,
    handleBulkHardDeleteSnippets,
    handleTogglePin,
    handleGenerateMock,
    handleClearMock,
    handleImportJSON,
  } = useSnippets();

  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    // UPDATE 2026-06-30: isDarkMode変数に応じて .dark クラスをルートに追加。Tailwind v4のダークモード制御を有効化します。
    <div className={`h-screen overflow-hidden ${isDarkMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-50 text-slate-800'} flex flex-col font-sans transition-colors duration-200`} id="app-container">
      
      {/* トースト通知のポップアップ表示コンテナ */}
      <div className="fixed top-5 right-5 space-y-2 z-50 max-w-sm w-full" id="toast-container">
        {toasts.map(toast => (
          <div
            key={toast.id}
            // UPDATE 2026-06-30: トーストポップアップもダークモードの配色（dark:bg-slate-900 dark:border-slate-800）に対応
            className={`p-3.5 rounded-xl shadow-lg border text-xs font-sans font-medium flex items-start space-x-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 transform transition-all duration-300 animate-slide-in ${
              toast.type === 'success'
                ? 'border-emerald-200 dark:border-emerald-900/50 text-emerald-850 dark:text-emerald-400'
                : toast.type === 'error'
                ? 'border-rose-200 dark:border-rose-900/50 text-rose-850 dark:text-rose-400'
                : 'border-blue-200 dark:border-blue-900/50 text-blue-850 dark:text-blue-400'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-555 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-555 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Activity className="w-4 h-4 text-blue-555 shrink-0 mt-0.5" />}
            <span className="flex-1">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* ヘルプダイアログモーダル */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" id="help-modal">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                <HelpCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">SnippetFlow ヘルプ</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">SnippetFlow</span>
                  <span className="px-2 py-0.5 bg-indigo-600 text-white font-mono rounded text-[10px]">v{packageJson.version}</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  定型文クリップボード・マネージャー ({isTauri ? 'Tauri Desktop Native' : 'Web Runtime'})
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-1.5">
                  <span>⌨️ キーボードショートカット</span>
                </h4>
                <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    <span className="font-sans">新しい定型文を登録</span>
                    <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">Ctrl + N</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    <span className="font-sans">検索キーワードにフォーカス</span>
                    <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">Ctrl + F</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    <span className="font-sans">ダイアログ・モーダルを閉じる</span>
                    <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">Esc</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-1.5">
                  <span>📜 システム・ログ情報</span>
                </h4>
                <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[10px] rounded-xl space-y-1 overflow-x-auto border border-slate-800">
                  <div>[SYS] Application Initialized (v{packageJson.version})</div>
                  <div>[SYS] Environment: {isTauri ? 'Tauri Desktop Windows Client' : 'Browser Web App'}</div>
                  <div>[DB]  Active Snippets: {snippets.length} records</div>
                  <div>[CFG] Theme Mode: {themeMode} (Current: {isDarkMode ? 'Dark' : 'Light'})</div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
 
      <header data-tauri-drag-region className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-950 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm dark:shadow-md cursor-default select-none">
        <div data-tauri-drag-region className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-inner">
            <ClipboardList className="w-6 h-6" id="app-logo-icon" />
          </div>
          <div data-tauri-drag-region>
            <h1 data-tauri-drag-region className="text-base font-bold font-sans tracking-wide text-slate-900 dark:text-white leading-none" id="app-title-header">
              SnippetFlow
            </h1>
            <p data-tauri-drag-region className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
              JSON Database Engine ver {packageJson.version} • Local Client Edition
            </p>
          </div>
        </div>
 
        {/* アプリ上部の共通ナビゲーションタブおよび各種操作ボタン */}
        <div className="flex items-center gap-2.5">
          <nav className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => {
                setActiveTab('list');
                setSelectedSnippetId(undefined);
              }}
              className={`px-3.5 py-1.5 rounded-md font-medium transition cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900'
              }`}
            >
              定型文一覧
            </button>
            
            <button
              onClick={() => {
                setSelectedSnippetId(undefined);
                setActiveTab('create');
              }}
              className={`px-3.5 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center space-x-1 ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900'
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>新規登録</span>
            </button>
  
            <button
              onClick={() => {
                setActiveTab('compare');
              }}
              className={`px-3.5 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center space-x-1 ${
                activeTab === 'compare'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>差分比較</span>
            </button>
  
            <button
              onClick={() => {
                setActiveTab('merge');
              }}
              className={`px-3.5 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center space-x-1 ${
                activeTab === 'merge'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900'
              }`}
            >
              <Combine className="w-3 h-3" />
              <span>複数結合</span>
            </button>
  
            <button
              onClick={() => {
                setActiveTab('performance');
              }}
              className={`px-3.5 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center space-x-1 ${
                activeTab === 'performance'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>性能メーター</span>
            </button>
          </nav>
 
          {/* 表示カラー（テーマ）設定 - QuMaEditor風リスト選択 */}
          <div className="relative inline-block text-xs">
            <select
              value={themeMode}
              onChange={(e) => setThemeMode(e.target.value as 'light' | 'dark' | 'system')}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition cursor-pointer font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500"
              id="select-theme-mode"
              title="表示カラー設定"
            >
              <option value="light">☀️ ライト</option>
              <option value="dark">🌙 ダーク</option>
              <option value="system">💻 OS設定</option>
            </select>
          </div>

          {/* QuMaEditorスタイルのヘルプボタン */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-1.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition shrink-0 cursor-pointer flex items-center justify-center"
            title="ヘルプ（ショートカット・ログ・バージョン）"
            id="btn-help-modal"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </button>

          {/* ウィンドウ最小化ボタン */}
          {isTauri && (
            <button
              onClick={handleMinimizeApp}
              className="p-1.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition shrink-0 cursor-pointer flex items-center justify-center"
              title="ウィンドウを最小化"
              id="btn-minimize-app"
            >
              <span className="font-bold text-xs leading-none select-none px-0.5">ー</span>
            </button>
          )}

          {isTauri && (
            <button
              onClick={handleCloseApp}
              className="p-1.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg transition shrink-0 cursor-pointer flex items-center justify-center"
              title="アプリを閉じる"
              id="btn-close-app"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* メインのアプリケーション表示エリア */}
      <main className="flex-1 max-w-7xl w-full mx-auto flex flex-col overflow-hidden">
        {activeTab === 'list' ? (
          <SnippetList
            snippets={snippets}
            sortCriterion={sortCriterion}
            onSortCriterionChange={setSortCriterion}
            onAddSnippet={() => {
              setSelectedSnippetId(undefined);
              setActiveTab('create');
            }}
            onEditSnippet={(id) => {
              setSelectedSnippetId(id);
              setActiveTab('edit');
            }}
            onCopyText={handleCopyText}
            onTogglePin={handleTogglePin}
            onGoToCompare={(idA, idB) => {
              setCompareIds({ idA, idB });
              setActiveTab('compare');
            }}
            onGoToMerge={(ids) => {
              setSelectedMergeIds(ids);
              setActiveTab('merge');
            }}
            onGoToPerformance={() => setActiveTab('performance')}
            onImportJSON={handleImportJSON}
            onRecordQueryTime={setQueryTimeMs}
            onBulkSoftDelete={handleBulkSoftDeleteSnippets}
            onBulkRestore={handleBulkRestoreSnippets}
            onBulkHardDelete={handleBulkHardDeleteSnippets}
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 min-h-0">
            {/* スニペットの新規登録・編集フォーム画面 */}
            {(activeTab === 'create' || activeTab === 'edit') && (
              <SnippetForm
                snippet={snippets.find(s => s.id === selectedSnippetId)}
                onSave={handleSaveSnippet}
                onSoftDelete={handleSoftDeleteSnippet}
                onRestore={handleRestoreSnippet}
                onHardDelete={handleHardDeleteSnippet}
                onCancel={() => {
                  setActiveTab('list');
                  setSelectedSnippetId(undefined);
                }}
                nextId={nextId}
                // UPDATE 2026-06-30: タグ自動提案機能に既存のすべての定型文データを渡す
                snippets={snippets}
              />
            )}

            {/* 2つの定型文の差分比較画面 */}
            {activeTab === 'compare' && (
              <SnippetCompare
                snippets={snippets}
                initialSnippetAId={compareIds.idA}
                initialSnippetBId={compareIds.idB}
                onBack={() => {
                  setCompareIds({});
                  setActiveTab('list');
                }}
                onCopyText={handleCopyText}
              />
            )}

            {/* 複数定型文の結合マージ画面 */}
            {activeTab === 'merge' && (
              <SnippetMerge
                snippets={snippets}
                selectedSnippetIds={selectedMergeIds}
                onBack={() => {
                  setSelectedMergeIds([]);
                  setActiveTab('list');
                }}
                onCopyText={handleCopyText}
              />
            )}

            {/* 性能メーター・パフォーマンステスト画面 */}
            {activeTab === 'performance' && (
              <StatsPanel
                snippets={snippets}
                onGenerateMock={handleGenerateMock}
                onClearMock={handleClearMock}
                queryTimeMs={queryTimeMs}
              />
            )}
          </div>
        )}
      </main>

      {/* デスクトップアプリ用のフッター */}
      {/* UPDATE 2026-06-30: フッターの配色をダークモード（dark:bg-slate-900 dark:border-slate-800）に対応。全体のトーンを均一にします */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800 py-3.5 px-6 text-center text-xs text-slate-400 dark:text-slate-500 font-sans flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
        <span>© 2026 定型文クリップボード・マネージャー • すべてのデータは安全にローカル保存されます</span>
        <div className="flex items-center space-x-3 text-slate-400 dark:text-slate-500">
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            データベース接続中 (LocalStorage)
          </span>
        </div>
      </footer>

    </div>
  );
}
