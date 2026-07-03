/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Snippet {
  id: number;           // ユニークナンバー
  title: string;        // 定型文タイトル
  content: string;      // 定型文本文
  description: string;  // 定型文説明
  createdAt: string;    // 作成日 (ISO 8601)
  updatedAt: string;    // 更新日 (ISO 8601)
  deletedAt?: string;   // 削除日 (ISO 8601)
  isDeleted: boolean;   // 削除フラグ
  tags: string[];       // タグ
}

export type ActiveTab = 'list' | 'create' | 'edit' | 'compare' | 'merge' | 'performance';

export type SortCriterion = 'updated_at_desc' | 'updated_at_asc' | 'created_at_desc' | 'title_asc';


export interface PerformanceStats {
  queryTimeMs: number;
  totalRecords: number;
  dbType: 'JSON' | 'SQLite (Simulated)' | 'PostgreSQL (Future)';
  cacheHit: boolean;
}
