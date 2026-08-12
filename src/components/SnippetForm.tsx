/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, RotateCcw, AlertTriangle, Plus, X, Calendar, Key, Lightbulb } from 'lucide-react';
import { Snippet } from '../types';

// UPDATE 2026-06-30: タグ提案機能に必要な snippets リストを props に追加
/**
 * スニペット新規作成・編集フォーム画面コンポーネントのProps定義。
 */
interface SnippetFormProps {
  /** 編集対象のスニペット（未指定の場合は新規作成モード） */
  snippet?: Snippet;
  /** 保存実行イベントハンドラー */
  onSave: (snippet: Omit<Snippet, 'createdAt' | 'updatedAt' | 'isDeleted'> & { id?: number }) => void;
  /** 論理削除（ゴミ箱移動）ハンドラー */
  onSoftDelete: (id: number) => void;
  /** アーカイブ復元ハンドラー */
  onRestore: (id: number) => void;
  /** 完全物理削除ハンドラー */
  onHardDelete: (id: number) => void;
  /** キャンセル（一覧へ戻る）ハンドラー */
  onCancel: () => void;
  /** 新規作成時に発行される自動ID番号 */
  nextId: number;
  /** AIタグ提案用の全スニペット一覧 */
  snippets?: Snippet[];
}

/**
 * スニペットの新規登録、編集、論理/物理削除、およびリアルタイムAIタグ提案を提供するフォーム画面。
 */
