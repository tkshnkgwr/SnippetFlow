# SnippetFlow (SnippetManager)

[![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)](Cargo.toml)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#ライセンス)
[![Platform](https://img.shields.io/badge/platform-windows-lightgrey.svg)](#動作環境)
[![Rust Version](https://img.shields.io/badge/rust-1.70%2B-orange.svg)](#動作環境)

[English](README.md) | 日本語版

**SnippetFlow** は、Rust (`egui`/`eframe`) で構築された、Windows向けのスタイリッシュで背景透過かつ常時最前面に表示される定型文クリップボード・マネージャーです。
また、Google AI Studioから統合したReact/Viteプロトタイプ版も同リポジトリ内で並行稼働しており、Webおよびデスクトップの両プラットフォームで完全に同じ機能を体験できます。よく使う文章やコードを即座に検索し、ワンクリックでクリップボードへコピーできます。

---

## 主な機能

- **テーマ切り替え（ライト/ダーク）の対応**:
  - ヘッダーの切り替えボタン（`☀ ライト` / `🌙 ダーク`）で配色を動的変更。設定は `settings.json` に自動永続化されます。
- **スタイリッシュな透過UI**:
  - 標準のタイトルバーを排除し、Slate調の半透過背景を採用したモダンなグラスモルフィズムデザイン。
- **常時最前面表示 (Always on Top)**:
  - 他のアプリで作業している間も背後に隠れず、いつでもすぐに定型文にアクセス可能。
- **超低リソース動作**:
  - アイドル時の無駄な再描画を防ぐため、描画更新レートを最大1秒に1回に制限。アイドル時のCPU使用率はほぼ 0.0%〜0.1% を維持。
- **二重フィルター検索とタグクラウド**:
  - インクリメンタルテキスト検索、およびタグ検索に加え、一覧画面上に一意なタグを並べた「タグクラウドUI」を実装。トグル選択で瞬時に絞り込みが可能。
- **ワンクリックコピー & 複数結合コピー**:
  - ボタン一つで即座にコピー。また、複数選択して任意の区切り文字（改行や区切り線）で結合して一括コピー可能。
- **インテリジェント・タグ提案**:
  - 新規追加・編集フォームに入力されたタイトル（重み2倍）、本文、説明を分析し、既存の関連タグを出現頻度スコア順に最大5件まで自動推薦。
- **論理削除とアーカイブ復元・物理削除**:
  - スニペットを論理削除（アーカイブ移動）し、後から復元したり、完全にデータベースから永久物理削除したりすることが可能です。
- **バックアップと復元**:
  - ネイティブなOSダイアログを通じて、JSONデータベースのインポートおよびエクスポートが可能です。

---

## 設計・仕様詳細

各種詳細設計や技術的詳細は、`docs/` ディレクトリ配下のドキュメントをご参照ください。
- [機能仕様書 (SPEC.md)](docs/SPEC.md)
- [システム構成・設計図面 (DIAGRAM.md)](docs/DIAGRAM.md)
- [リソース測定記録 (FOOTPRINTS.md)](docs/FOOTPRINTS.md)
- [品質検証・テストレポート (test_report.md)](docs/test_report.md)

---

## 動作環境

### Rust デスクトップ版
- **OS**: Windows 10 / 11
- **開発言語環境**: Rust 1.70 以上 (Stable推奨)

### React Web版
- **実行環境**: Node.js v18 以上 (Vite 6 / React 19)

---

## ダウンロード

コンパイル済みのバイナリおよびインストーラーは、GitHub リポジトリの **[Releases](https://github.com/tkshnkgwr/SnippetFlow/releases)** ページから直接ダウンロードしてご利用いただけます。

* **Tauri デスクトップ版**: インストーラー形式（`.msi` や `.exe`）で提供され、通常のWindowsアプリと同様にインストール可能です。
* **Rust egui単体版**: `snippet_manager-windows-x64.zip` として提供されます。解凍後、中の `snippet_manager.exe` を直接実行して起動できます（インストール不要）。

---

## ビルドおよび起動手順

### 1. Rust デスクトップ版
ローカル環境でのビルドおよび実行手順は以下の通りです。
```bash
# 開発モードでアプリを起動
cargo run

# リリースビルドの生成 (コード最適化、シンボル削除等)
cargo build --release
```
ビルドが完了すると、`target/release/snippet_manager.exe` に実行可能バイナリが生成されます。
データの永続化ファイルとして `snippets.json` および `settings.json` が実行バイナリと同じ階層に出力されます。

### 2. React Web版
ローカル環境での起動およびビルド手順は以下の通りです。
```bash
# 依存パッケージのインストール
npm install

# ローカル開発サーバー起動 (ポート 3000)
npm run dev

# プロダクションビルドの生成
npm run build
```

### 3. Tauri デスクトップ版
ローカル環境でのビルドおよび実行手順は以下の通りです。
```bash
# 依存パッケージのインストール
npm install

# 開発モードでアプリを起動 (ホットリロード有効)
npx tauri dev

# リリースビルドの生成 (インストーラーを生成しない場合)
npx tauri build --no-bundle
```
ビルドが完了すると、`src-tauri/target/release/app.exe` に実行可能バイナリが生成されます。これを直接実行して起動できます。


---

## ライセンス

本プロジェクトは MIT ライセンスの下で提供されています。
