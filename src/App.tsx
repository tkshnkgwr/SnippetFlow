/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { Snippet, ActiveTab } from './types';
import { DEFAULT_SNIPPETS, generateMockSnippets } from './utils';
import packageJson from '../package.json';

// Import our modular custom components
import SnippetList from './components/SnippetList';
import SnippetForm from './components/SnippetForm';
import SnippetCompare from './components/SnippetCompare';
import SnippetMerge from './components/SnippetMerge';
import StatsPanel from './components/StatsPanel';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function App() {
  // --- TAURI ENVIRONMENT CHECK ---
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      setIsTauri(true);
    }
  }, []);

  const handleCloseApp = async () => {
    try {
      const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      getCurrentWebviewWindow().close();
    } catch (e) {
      console.error('Failed to close window via Tauri API:', e);
    }
  };

  // --- THEME STATE ---
  // UPDATE 2026-06-30: ユーザーが選択したダークモード状態の永続化と管理を追加
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme_dark_mode');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('theme_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  // --- DATABASE STATE ---
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    try {
      const saved = localStorage.getItem('snippets_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load snippets database from localStorage:', e);
    }
    return DEFAULT_SNIPPETS;
  });

  // Save changes to client-side storage whenever snippets database updates
  useEffect(() => {
    localStorage.setItem('snippets_db', JSON.stringify(snippets));
  }, [snippets]);

  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('list');
  const [selectedSnippetId, setSelectedSnippetId] = useState<number | undefined>(undefined);
  const [selectedMergeIds, setSelectedMergeIds] = useState<number[]>([]);
  const [compareIds, setCompareIds] = useState<{ idA?: number; idB?: number }>({});

  // --- PERFORMANCE METRIC STATE ---
  const [queryTimeMs, setQueryTimeMs] = useState<number>(0);

  // --- TOAST NOTIFICATIONS SYSTEM ---
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Calculate next sequential ID to assign
  const nextId = snippets.length > 0 ? Math.max(...snippets.map(s => s.id)) + 1 : 1001;

  // --- BULLETPROOF CLIPBOARD COPYING UTILITY ---
  const handleCopyText = async (text: string, label: string) => {
    let success = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        success = true;
      }
    } catch (err) {
      console.warn('Modern Clipboard API failed, attempting fallback.', err);
    }

    if (!success) {
      // Robust fallback for sandboxed iframes
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        success = document.execCommand('copy');
      } catch (err) {
        console.error('Fallback clipboard copy failed:', err);
      }
      textarea.remove();
    }

    if (success) {
      addToast(`「${label.length > 15 ? label.slice(0, 15) + '...' : label}」をクリップボードにコピーしました！`, 'success');
    } else {
      addToast('コピーに失敗しました。ブラウザのアクセス権限を確認してください。', 'error');
    }
  };

  // --- DATABASE ACTIONS (C.R.U.D) ---

  // Create or Update Snippet
  const handleSaveSnippet = (formData: Omit<Snippet, 'createdAt' | 'updatedAt' | 'isDeleted'> & { id?: number }) => {
    const now = new Date().toISOString();

    if (formData.id) {
      // --- UPDATE MODE ---
      setSnippets(prev =>
        prev.map(item => {
          if (item.id === formData.id) {
            return {
              ...item,
              title: formData.title,
              content: formData.content,
              description: formData.description,
              tags: formData.tags,
              updatedAt: now,
            };
          }
          return item;
        })
      );
      addToast('定型文を更新しました。', 'success');
    } else {
      // --- CREATE MODE ---
      const newSnippet: Snippet = {
        id: nextId,
        title: formData.title,
        content: formData.content,
        description: formData.description,
        tags: formData.tags,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      };
      setSnippets(prev => [newSnippet, ...prev]);
      addToast('新規定型文を登録しました。', 'success');
    }

    setActiveTab('list');
    setSelectedSnippetId(undefined);
  };

  // Soft Delete Snippet (Trash bin migration)
  const handleSoftDeleteSnippet = (id: number) => {
    setSnippets(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            isDeleted: true,
            deletedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
    addToast('定型文を削除し、ゴミ箱（過去ログ）に移動しました。', 'info');
    setActiveTab('list');
    setSelectedSnippetId(undefined);
  };

  // Restore Soft-deleted Snippet
  const handleRestoreSnippet = (id: number) => {
    setSnippets(prev =>
      prev.map(item => {
        if (item.id === id) {
          const { deletedAt, ...rest } = item;
          return {
            ...rest,
            isDeleted: false,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
    addToast('定型文をアーカイブから元通りに復元しました！', 'success');
    setActiveTab('list');
    setSelectedSnippetId(undefined);
  };

  // Hard Delete (Permanent Purge)
  const handleHardDeleteSnippet = (id: number) => {
    setSnippets(prev => prev.filter(item => item.id !== id));
    addToast('定型文をデータベースから永久削除しました。', 'error');
    setActiveTab('list');
    setSelectedSnippetId(undefined);
  };

  // --- PERFORMANCE TESTING ACTIONS ---

  // Generate large volume of mock items
  const handleGenerateMock = (count: number) => {
    const start = performance.now();
    const mockData = generateMockSnippets(count);
    setSnippets(prev => [...prev, ...mockData]);
    const end = performance.now();
    addToast(`${count}件の検証用ダミーデータを ${(end - start).toFixed(1)}ms で追加しました！`, 'success');
  };

  // Clear simulated datasets (keep defaults)
  const handleClearMock = () => {
    setSnippets(prev => prev.filter(item => item.id < 2000));
    addToast('検証用ダミーデータを一括削除しました。', 'info');
    setActiveTab('list');
  };

  const handleImportJSON = (newData: Snippet[]) => {
    setSnippets(newData);
    addToast('JSONデータを正常に読み込み完了。', 'success');
  };

  return (
    // UPDATE 2026-06-30: isDarkMode変数に応じて .dark クラスをルートに追加。Tailwind v4のダークモード制御を有効化します。
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-50 text-slate-800'} flex flex-col font-sans transition-colors duration-200`} id="app-container">
      
      {/* Dynamic Toast Notifications container */}
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
 
      <header data-tauri-drag-region className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-950 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm dark:shadow-md cursor-default select-none">
        <div data-tauri-drag-region className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-inner">
            <ClipboardList className="w-6 h-6" id="app-logo-icon" />
          </div>
          <div data-tauri-drag-region>
            <h1 data-tauri-drag-region className="text-base font-bold font-sans tracking-wide text-slate-900 dark:text-white leading-none" id="app-title-header">
              定型文クリップボード・マネージャー
            </h1>
            <p data-tauri-drag-region className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
              JSON Database Engine ver {packageJson.version} • Local Client Edition
            </p>
          </div>
        </div>
 
        {/* Global Desktop App Navigation Tabs */}
        <div className="flex items-center gap-3">
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
 
          {/* UPDATE 2026-07-01: トグルスイッチをライトモード時の白・グレー基調、ダークモード時の暗色基調へ対応させ、全体のコントラストを一元化 */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-all shrink-0 cursor-pointer flex items-center justify-center"
            title={isDarkMode ? "ライトモードに切り替え" : "ダークモードに切り替え"}
            id="btn-theme-toggle"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
          </button>

          {isTauri && (
            <button
              onClick={handleCloseApp}
              className="p-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg transition-all shrink-0 cursor-pointer flex items-center justify-center"
              title="アプリを閉じる"
              id="btn-close-app"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Application Shell Stage */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
        {activeTab === 'list' && (
          <SnippetList
            snippets={snippets}
            onAddSnippet={() => {
              setSelectedSnippetId(undefined);
              setActiveTab('create');
            }}
            onEditSnippet={(id) => {
              setSelectedSnippetId(id);
              setActiveTab('edit');
            }}
            onCopyText={handleCopyText}
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
          />
        )}

        {/* Create / Edit Form screen */}
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

        {/* Side by side compare view */}
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

        {/* Combined templates view */}
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

        {/* Performance metrics dashboard */}
        {activeTab === 'performance' && (
          <StatsPanel
            snippets={snippets}
            onGenerateMock={handleGenerateMock}
            onClearMock={handleClearMock}
            queryTimeMs={queryTimeMs}
          />
        )}
      </main>

      {/* Styled Human-Literal Desktop footer */}
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
