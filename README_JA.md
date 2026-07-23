# SnippetFlow (SnippetManager)

[![Version](https://img.shields.io/badge/version-1.13.0-blue.svg)](Cargo.toml)
[![GitHub Release](https://img.shields.io/github/v/release/tkshnkgwr/SnippetFlow)](https://github.com/tkshnkgwr/SnippetFlow/releases)
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

各種詳細設計や技術的詳細は、`docs/ja/` ディレクトリ配下のドキュメントをご参照ください。
- [機能仕様書 (SPEC.md)](docs/ja/SPEC.md)
- [システム構成・設計図面 (DIAGRAM.md)](docs/ja/DIAGRAM.md)
- [リソース測定記録 (FOOTPRINTS.md)](docs/ja/FOOTPRINTS.md)
- [品質検証・テストレポート (TEST_REPORT.md)](docs/ja/TEST_REPORT.md)
- [テスト方針・実行ガイド (TESTING.md)](docs/ja/TESTING.md)
- [セキュリティポリシー (SECURITY.md)](docs/ja/SECURITY.md)
- [貢献ガイドライン (CONTRIBUTING.md)](docs/ja/CONTRIBUTING.md)
- [開発者ガイド (DEVELOPING.md)](docs/ja/DEVELOPING.md)
- [リリース手順書 (RELEASE.md)](docs/ja/RELEASE.md)
- [開発およびコーディング指示書 (INSTRUCTIONS.md)](docs/ja/INSTRUCTIONS.md)
- [タスク管理・TODO (TODO.md)](docs/ja/TODO.md)
- [ユーザーガイド (USER_GUIDE.md)](docs/ja/USER_GUIDE.md)

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
ビルドが完了すると、`src-tauri/target/release/Snippetflow.exe` に実行可能バイナリが生成されます。これを直接実行して起動できます。


---

## 活用例（スニペット・サンプル）

SnippetFlowで管理・再利用するのに適したスニペットのサンプル例です。コピー＆ペーストしてアプリに登録し、日々の業務にご活用ください。

### 1. 日程調整の定型文 (Plain Text)
*   **タイトル**: `日程調整（候補日提示）`
*   **タグ**: `Business, Email, Schedule`
*   **本文**:
    ```text
    お世話になっております。〇〇株式会社の[自分の名前]です。
    お打ち合わせの件につきまして、以下の日程でご都合いかがでしょうか。
    
    ・〇月〇日（〇） 10:00 - 12:00
    ・〇月〇日（〇） 13:00 - 15:00
    ・〇月〇日（〇） 15:00 - 17:00
    
    上記でご都合が悪い場合は、恐れ入りますが候補日を2〜3挙げていただけますと幸いです。
    オンライン（Teams / Zoom）での実施を希望いたします。
    何卒よろしくお願い申し上げます。
    ```

### 2. 打合せ議事録テンプレート (Markdown)
*   **タイトル**: `打合せ議事録`
*   **タグ**: `Meeting, Markdown, Template`
*   **本文**:
    ```markdown
    # 【打合せ議事録】[プロジェクト名] 定例ミーティング
    
    - **日時**: 202X年MM月DD日（水） 10:00 - 11:00
    - **場所**: Teams
    - **出席者**: [名前A], [名前B], [自分]
    
    ## ■ アジェンダ
    1. 進捗報告
    2. 課題およびボトルネックの共有
    3. 次週のアクションプラン
    
    ## ■ 決定事項
    - 決定事項1
    - 決定事項2
    
    ## ■ ToDo（タスク・期限・担当）
    - [ ] タスクA（期限: MM/DD, 担当: [名前A]）
    - [ ] タスクB（期限: MM/DD, 担当: [自分]）
    
    ## ■ メモ
    - 議論の詳細や特記事項をここに記載します。
    ```

### 3. AIのプロンプト (Plain Text)
*   **タイトル**: `コードリファクタリング用プロンプト`
*   **タグ**: `AI, Prompt, Dev`
*   **本文**:
    ```text
    以下のコードをリファクタリングしてください。
    
    # 満たしてほしい要件：
    - 可読性の向上（変数名、関数分割など）
    - パフォーマンスの最適化
    - エラーハンドリングの強化
    
    # 対象コード：
    ```

### 4. Gitコミットメッセージ (Plain Text)
*   **タイトル**: `Gitコミットメッセージテンプレート`
*   **タグ**: `Git, Dev, Template`
*   **本文**:
    ```text
    feat: [新機能の短い説明]

    - [変更点1の詳細]
    - [変更点2の詳細]

    Ref: #[イシュー番号]
    ```

### 5. SQLクエリテンプレート (SQL / Plain Text)
*   **タイトル**: `日付指定集計クエリ`
*   **タグ**: `SQL, Database, Dev`
*   **本文**:
    ```sql
    SELECT 
        DATE(created_at) AS order_date,
        COUNT(id) AS total_orders,
        SUM(total_amount) AS total_sales
    FROM orders
    WHERE created_at >= '2026-01-01'
    GROUP BY DATE(created_at)
    ORDER BY order_date DESC;
    ```

---

## ライセンス

本プロジェクトは MIT ライセンスの下で提供されています。
