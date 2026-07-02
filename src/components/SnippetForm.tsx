/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, RotateCcw, AlertTriangle, Plus, X, Calendar, Key, Lightbulb } from 'lucide-react';
import { Snippet } from '../types';

// UPDATE 2026-06-30: タグ提案機能に必要な snippets リストを props に追加
interface SnippetFormProps {
  snippet?: Snippet; // If undefined, we are in 'Create' mode
  onSave: (snippet: Omit<Snippet, 'createdAt' | 'updatedAt' | 'isDeleted'> & { id?: number }) => void;
  onSoftDelete: (id: number) => void;
  onRestore: (id: number) => void;
  onHardDelete: (id: number) => void;
  onCancel: () => void;
  nextId: number;
  snippets?: Snippet[];
}

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

  // Form States
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Populate form if in edit mode
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

  // Handle adding a tag chip
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

  // 全ての定型文から既存の一意なタグを抽出
  const allUniqueTags = Array.from(
    new Set((snippets || []).flatMap(s => s.tags || []))
  ).filter(Boolean);

  // すでに登録されているタグを除外
  const filteredUniqueTags = allUniqueTags.filter(tag => !tags.includes(tag));

  // 各タグの出現回数を計測（タイトル、本文、説明を合算。タイトルは重要度が高いので重み付け2倍に）
  const scoredTags = filteredUniqueTags.map(tag => {
    const titleScore = countOccurrences(title, tag) * 2;
    const contentScore = countOccurrences(content, tag);
    const descScore = countOccurrences(description, tag);
    const score = titleScore + contentScore + descScore;
    return { tag, score };
  });

  // 出現回数が1回以上のものを降順でソートし、上位5件を提案
  const suggestedTags = scoredTags
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.tag);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('タイトルを入力してください。');
      return;
    }
    if (!content.trim()) {
      setError('定型文の本文を入力してください。');
      return;
    }

    onSave({
      id: snippet?.id, // Will be undefined for new items
      title: title.trim(),
      content: content.trim(),
      description: description.trim(),
      tags: tags,
    });
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden" id="snippet-form-root">
      {/* UPDATE 2026-06-30: フォーム外枠コンテナーの背景とボーダーをダークモードに対応 */}
      {/* Header Bar */}
      {/* UPDATE 2026-06-30: フォームヘッダーの背景とボーダーをダークモード（dark:bg-slate-950 dark:border-slate-850）に対応 */}
      <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
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
          {/* UPDATE 2026-06-30: ラベル色をダークモードに対応 */}
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider font-sans">
            タグ（スペースまたはカンマで区切って複数入力可能）
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
