[English](../en/RELEASE.md) | **日本語版**

# リリース手順書 (RELEASE.md)

本ドキュメントは、「定型文クリップボード・マネージャー (SnippetFlow)」の製品版リリース手順、バージョン同期管理ルール、および自動パッケージングパイプラインの運用方法について定義します。

---

## 1. バージョン管理と自動同期ルール (SSOT)

本プロジェクトは、フロントエンド（React / TypeScript）とバックエンド（Rust / Tauri）で構成されています。バージョンの乖離や不整合を防ぐため、以下のルールを厳守してください。

### 1.1. 信頼できる唯一の情報源 (SSOT)
バージョン情報の正となる情報は、ルートディレクトリの **`package.json`** です。フロントエンドでのバージョン表示などはすべて `package.json` から動的にロードされます。また、`src-tauri/tauri.conf.json` も `"version": "../package.json"` として自動参照されます。

### 1.2. 手動同期が必要なファイル群
Node.js (`package.json`) と Rust (`src-tauri/Cargo.toml`) は自動でバージョンが同期されません。新しいバージョンをリリースする際は、**必ず手動で以下のファイルを同一バージョンに更新**してください。

1. **`package.json`** (`"version"` フィールド)
2. **`src-tauri/Cargo.toml`** (`version` フィールド)
3. **`README.md` / `README_JA.md`** 上部にあるバージョンステータスバッジ

> [!WARNING]
> バージョンの不整合があると、ビルドエラーや GitHub Actions 上でのドラフトリリース作成の失敗原因となります。

---

## 2. 自動リリースパイプライン (CI/CD)

本プロジェクトは、GitHub Actions による自動ビルド・パッケージングパイプライン（`release.yml`）が定義されています。

### 2.1. トリガー条件
GitHub 上で **`v*`** (例: `v1.15.0`) の形式の Git タグがプッシュされた際にトリガーされます。

### 2.2. パイプラインが生成する配布物 (Artifacts)
Windows環境（`windows-latest`）上でビルドされ、自動的に GitHub ドラフトリリースが作成されて以下の成果物がアップロードされます。

* **Tauri版インストーラー**: `.msi` および `.exe` 形式のインストーラー（NSIS / WiX によりビルドされ、日本語ウィザードに対応）。

---

## 3. 具体的なリリース手順

実際にリリースを行う際のステップは以下の通りです。

### ステップ 1: 品質チェックと事前検証
リリース対象のコミットがローカルでテストをパスすることを確認します。
```bash
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
npm run lint
npm run build
```

### ステップ 2: バージョン情報の更新
`package.json`、`src-tauri/Cargo.toml` の `version` フィールド、および `README.md` / `README_JA.md` のバッジを新しいバージョンに更新し、コミットします。

### ステップ 3: CHANGELOG.md の整理
`docs/ja/CHANGELOG.md` および `docs/en/CHANGELOG.md` に、新しいバージョン名と日付（例: `## [1.15.0] - 2026-09-07`）のセクションを追加し、変更内容を確定させます。

### ステップ 4: Gitタグの作成とプッシュ
ローカルでバージョンコミットを作成後、タグを打って GitHub にプッシュします。
```bash
# 変更のコミット
git add .
git commit -m "chore: Bump version to v1.15.0"
git push origin main

# タグの作成とプッシュ
git tag -a v1.15.0 -m "Release v1.15.0"
git push origin v1.15.0
```

### ステップ 5: 自動ビルドの監視
GitHub の `Actions` タブから `Release Build` ワークフローが正常にグリーンで完了するのを待ちます。

### ステップ 6: ドラフトリリースの確認と公開
1. ワークフロー完了後、GitHub の Releases ページに該当バージョンのドラフトが生成されていることを確認します。
2. アセットに `.msi` および `.exe` 形式のインストーラーが存在することを確認します。
3. リリース文（CHANGELOGからコピー）を整え、「Publish release」をクリックして公開します。
