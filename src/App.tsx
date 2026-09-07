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
  X,
  Bot,
  Mail,
  Terminal,
  Sparkles,
  Pin,
  BarChart3,
  Zap
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
  const [helpTab, setHelpTab] = useState<'usecases' | 'features' | 'shortcuts'>('usecases');

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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[88vh]">
            {/* ヘッダー */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                <HelpCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">SnippetFlow 使い方・ヘルプガイド</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
                title="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* サブナビゲーションタブ */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/30 dark:bg-slate-950/30 text-xs font-semibold gap-1">
              <button
                onClick={() => setHelpTab('usecases')}
                className={`px-3.5 py-2.5 border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
                  helpTab === 'usecases'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>💡 活用シーン・基本</span>
              </button>
              <button
                onClick={() => setHelpTab('features')}
                className={`px-3.5 py-2.5 border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
                  helpTab === 'features'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>🛠️ 各機能の詳細（差分・結合・性能）</span>
              </button>
              <button
                onClick={() => setHelpTab('shortcuts')}
                className={`px-3.5 py-2.5 border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
                  helpTab === 'shortcuts'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>⌨️ 操作 & システム</span>
              </button>
            </div>

            {/* モーダルコンテンツ */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
              {/* タブ1: 活用シーン・基本 */}
              {helpTab === 'usecases' && (
                <>
                  {/* アプリ概要 */}
                  <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">SnippetFlow</span>
                      <span className="px-2 py-0.5 bg-indigo-600 text-white font-mono rounded text-[10px]">v{packageJson.version}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      文章・コード・AIプロンプト・定型コマンドを瞬時に検索＆クリップボードへコピーできる超高速定型文マネージャー ({isTauri ? 'Tauri Desktop Native' : 'Web Runtime'})
                    </p>
                  </div>

                  {/* おすすめの活用シーン */}
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>💡 おすすめの活用シーン（こんな使い方が便利！）</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
                        <div className="flex items-center space-x-1.5 font-semibold text-indigo-600 dark:text-indigo-400">
                          <Bot className="w-4 h-4 shrink-0" />
                          <span>AIプロンプトの保存・呼び出し</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 leading-snug">
                          ChatGPT・Claude・Gemini等へ投げるお決まりの指示文、前提ロール設定、長文テンプレートを保存。タグ分けで即座にコピーしてAIとスムーズに対話できます。
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
                        <div className="flex items-center space-x-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                          <Mail className="w-4 h-4 shrink-0" />
                          <span>メール・チャットの定型文</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 leading-snug">
                          「お世話になっております」等の挨拶文、お礼状、顧客への案内文、署名などを登録。日々のメールやSlack、Teamsでの返信作成を爆速化します。
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
                        <div className="flex items-center space-x-1.5 font-semibold text-purple-600 dark:text-purple-400">
                          <Terminal className="w-4 h-4 shrink-0" />
                          <span>定型コマンド・スクリプトの保管</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 leading-snug">
                          忘れがちなGitコマンド、Docker操作、PowerShell/Bashの長文ワンライナーなどをストック。履歴検索の手間をなくし作業効率を高めます。
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
                        <div className="flex items-center space-x-1.5 font-semibold text-sky-600 dark:text-sky-400">
                          <FileText className="w-4 h-4 shrink-0" />
                          <span>一時メモ・クイック保存</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 leading-snug">
                          作業用の一時メモ、よく参照するURLや環境設定値、Markdownの雛形など、手軽にクリップして後ですぐ参照したい情報の保管庫としても最適です。
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 基本操作 */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-1.5">
                      <span>🚀 基本操作と便利な小ワザ</span>
                    </h4>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2 text-[11px]">
                      <div className="flex items-start space-x-2">
                        <Pin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium text-slate-700 dark:text-slate-200">ピン留め（最上位固定）：</span>
                          <span className="text-slate-500 dark:text-slate-400"> 最も頻繁に使う定型文はピン（📌）をクリックすると、検索やソート条件に関わらず常にリストの最上位に固定表示されます。</span>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Layers className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium text-slate-700 dark:text-slate-200">タグクラウドで瞬時に絞り込み：</span>
                          <span className="text-slate-500 dark:text-slate-400"> 登録時にタグ（例: AI, mail, git）を付与しておくと、上部のタグボタンを押すだけで一発で目的の定型文に絞り込めます。</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* タブ2: 各機能の詳細（差分・結合・性能） */}
              {helpTab === 'features' && (
                <div className="space-y-4">
                  {/* 差分比較 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      <ArrowLeftRight className="w-4 h-4" />
                      <span>差分比較（Compare）機能</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      2つのスニペットを行単位・文字単位で比較し、LCS（最長共通部分列）アルゴリズムによって追加行（緑）や変更・削除行（赤）を視覚的にカラーハイライト表示します。
                    </p>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-[11px] space-y-1.5">
                      <div className="font-medium text-slate-800 dark:text-slate-200">📌 こんなシーンで便利：</div>
                      <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 space-y-0.5 pl-1">
                        <li><strong>AIプロンプトの改訂前後比較</strong>：指示文や制約を追加・修正した際のビフォーアフターの差異確認</li>
                        <li><strong>メール文面のバリエーション比較</strong>：丁寧版・簡潔版などのニュアンスの違いを確認</li>
                        <li><strong>コードやコマンドの版管理</strong>：パラメータや設定値がどこ変更されたかのクイック確認</li>
                      </ul>
                      <div className="font-medium text-slate-800 dark:text-slate-200 pt-1">💡 操作のコツ：</div>
                      <p className="text-slate-500 dark:text-slate-400 leading-snug">
                        一覧画面でチェックボックスを2つ選択して「2件を比較」をクリックするか、比較画面内の左右プルダウンから直接選択できます。「⇄ 左右入れ替え」で比較元と先を反転したり、それぞれの内容を即座に個別コピーできます。
                      </p>
                    </div>
                  </div>

                  {/* 複数結合 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      <Combine className="w-4 h-4" />
                      <span>複数結合（Merge）機能</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      登録されている複数の定型文を選び、お好みの順序と区切り文字でひとまとめに連結して、1つの文章としてクリップボードへ一括コピーできます。
                    </p>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-[11px] space-y-1.5">
                      <div className="font-medium text-slate-800 dark:text-slate-200">📌 こんなシーンで便利：</div>
                      <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 space-y-0.5 pl-1">
                        <li><strong>長文メールのモジュール組み立て</strong>：「冒頭の挨拶」＋「用件・アジェンダ」＋「結びの挨拶」を結合</li>
                        <li><strong>連続実行コマンドの作成</strong>：複数のGitコマンドやDocker起動コマンドを繋げてワンライナー化</li>
                        <li><strong>複合AIプロンプトの構成</strong>：「ロール定義」＋「制約条件」＋「タスク指示文」をパーツから組み立て</li>
                      </ul>
                      <div className="font-medium text-slate-800 dark:text-slate-200 pt-1">💡 操作のコツ：</div>
                      <p className="text-slate-500 dark:text-slate-400 leading-snug">
                        画面内のチェックボックスで対象を自由に追加・除外でき、「↑」「↓」ボタンで結合順序を自在に調整できます。区切り文字（改行1つ / 改行2つ / 区切り線 --- / === / 読点 / なし）を選び、リアルタイムプレビューを見ながら「結果をコピー」ボタンを押すだけです。
                      </p>
                    </div>
                  </div>

                  {/* 性能メーター・使用統計 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      <BarChart3 className="w-4 h-4" />
                      <span>性能メーター & 使用統計（Performance & Stats）</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      データベースの健康状態や検索速度のリアルタイム診断、そしてSnippetFlowの利用によってどれだけの業務時間を短縮できたかのアナリティクスを提供します。
                    </p>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-[11px] space-y-1.5">
                      <div className="font-medium text-slate-800 dark:text-slate-200">📊 主な診断・統計項目：</div>
                      <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 space-y-0.5 pl-1">
                        <li><strong>累計短縮時間と総コピー回数</strong>：「1文字のタイピングに0.3秒かかる」と仮定し、これまでに節約できた作業時間を「時間・分・秒」で可視化します。</li>
                        <li><strong>よく使う定型文トップ3</strong>：最も利用頻度の高いスニペットのランキングと、それぞれの短縮時間を表示します。</li>
                        <li><strong>100回連続検索ベンチマーク</strong>：連続で検索処理を行い、ミリ秒単位での超高速な検索応答性能を診断します。</li>
                        <li><strong>大量データ負荷テスト</strong>：ワンクリックで「1,000件」「2,000件」「5,000件」のダミーデータを一時投入し、大量データ下でもアプリが重くならず超高速に動作することを体感・実証できます（確認後は「ダミーデータを削除」で一瞬で元通りになります）。</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* タブ3: 操作 & システム */}
              {helpTab === 'shortcuts' && (
                <>
                  {/* キーボードショートカット */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-1.5">
                      <span>⌨️ キーボードショートカット</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px]">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                        <span className="font-sans">新しい定型文を登録</span>
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold">Ctrl + N</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                        <span className="font-sans">検索キーワードにフォーカス</span>
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold">Ctrl + F</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                        <span className="font-sans">ダイアログ・モーダルを閉じる</span>
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold">Esc</span>
                      </div>
                    </div>
                  </div>

                  {/* バックアップと復元 */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-1.5">
                      <Database className="w-3.5 h-3.5 text-indigo-500" />
                      <span>📦 データのバックアップと移行</span>
                    </h4>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 text-[11px]">
                      <p className="text-slate-600 dark:text-slate-300 leading-snug">
                        ヘッダー右側の「エクスポート（📤）」ボタンで現在の全スニペットを `snippets.json` としてローカル保存できます。
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 leading-snug">
                        PCのお引越しやバックアップの復元は「インポート（📥）」から保存したJSONファイルを選択するだけで完了します。
                      </p>
                    </div>
                  </div>

                  {/* システム・ログ情報 */}
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
                </>
              )}
            </div>

            {/* フッター */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                {helpTab === 'usecases' && '💡 活用シーンと基本操作'}
                {helpTab === 'features' && '🛠️ 差分比較・複数結合・性能メーター解説'}
                {helpTab === 'shortcuts' && '⌨️ ショートカットとシステム仕様'}
              </div>
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
