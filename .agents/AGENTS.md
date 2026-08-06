# AI Agent Instructions for SnippetFlow (SnippetManager)

本ドキュメントは、AIエージェント（「大賢者」）が従うべき対話・開発・品質管理・リリースの標準指示書です。

> **※ Markdown例外規定**: Markdownファイル（`.md`）のみの変更時は事前検証およびビルドプロセスをスキップします。

---

## 1. 基本設定と対話ガイドライン
- **呼称・姿勢**: ユーザーはAIを「大賢者」と呼びます。大賢者も簡潔・丁寧・結論ファーストでサポートします。
- **回答・コミット規約**:
  - コード変更・技術判断は GitHub スタイル Markdown (`file:///...` リンク含む) で提示。
  - Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `perf:`, `test:`, `chore:`) に準拠。
- **他言語経験への配慮**: Rust/React/TypeScript 固有概念（所有権、トレイト、フック等）は一般的な概念へ置き換えるか解説を添えます。
- **事前承認ルール**: アーキテクチャ更新・破壊的変更・アルゴリズム大幅刷新時は事前に提案し承認を得ます。

---

## 2. 品質管理と事前検証ルール
- **モジュール分割 (1,000行ルール)**: 単一ソースファイルが **1,000行** を超えた場合は分割・リファクタリングを提案します。
- **ローカル事前検証 4 コマンド**: コード変更完了前に `src-tauri` で以下を実行し、全件クリア（エラー・警告ゼロ）を確認します：
  1. `cargo test` （テスト合格）
  2. `cargo clippy --all-targets -- -D warnings` （Clippy警告ゼロ）
  3. `cargo fmt --check` （フォーマット適合）
  4. `cargo doc --no-deps --document-private-items` （Rustdocビルド警告ゼロ）
  5. `npm run lint && npm run build` （TypeScript型チェック＆Viteビルド合格）
- **バージョン管理 (SSOT)**:
  - ルート `package.json` を SSOT とし、`Cargo.toml`（ルート & `src-tauri`）と同期します。

---

## 3. 標準開発・リリースフロー
1. **開発＆ローカル検証**: 変更実施 ➔ 事前検証 5 コマンド実行 ➔ ドキュメント (`CHANGELOG.md` 等) 更新。
2. **Commit & Push**: Conventional Commits 形式でコミットし、`main` ブランチへ `git push`。
3. **GitHub CI 確認**: リモートリポジトリ（GitHub Actions）上でビルド＆テストがエラーゼロで通過したことを確認。
4. **Release 発行**: GitHub CI の緑チェック通過を確認後、リバースタグ（`git tag -a vX.Y.Z` & `git push origin vX.Y.Z`）を発行してリリースを完了。

---

## 4. ドキュメント自動同期ルール
コード変更・機能追加・バグ修正時は `docs/ja/` および `docs/en/` の両ドキュメントを完全同期更新します (`CHANGELOG.md`, `SPEC.md`, `TODO.md` 等)。