export default function SnippetForm({
  snippet,
  onSave,
  onSoftDelete,
  onRestore,
  onHardDelete,
  onCancel,
  nextId,
  snippets = [],
}: SnippetFormProps) {
  const isEditMode = !!snippet;

  // フォームの入力項目状態管理
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  // 編集モードの場合、フォームに入力初期値をロードする
  useEffect(() => {
    if (snippet) {
      setTitle(snippet.title);
      setContent(snippet.content);
      setDescription(snippet.description);
      setTags(snippet.tags || []);
      setError('');
    } else {
      setTitle('');
      setContent('');
      setDescription('');
      setTags([]);
      setError('');
    }
  }, [snippet]);

  // タグチップを追加する処理
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
      setTagInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  // UPDATE 2026-06-30: 既存の全てのタグから、本文・タイトル・説明のキーワード出現頻度を分析して推奨タグを提案するロジック
  const handleAddSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
    }
  };

  const countOccurrences = (text: string, word: string): number => {
    if (!word || !text) return 0;
    const lowerText = text.toLowerCase();
    const lowerWord = word.toLowerCase();
    let count = 0;
    let pos = lowerText.indexOf(lowerWord);
    while (pos !== -1) {
      count++;
      pos = lowerText.indexOf(lowerWord, pos + lowerWord.length);
    }
    return count;
  };

  // 全スニペットにおける各タグの累積使用頻度（保有スニペット数）を計算
  const tagFrequencyMap = React.useMemo(() => {
    const map = new Map<string, number>();
    (snippets || []).forEach(s => {
      (s.tags || []).forEach(t => {
        if (t) map.set(t, (map.get(t) || 0) + 1);
      });
    });
    return map;
  }, [snippets]);

  // 全ての定型文から既存の一意なタグを抽出
  const allUniqueTags = Array.from(tagFrequencyMap.keys());

  // すでに登録されているタグを除外
  const filteredUniqueTags: string[] = (allUniqueTags as string[]).filter(tag => !tags.includes(tag));

  // 各タグの出現回数を計測（タイトル重み2倍＋本文＋説明）および全体使用頻度
  const scoredTags = filteredUniqueTags.map(tag => {
    const titleScore = countOccurrences(title, tag) * 2;
    const contentScore = countOccurrences(content, tag);
    const descScore = countOccurrences(description, tag);
    const textScore = titleScore + contentScore + descScore;
    const frequency = tagFrequencyMap.get(tag) || 0;
    return { tag, textScore, frequency, score: textScore > 0 ? textScore : frequency };
  });

  // テキスト一致（出現度）を最優先し、一致が無い場合は全体使用頻度が高い順（同点時は名前順）に最大5件動的提案
  const fallbackSuggestedTags = React.useMemo(() => {
    return [...scoredTags]
      .sort((a, b) => {
        if (b.textScore !== a.textScore) return b.textScore - a.textScore;
        if (b.frequency !== a.frequency) return b.frequency - a.frequency;
        return a.tag.localeCompare(b.tag);
      })
      .slice(0, 5)
      .map(item => item.tag);
  }, [scoredTags]);

  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchSuggestions = async () => {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const res = await invoke<string[]>('suggest_tags_cmd', {
            snippets,
            title,
            content,
            description,
            currentTags: tags,
          });
          if (isMounted) {
            setSuggestedTags(res);
            return;
          }
        } catch (e) {
          console.error('Failed to suggest tags via Rust backend:', e);
        }
      }
      if (isMounted) {
        setSuggestedTags(fallbackSuggestedTags);
      }
    };
    fetchSuggestions();
    return () => {
      isMounted = false;
    };
  }, [snippets, title, content, description, tags]);

  // フォーム内容に変更があるか（未保存状態 isDirty）を判定
  const isDirty = React.useMemo(() => {
    if (!snippet) {
      return title.trim() !== '' || content.trim() !== '' || description.trim() !== '' || tags.length > 0;
    }
    const initialTitle = snippet.title || '';
    const initialContent = snippet.content || '';
    const initialDesc = snippet.description || '';
    const initialTags = snippet.tags || [];

    const titleChanged = title.trim() !== initialTitle.trim();
    const contentChanged = content.trim() !== initialContent.trim();
    const descChanged = description.trim() !== initialDesc.trim();
    const tagsChanged = JSON.stringify([...tags].sort()) !== JSON.stringify([...initialTags].sort());

    return titleChanged || contentChanged || descChanged || tagsChanged;
  }, [snippet, title, content, description, tags]);

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const handleBackClick = () => {
    if (isDirty) {
      setShowUnsavedModal(true);
    } else {
      onCancel();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let currentTags = [...tags];
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !currentTags.includes(trimmedTag)) {
      currentTags.push(trimmedTag);
      setTags(currentTags);
      setTagInput('');
    }

    if (!title.trim()) {
      setError('タイトルを入力してください。');
      return;
    }
    if (!content.trim()) {
      setError('定型文の本文を入力してください。');
      return;
    }
    if (currentTags.length === 0) {
      setError('タグを最低1つ登録してください。');
      return;
    }

    onSave({
      id: snippet?.id, // 新規作成時は undefined になります
      title: title.trim(),
      content: content.trim(),
      description: description.trim(),
      tags: currentTags,
    });
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative" id="snippet-form-root">
      {/* 未保存変更がある場合の離脱確認ダイアログモーダル */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 font-sans">
            <div className="flex items-center space-x-3 text-amber-500">
              <AlertTriangle className="w-6 h-6 shrink-0 animate-bounce" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">未保存の変更があります</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              入力・編集中の内容が保存されていません。一覧画面に戻ると変更内容は破棄されますが、よろしいですか？
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUnsavedModal(false)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                編集を続ける
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false);
                  onCancel();
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium shadow-sm transition cursor-pointer"
              >
                保存せずに戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダーバー */}
      <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleBackClick}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
            id="btn-form-back"
            title="戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            {/* UPDATE 2026-06-30: フォームタイトルの文字色をダークモードに対応 */}
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 font-sans" id="form-heading">
              {isEditMode ? '定型文の編集・変更画面' : '新しい定型文の登録・追加'}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-sans">
              {isEditMode ? `ID: #${snippet?.id} を編集中` : `新規ID: #${nextId} を自動付与`}
            </p>
          </div>
        </div>

        {/* Soft-Deleted Badge indicator if viewing archive */}
        {/* UPDATE 2026-06-30: アーカイブバッジの配色をダークモードに対応 */}
        {snippet?.isDeleted && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 font-sans">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            削除済み（アーカイブ）
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-3 bg-rose-550 border border-rose-600 text-white rounded-lg text-xs font-sans flex items-center space-x-2 animate-shake">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Metadata Details Row (ID & Date) */}
        {/* UPDATE 2026-06-30: メタデータ表示エリアの背景・境界線・文字色をダークモードに対応 */}
        {isEditMode && snippet && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-850 text-xs text-slate-500 dark:text-slate-400 font-sans">
            <div className="flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>ユニークナンバー: <strong className="text-slate-700 dark:text-slate-300 font-mono">{snippet.id}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>作成日: <span className="text-slate-700 dark:text-slate-300 font-mono">{new Date(snippet.createdAt).toLocaleDateString()}</span></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>更新日: <span className="text-slate-700 dark:text-slate-300 font-mono">{new Date(snippet.updatedAt).toLocaleDateString()}</span></span>
            </div>
          </div>
        )}

        {/* Title Field */}
        <div>
          {/* UPDATE 2026-06-30: ラベル色をダークモードに対応 */}
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider font-sans">
            定型文タイトル <span className="text-rose-500">*</span>
          </label>
          {/* UPDATE 2026-06-30: 入力フィールドの背景、文字色、境界線をダークモード（dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800）に対応 */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: ビジネスメール：打ち合わせ日程調整"
            className="w-full px-3 py-2 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
            id="form-input-title"
          />
        </div>

        {/* Content Field */}
        <div>
          {/* UPDATE 2026-06-30: ラベル色をダークモードに対応（コントラスト確保のため） */}
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider font-sans">
            定型文本文 <span className="text-rose-500">*</span>
          </label>
          {/* UPDATE 2026-06-30: 本文テキストエリアの背景、文字色、境界線をダークモードに対応 */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="ここにクリップボードにコピーされる定型文の本文を入力してください..."
            rows={10}
            className="w-full px-3 py-2 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition font-mono leading-relaxed"
            id="form-textarea-content"
          />
        </div>

        {/* Description Field */}
        <div>
          {/* UPDATE 2026-06-30: ラベル色をダークモードに対応（一貫性の保持） */}
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider font-sans">
            定型文の説明・補足
          </label>
          {/* UPDATE 2026-06-30: 補足説明入力の背景、文字色、境界線をダークモードに対応 */}
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例: 社外向けの返信時に使用する挨拶と日程候補"
            className="w-full px-3 py-2 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
            id="form-input-description"
          />
        </div>

        {/* Tags Field */}
        <div>
          {/* UPDATE 2026-07-29: タグを必須項目として明示 */}
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider font-sans">
            タグ <span className="text-red-500 font-bold">*必須</span>（スペースまたはカンマで区切って複数入力可能）
          </label>
          <div className="flex flex-col space-y-2.5">
            <div className="flex space-x-2">
              {/* UPDATE 2026-06-30: タグ入力の背景、文字色、境界線をダークモードに対応 */}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="タグを入力（例：メール）"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="flex-1 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                id="form-input-tag"
              />
              {/* UPDATE 2026-06-30: タグ追加ボタンをダークモード（dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750）に対応 */}
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm transition font-medium flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>追加</span>
              </button>
            </div>

            {/* Displaying Current Tag Chips */}
            {/* UPDATE 2026-06-30: タグチップ用ラッパーをダークモードに対応 */}
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-lg">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs font-medium text-indigo-700 dark:text-indigo-400"
                  >
                    {/* UPDATE 2026-06-30: タグバッジチップをダークモードに対応 */}
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1.5 text-indigo-400 dark:text-indigo-550 hover:text-indigo-600 dark:hover:text-indigo-300 focus:outline-none cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 font-sans italic">登録されたタグはありません。</p>
            )}

            {/* UPDATE 2026-06-30: 入力テキストから既存のタグとの類似キーワードを判定し、クリック1つで追加できるおすすめタグ機能 */}
            {suggestedTags.length > 0 && (
              <div className="mt-2.5 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-lg space-y-1.5" id="tag-suggestions-box">
                <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 font-sans text-xs font-medium">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>おすすめの既存タグ（入力内容の出現頻度分析）:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddSuggestedTag(tag)}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition duration-150 cursor-pointer flex items-center space-x-1 shadow-sm"
                      title={`${tag} を追加する`}
                    >
                      <span>#{tag}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({scoredTags.find(item => item.tag === tag)?.score})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Buttons Action Area */}
        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-4">
          
          {/* Deletion / Archive Actions ONLY when editing an existing snippet */}
          <div className="flex items-center space-x-2">
            {isEditMode && snippet && (
              <>
                {!snippet.isDeleted ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('この定型文を削除してゴミ箱へ移動しますか？\n（一覧画面から削除済みの定型文の確認・復旧が可能です）')) {
                        onSoftDelete(snippet.id);
                      }
                    }}
                    // UPDATE 2026-06-30: 削除ボタンをダークモード（dark:border-rose-950 dark:text-rose-450 dark:hover:bg-rose-950/20）に対応
                    className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 border border-rose-200 dark:border-rose-950 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-700 dark:text-rose-450 rounded-lg text-xs font-medium transition cursor-pointer"
                    id="btn-form-softdelete"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>定型文を削除</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onRestore(snippet.id)}
                      // UPDATE 2026-06-30: 復元ボタンをダークモード（dark:border-emerald-950 dark:text-emerald-450 dark:hover:bg-emerald-950/20）に対応
                      className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 border border-emerald-200 dark:border-emerald-950 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 rounded-lg text-xs font-medium transition cursor-pointer"
                      id="btn-form-restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>アーカイブから復元する</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('この定型文をデータベースから永久に削除しますか？\n（この操作は元に戻せません）')) {
                          onHardDelete(snippet.id);
                        }
                      }}
                      // UPDATE 2026-06-30: 永久削除ボタンをダークモードに対応
                      className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-lg text-xs font-medium transition cursor-pointer"
                      id="btn-form-harddelete"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>完全に削除する</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Cancel & Save Action */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              // UPDATE 2026-06-30: キャンセルボタンをダークモード（dark:border-slate-800 dark:hover:bg-slate-800 dark:text-slate-300）に対応
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
              id="btn-form-cancel"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm transition cursor-pointer"
              id="btn-form-save"
            >
              <Save className="w-4 h-4" />
              <span>{isEditMode ? '変更を保存する' : '新しく登録する'}</span>
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
