[English](../en/DEVELOPING.md) | **日本語版**

# 開発者ガイド (DEVELOPING.md)

本ドキュメントは、「定型文クリップボード・マネージャー (SnippetFlow)」の開発環境構築、ビルド手順、およびテスト方法について定義します。

---

## 1. 開発環境のシステム要件

本プロジェクトをビルド・実行するためには、以下の環境が事前にインストールされている必要があります。

* **OS**: Windows 10 / 11 (低リソース環境を前提とした最適化を行っています)
* **Node.js**: `v18.x` 以上 (Vite 6 / React 19 ビルド用)
* **Rust**: `1.77.2` 以上 (Tauri v2 ビルド用)

---

## 2. ディレクトリ構成と共有クレート依存設定

本リポジトリは、隣接する共有ライブラリ `common_lib` と密に連携しています。ローカル開発時には、以下の配置になっている必要があります。

```text
ワークスペース親フォルダ/
├── common_lib/            # 共有Rustライブラリ (差分計算LCS等のコアロジック)
└── SnippetFlow/           # 本プロジェクト (メインリポジトリ)
```

> [!IMPORTANT]
> `src-tauri/Cargo.toml` は相対パス `../../common_lib` を用いて共有ライブラリを参照しています。
> Gitからチェックアウトする際は、必ず同一の親ディレクトリの下に両リポジトリを展開してください。
> GitHub Actions (CI) では、チェックアウトステップにおいて自動的にこの構造が再現されるようワークフローが構成されています。

---

## 3. 開発および実行手順

本アプリは、**Tauri 2 デスクトップ環境 (React 19 + Rust)** として設計されています。Webテクノロジーによるリッチで快適なUIと、Rustバックエンドによる高速なファイルI/O・データ処理を両立しています。

### 3.1. デスクトップ版の起動（推奨・本番環境）

```bash
# 依存パッケージのインストール
npm install

# 開発モードでアプリを起動 (フロントエンド + Rustバックエンド連動)
npm run tauri dev

# プロダクション向けインストーラーのビルド (.msi / .exe)
npm run tauri build
```

### 3.2. Web版（UI確認・プロトタイプ検証用）

```bash
# ローカル開発サーバー起動 (ポート 3000)
npm run dev

# 静的バンドルのビルド検証
npm run build
```

---

## 4. 品質管理と事前検証プロセス

変更をコミットする前に、ローカルで以下の静的解析・テストがすべて合格（エラー・警告ゼロ）することを確認してください。

### 1. フロントエンドの型チェック・ビルド検証

```bash
npm run lint
npm run build
```

### 2. Rust コードフォーマット規約の準拠

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml --check
```

- ※フォーマットエラーが出た場合は、`cargo fmt --manifest-path src-tauri/Cargo.toml` を実行して自動整形を行ってください。

### 3. Rust 静的解析 (Clippy)

```bash
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

- ※警告はエラーとして扱われます。すべて解決した上でコンパイルを通してください。

### 4. ユニットテストの実行

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

- ※新規機能やロジック変更時は、適切なテストコードを追加・拡張してください。
