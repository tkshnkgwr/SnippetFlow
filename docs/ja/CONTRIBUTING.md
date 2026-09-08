[English](../en/CONTRIBUTING.md) | **日本語版**

# 貢献ガイドライン (CONTRIBUTING.md) - SnippetFlow

`SnippetFlow` プロジェクトへの貢献に興味を持っていただきありがとうございます！
本ドキュメントでは、バグ報告、機能提案、およびプルリクエスト（PR）提出時のガイドラインについて記述します。

---

## 1. 開発方針と重要原則

本プロジェクトの開発や修正を行う際は、以下の原則を遵守してください。

1. **Tauri 2 デスクトップアーキテクチャの維持**:
   - 本アプリは、Tauri 2（React 19 / TypeScript + Rust）のハイブリッド構成として設計されています。Web技術による表現力豊かなUIと、Rustによる高速・安全なシステム処理（データ永続化、暗号化、LCS差分等）の責務分離を保って設計してください。
2. **共有ライブラリ `common_lib` の活用**:
   - 隣接する `common_lib` フォルダに共通の処理（Win32 API制御や文字列処理、LCSアルゴリズムなど）がまとめられています。二重実装を防ぐため、共有できるロジックは積極的に `common_lib` へ移行してください。
3. **多言語ドキュメントの同期**:
   - 仕様変更や機能追加、動作フローの変更を行う場合は、必ず `docs/ja/` および `docs/en/` の双方のドキュメントを更新し、内容を完全同期させてください。

---

## 2. 開発環境のセットアップと動作確認

詳細な環境構築手順については [開発者ガイド (DEVELOPING.md)](DEVELOPING.md) を参照してください。

1. **リポジトリの配置**:
   - ローカル開発時は、必ず `common_lib` と `SnippetFlow` を同じ親ディレクトリにクローンしてください。
   ```text
   Parent_Folder/
   ├── common_lib/
   └── SnippetFlow/
   ```
2. **デスクトップ版（Tauri）の起動**:
   ```bash
   npm install
   npm run tauri dev
   ```
3. **Web版（プロトタイプ・UI確認）の起動**:
   ```bash
   npm run dev
   ```

---

## 3. コミットおよびプルリクエスト手順

### コミットメッセージの規約
コミットメッセージは以下の Conventional Commits 形式に従ってください：

- `feat:` 新機能追加
- `fix:` バグ修正
- `docs:` ドキュメントの変更
- `refactor:` リファクタリング（機能追加やバグ修正を伴わないコード整理）
- `perf:` パフォーマンス最適化
- `test:` テストの追加や修正
- `chore:` ビルドツールや設定ファイルの変更

### プルリクエスト作成前のチェックリスト
PRを送信する前に、ローカル環境で以下の検証がすべてパスすることを確認してください：

- [ ] `cargo test --manifest-path src-tauri/Cargo.toml` （Rustユニットテスト合格）
- [ ] `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings` （静的解析の警告ゼロ）
- [ ] `cargo fmt --manifest-path src-tauri/Cargo.toml --check` （Rustのコードフォーマット準拠）
- [ ] `npm run lint` （TypeScriptの型エラー・警告ゼロ）
- [ ] `npm run build` （フロントエンドのビルド成功）
- [ ] `docs/ja/` と `docs/en/` のドキュメント同期
