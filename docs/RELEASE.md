# リリース手順書 (RELEASE.md)

本ドキュメントは、「定型文クリップボード・マネージャー (SnippetFlow)」の製品版リリース手順、バージョン同期管理ルール、および自動パッケージングパイプラインの運用方法について定義します。

---

## 1. バージョン管理と自動同期ルール (SSOT)

本プロジェクトには、フロントエンド（React）、Tauri（デスクトップ連携）、egui単体版（Rustネイティブ）が混在しています。バージョンの乖離や不整合を防ぐため、以下のルールを厳守してください。

### 1.1. 信頼できる唯一の情報源 (SSOT)
バージョン情報の正となる情報は、ルートディレクトリの **`package.json`** です。フロントエンドでのバージョン表示などはすべて `package.json` から動的にロードされます。

### 1.2. 手動同期が必要なファイル群
Node.js (package.json) と Rust (Cargo.toml) は自動でバージョンが同期されません。新しいバージョンをリリースする際は、**必ず手動で以下のファイルを同一バージョンに更新**してください。

1. **`package.json`** (`"version"` フィールド)
2. **`Cargo.toml` (ルート)** (`version` フィールド)
3. **`src-tauri/Cargo.toml`** (`version` フィールド)
4. **`README.md` / `README.ja.md`** 上部にあるバージョンステータスバッジ

> [!WARNING]
> バージョンの不整合があると、ビルドエラーや GitHub Actions 上でのドラフトリリース作成の失敗原因となります。

---

## 2. 自動リリースパイプライン (CI/CD)

本プロジェクトは、GitHub Actions による自動ビルド・パッケージングパイプライン（`release.yml`）が定義されています。

### 2.1. トリガー条件
GitHub 上で **`v*`** (例: `v1.7.0`) の形式の Git タグがプッシュされた際にトリガーされます。

### 2.2. パイプラインが生成する配布物 (Artifacts)
Windows環境（`windows-latest`）上で並行ビルドされ、自動的に GitHub ドラフトリリースが作成されて以下の成果物がアップロードされます。

1. **Tauri版インストーラー**: `.msi` および `.exe` 形式のインストーラー（WiX または NSIS によりビルドされ、日本語ウィザードに対応）。
2. **egui単体版バイナリ**: `Snippetflow.exe` を Windows-x64 向けに圧縮した `.zip` アーカイブ。

---

## 3. 具体的なリリース手順

実際にリリースを行う際のステップは以下の通りです。

### ステップ 1: 品質チェックと事前検証
リリース対象のコミットがローカルでテストをパスすることを確認します。
```bash
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
```

### ステップ 2: バージョン情報の更新
`package.json`、`Cargo.toml`、`src-tauri/Cargo.toml` の `version` フィールドを新しいバージョン（例: `1.8.0`）に更新し、コミットします。

### ステップ 3: CHANGELOG.md の整理
`CHANGELOG.md` の `## [Unreleased]` セクションを、新しいバージョン名と日付（例: `## [1.8.0] - YYYY-MM-DD`）に変更し、変更内容を確定させます。

### ステップ 4: Gitタグの作成とプッシュ
ローカルでバージョンコミットを作成後、タグを打って GitHub にプッシュします。
```bash
# 変更のコミット
git add .
git commit -m "Bump version to v1.8.0"
git push origin main

# タグの作成とプッシュ
git tag -a v1.8.0 -m "Release v1.8.0"
git push origin v1.8.0
```

### ステップ 5: 自動ビルドの監視
GitHub の `Actions` タブから `Release Build` ワークフローが正常にグリーンで完了するのを待ちます。

### ステップ 6: ドラフトリリースの確認と公開
1. ワークフロー完了後、GitHub の Releases ページに `v1.8.0` のドラフトが生成されていることを確認します。
2. アセットに `Snippetflow.msi` / `Snippetflow_x64_en-US.msi` および `snippet_manager-windows-x64.zip` などがすべて存在することを確認します。
3. リリース文（CHANGELOGからコピー）を整え、「Publish release」をクリックして公開します。
