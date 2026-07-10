import { useState, useEffect } from 'react';
import { Snippet, ActiveTab, SortCriterion } from '../types';
import { DEFAULT_SNIPPETS, generateMockSnippets } from '../utils';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export function useSnippets() {
  const [isTauri, setIsTauri] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme_dark_mode');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      setIsTauri(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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

  useEffect(() => {
    localStorage.setItem('snippets_db', JSON.stringify(snippets));
  }, [snippets]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('list');
  const [selectedSnippetId, setSelectedSnippetId] = useState<number | undefined>(undefined);
  const [selectedMergeIds, setSelectedMergeIds] = useState<number[]>([]);
  const [compareIds, setCompareIds] = useState<{ idA?: number; idB?: number }>({});

  const [sortCriterion, setSortCriterion] = useState<SortCriterion>(() => {
    try {
      const saved = localStorage.getItem('snippets_sort_criterion');
      return (saved as SortCriterion) || 'updated_at_desc';
    } catch {
      return 'updated_at_desc';
    }
  });

  useEffect(() => {
    localStorage.setItem('snippets_sort_criterion', sortCriterion);
  }, [sortCriterion]);

  const [queryTimeMs, setQueryTimeMs] = useState<number>(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const handleCloseApp = async () => {
    try {
      const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      getCurrentWebviewWindow().close();
    } catch (e) {
      console.error('Failed to close window via Tauri API:', e);
    }
  };

  const nextId = snippets.length > 0 ? Math.max(...snippets.map(s => s.id)) + 1 : 1001;

  const handleCopyText = async (text: string, label: string, id?: number | number[]) => {
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
      
      if (id !== undefined) {
        const ids = Array.isArray(id) ? id : [id];
        setSnippets(prev =>
          prev.map(item => {
            if (ids.includes(item.id)) {
              const charCount = item.content.length;
              const savedSec = Math.round(charCount * 0.3);
              return {
                ...item,
                copyCount: (item.copyCount || 0) + 1,
                savedTimeSec: (item.savedTimeSec || 0) + savedSec,
              };
            }
            return item;
          })
        );
      }
    } else {
      addToast('コピーに失敗しました。ブラウザのアクセス権限を確認してください。', 'error');
    }
  };

  const handleSaveSnippet = (formData: Omit<Snippet, 'createdAt' | 'updatedAt' | 'isDeleted'> & { id?: number }) => {
    const now = new Date().toISOString();

    if (formData.id) {
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

  const handleHardDeleteSnippet = (id: number) => {
    setSnippets(prev => prev.filter(item => item.id !== id));
    addToast('定型文をデータベースから永久削除しました。', 'error');
    setActiveTab('list');
    setSelectedSnippetId(undefined);
  };

  const handleTogglePin = (id: number) => {
    setSnippets(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            isPinned: !item.isPinned,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
    addToast('定型文のピン留め状態を変更しました。', 'success');
  };

  const handleGenerateMock = (count: number) => {
    const start = performance.now();
    const mockData = generateMockSnippets(count);
    setSnippets(prev => [...prev, ...mockData]);
    const end = performance.now();
    addToast(`${count}件の検証用ダミーデータを ${(end - start).toFixed(1)}ms で追加しました！`, 'success');
  };

  const handleClearMock = () => {
    setSnippets(prev => prev.filter(item => item.id < 2000));
    addToast('検証用ダミーデータを一括削除しました。', 'info');
    setActiveTab('list');
  };

  const handleImportJSON = (newData: Snippet[]) => {
    setSnippets(newData);
    addToast('JSONデータを正常に読み込み完了。', 'success');
  };

  return {
    isTauri,
    isDarkMode,
    setIsDarkMode,
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
    handleCopyText,
    handleSaveSnippet,
    handleSoftDeleteSnippet,
    handleRestoreSnippet,
    handleHardDeleteSnippet,
    handleTogglePin,
    handleGenerateMock,
    handleClearMock,
    handleImportJSON,
  };
}
