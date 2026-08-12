/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 定型文（スニペット）データのデータモデル定義。
 */
export interface Snippet {
  /** 一意なスニペットID番号 */
  id: number;
  /** スニペットのタイトル */
  title: string;
  /** スニペットの本文テキスト */
  content: string;
  /** スニペットの補足・用途説明 */
  description: string;
  /** 作成日時 (ISO 8601 フォーマット) */
  createdAt: string;
  /** 最終更新日時 (ISO 8601 フォーマット) */
  updatedAt: string;
  /** 論理削除日時 (ISO 8601 フォーマット、削除時のみ設定) */
  deletedAt?: string;
  /** 論理削除フラグ（true の場合ゴミ箱内） */
  isDeleted: boolean;
  /** 分類タグの配列 */
  tags: string[];
  /** 最上部固定（ピン留め）フラグ */
  isPinned?: boolean;
  /** コピー累計実行回数 */
  copyCount?: number;
  /** コピー操作により節約された累計短縮時間（秒） */
  savedTimeSec?: number;
}

/**
 * アプリケーションのメイン画面タブ識別子。
 */
export type ActiveTab = 'list' | 'create' | 'edit' | 'compare' | 'merge' | 'performance';

/**
 * 一覧画面での並び替え基準。
 */
export type SortCriterion = 'updated_at_desc' | 'updated_at_asc' | 'created_at_desc' | 'title_asc' | 'copy_count_desc';

/**
 * パフォーマンス診断画面で表示される統計データ指標。
 */
export interface PerformanceStats {
  /** バックエンドクエリ検索実行時間（ミリ秒） */
  queryTimeMs: number;
  /** 総スニペットレコード数 */
  totalRecords: number;
  /** データベース種別表現 */
  dbType: 'JSON' | 'SQLite (Simulated)' | 'PostgreSQL (Future)';
  /** キャッシュヒットの有無 */
  cacheHit: boolean;
}
