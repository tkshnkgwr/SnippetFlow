[English](../en/INSTRUCTIONS.md) | **日本語版**

# 開発およびコーディング指示書 (INSTRUCTIONS.md)

本ドキュメントは、AIエージェントおよび開発者がSnippetFlowのプロジェクトコード（Rust、TypeScript/React）を修正・追加する際に遵守すべき開発規約、コーディングスタイル、およびエラーハンドリング方針について定義します。

---

## 1. 命名規則 (Naming Conventions)
使用する言語や環境に応じて標準的な命名規則を採用しています。
- **Rust (src-tauri / common_lib)**:
  - 構造体、トレイト、Enum、Enumバリアント: `PascalCase`
  - 関数、メソッド、変数、構造体フィールド、モジュール名: `snake_case`
  - 定数、グローバル定数: `SCREAMING_SNAKE_CASE`
- **TypeScript / React (src)**:
  - コンポーネント名、インターフェース、型定義、コンポーネントファイル名: `PascalCase`
  - 変数、関数、オブジェクトプロパティ、フック名: `camelCase`
  - モジュール内の定数定義: `UPPER_SNAKE_CASE`
- **シリアライズの例外**: Tauri/Web側（キャメルケース）とRust側（スネークケース）の相互変換時の互換性を維持する。

---

## 2. エラーハンドリング方針 (Error Handling Policy)
- **Rust (src-tauri / common_lib)**:
  - ファイルが存在しない場合やパースエラーが発生した場合は、`Default::default()` や初期サンプルデータへ安全にフォールバックします。
- **TypeScript / React (src)**:
  - `localStorage` の読み書きや、JSONパースの実行時には、必ず `try-catch` ブロックで囲んで例外を捕捉し、アプリ全体のレンダリングが停止するのを防止します。
  - エラー発生時はトースト通知機能（`addToast(message, 'error')`）を呼び出します。

---

## 3. コンポーネント・モジュール分割基準
単一のプログラムソースファイル（`.rs`, `.ts`, `.tsx` 等）が 1000 行を超過した場合は、必ず機能ごとのモジュール分割・リファクタリングを実施または提案します。
- **Rust (src-tauri)**: `lib.rs`, `main.rs` 等に関心事に応じて最適化。
- **TypeScript / React (src)**: `App.tsx`, `hooks/useSnippets.ts`, `components/` 配下に分割。

---

## 4. 自動ドキュメンテーションと更新ルール (モジュール化退避)
コード変更・機能追加・バグ修正時は `docs/ja/` および `docs/en/` の両ドキュメントを完全同期更新します (`CHANGELOG.md`, `SPEC.md`, `TODO.md` 等)。
※**`.md` ファイルのみの変更時は、本自動更新および事前検証プロセスはスキップします。**

| 対象ドキュメント | 役割 | 更新タイミング |
| :--- | :--- | :--- |
| `CHANGELOG.md` | 変更履歴の記録 | 実装完了ごとに追記。日付単位 (`## [YYYY-MM-DD]`)・カテゴリ別 (`Added`, `Fixed`, `Optimized`, `Removed`) に最新が上に来るよう記述。 |
| `SPEC.md` | 機能仕様・定義 | CLI引数、計算ロジック、計算精度、UIコンポーネント、対応OSなどの仕様変更時。 |
| `DIAGRAM.md` | システム構成・可視化 | 処理フロー変更時にMermaid（英語版は英語表記）を更新。 |
| `README.md` / `README_JA.md` | 概要・ビルド/実行手順 | 起動オプション、ビルド手順、動作要件等の変更時。 |
| `FOOTPRINTS.md` | パフォーマンス計測 | リリースビルドサイズ変更、最適化設定変更、新規計測結果取得時に追記。 |
| `ARCHITECTURE.md` | 設計・モジュール構造 | 内部構造刷新、モジュールの新規作成・分割、アルゴリズム変更時に更新。 |
| `INSTRUCTIONS.md` | AI向けコーディング規約 | AI向けのコーディング規約や方針の管理。 |
| `TODO.md` | タスク管理 | Done (実装済)、In Progress/Todo (直近タスク)、Backlog (拡張提案) の追加・更新時。 |

---

## 5. 品質管理・事前検証ルール (モジュール化退避)
- **モジュール分割 (1,000行ルール)**: 単一ソースファイルが **1,000行** を超えた場合は分割・リファクタリングを提案。
- **ローカル事前検証 5 コマンド** (※ `.md` のみ変更時はスキップ):
  1. `cargo test` （テスト合格）
  2. `cargo clippy --all-targets -- -D warnings` （Clippy警告ゼロ）
  3. `cargo fmt --check` （フォーマット適合）
  4. `cargo doc --no-deps --document-private-items` （Rustdocビルド警告ゼロ）
  5. `npm run lint && npm run build` （TypeScript型チェック＆Viteビルド合格）
- **バージョン管理 (SSOT)**:
  - ルート `package.json` を SSOT とし、`Cargo.toml`（ルート & `src-tauri`）と同期する。
