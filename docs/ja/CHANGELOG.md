[English](../en/CHANGELOG.md) | **日本語版**

# CHANGELOG

プロジェクトのすべての重要な変更が本ファイルに記録されます。

---

## [Unreleased]

## [1.13.0] - 2026-07-23

### Added
- **スニペットの暗号化保存 (`common_lib/src/crypto.rs`, `src-tauri`, `src-egui`)**:
  - 暗号化・復号モジュール `common_lib::crypto` を新設し、`ENC1:` ヘッダーによるデータの安全な暗号化/復号をサポート。平文 JSON データとの自動判別により完全な上位互換性を維持。
- **まとめて削除（一括削除・復元・完全削除）機能 (`src-react`)**:
  - 定型文一覧画面において複数スニペットの選択および「まとめて削除（ゴミ箱移動）」「まとめて復元」「一括完全削除（物理削除）」を実行できるフローティングアクションツールバーを追加。
- **共通ロジックのユニットテスト大規模拡充 (`common_lib/src/text.rs`)**:
  - `compute_diff`（LCS差分計算）、`suggest_tags`（インテリジェントタグ提案）、`count_occurrences`、`format_bytes` に対する境界値・異常系（空文字、マルチバイト、超長文等）ユニットテストを追加。

### Fixed
- **GitHub Release タイトルのバージョン名不一致の修正 (`.github/workflows/release.yml`)**:
  - `releaseName` に指定されていたプレースホルダー `SnippetFlow v__VERSION__` が `tauri.conf.json` の間接参照（`"version": "../package.json"`）を正常解釈できず旧バージョン表記になっていた問題を修正。
  - Gitタグ名から直接動的展開される `SnippetFlow ${{ github.ref_name }}`（例: `SnippetFlow v1.12.0`）に変更し、タグ名とリリース名が常に100%一致するよう改善。
- **データストレージのエラーハンドリング強化とアトミック書き込み (`src-tauri/src/lib.rs`, `src-egui/storage.rs`)**:
  - `snippets.json` 破損時に既存データを破壊せず `.bak` ファイルへ安全保護コピーを行った上で初期状態へ安全復旧する安全機構を導入。
  - 保存時に一時ファイル (`snippets.json.tmp`) を経由するアトミック置換書き込みを導入し、ファイル保存途中のアプリ強制終了やクラッシュによる破損を防止。
- **バージョンアップ後のスニペットデータ消失問題の修正 (`src-tauri/src/lib.rs`)**:
  - スニペットの保存先を相対パス（`snippets.json`）から、`app.path().app_data_dir()` で取得するOS標準のアプリデータディレクトリへ変更。
  - データの保存先が `%APPDATA%\com.snippetflow.app\snippets.json` に固定され、バージョンアップや再インストール後もデータが消えなくなった。
  - データディレクトリが存在しない場合に自動作成するヘルパー関数 `get_storage_path()` を追加。
  - `load_snippets`・`save_snippets` コマンドに `tauri::AppHandle` 引数を追加し、実行時に正しいパスを動的解決するよう変更。

## [2026-07-21]

### Added
- **Cargo Features によるプラットフォーム依存機能の分離 (`Cargo.toml`, `src-tauri/Cargo.toml`)**:
  - ルート `Cargo.toml` および `src-tauri/Cargo.toml` に `[features]` セクションを追加。
  - `windows_desktop` フィーチャーを定義し、共有ライブラリ `common_lib` の `windows_desktop` フィーチャーと連動させることで、プラットフォーム固有の機能切り替えおよびカスタマイズビルドを可能に向上。

### Optimized
- **`src-egui/ui.rs` のサブモジュール分割リファクタリング (`src-egui/ui/`)**:
  - 単一ファイルで1000行を超過していた `src-egui/ui.rs`（1122行）を、機能別の5つのサブモジュール（`list.rs`, `form.rs`, `compare.rs`, `merge.rs`, `stats.rs`）へ分割。
  - エージェント指示書（`.agents/AGENTS.md`）にプログラムソース1000行超過時のリファクタリング勧告ルールを策定・明記。

### Added
- **Tauriバックエンドへのデータ保存の完全移行 (`src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`, `src-react/hooks/useSnippets.ts`)**:
  - Tauri起動時に Rust バックエンドを介してカレントディレクトリの `snippets.json` からデータをロードし、保存時も Rust 側でファイル書き込みを行う設計へアップグレード。
  - バックエンドでのデータ保存形式（`snake_case`）とフロントエンドでのオブジェクト仕様（`camelCase`）の間の差異を吸収するため、Rust側に `DbSnippet` と `TauriSnippet` を定義し、相互変換を実装。
  - `useSnippets.ts` にて、非同期でのデータロード完了前に空データやデフォルトデータで `snippets.json` を上書き保存してしまう競合を防ぐための `isLoaded` ステート制御を追加。
- **開発ドキュメントおよびエージェント向け指示書の整備・リファクタリング (`docs/ARCHITECTURE.md`, `docs/INSTRUCTIONS.md`, `docs/TODO.md`, `.agents/AGENTS.md`)**:
  - システムアーキテクチャ設計書 (`docs/ARCHITECTURE.md`) を見直し、データフロー解説を Mermaid ダイアグラムで強化。
  - プロジェクト全体の命名規則、エラーハンドリング方針、コンポーネント分割基準、AI用出力フォーマットを明文化した開発用指示書 (`docs/INSTRUCTIONS.md`) を新規作成。
  - 実装済み機能、直近のタスク、拡張提案のバックログを一元管理するタスク管理ドキュメント (`docs/TODO.md`) を新規作成。
  - エージェント用指示書 (`.agents/AGENTS.md`) に新規ドキュメント（`INSTRUCTIONS.md`, `TODO.md`）の更新ポリシーを追記し、自動ドキュメンテーションのルールをアップデート。
- **ソースコードフォルダの完全分離 (`src-egui/`, `src-react/`)**:
  - 混在していた `src/` ディレクトリを解体し、egui版（Rust）を `src-egui/`、React版（TypeScript/CSS）を `src-react/` にそれぞれ分離配置。
  - エントリーポイントやビルド定義（`Cargo.toml`, `index.html`, `vite.config.ts`）を新構成に追従。
- **各種プログラムソースコードのコメント日本語化**:
  - `src-egui/main.rs`、`src-react/` 配下の TypeScript ファイル等、主要なコード内の英語コメントをすべて日本語に翻訳。
- **Markdownのみの修正におけるドキュメント自動更新の除外ルール定義 (`.agents/AGENTS.md`)**:
  - プログラムコードの変更がないMarkdownファイルのみの修正のときは、大賢者によるCHANGELOG.mdや各種設計書の自動ドキュメンテーションおよび自動更新処理をスキップする例外ルールを記述。

### Optimized
- **二重起動防止機能の common_lib 移行 (`Cargo.toml`, `src-egui/main.rs`)**:
  - `single-instance` 外部クレートへの直接依存を排除。
  - `common_lib` に実装された Win32 API 制御の Named Mutex 二重起動防止関数 (`check_single_instance`) に移行し、依存関係を整理。
- **GitHub Actions CI設定の最適化 (`.github/workflows/ci.yml`)**:
  - Markdownファイルのみの修正時にはGitHub ActionsのCIビルド（frontend、rust-egui、rust-tauriのジョブ）が起動しないように `paths-ignore` を設定。

### Fixed
- **TypeScript の検証範囲制限 (`tsconfig.json`)**:
  - `npm run lint` (`tsc --noEmit`) が `src-tauri/target/` 以下の自動生成されたビルドアセットなどを検査して型エラーを引き起こす問題を修正するため、検査対象を `src-react` 以下に限定し、不要なディレクトリを除外。
- **プロジェクト全体のバージョン情報の不整合修正 (`package.json`, `src-tauri/Cargo.toml`, `README.md`, `README.ja.md`)**:
  - ルート `Cargo.toml` の `1.9.0` に合わせ、`package.json` および `src-tauri/Cargo.toml` のバージョン、ならびに `README` 内のバージョンバッジを `1.9.0` に統一。

## [1.8.0] - 2026-07-09

### Added
- **開発ドキュメントの一括整備およびエージェント指示書の更新 (`docs/DEVELOPING.md`, `docs/RELEASE.md`, `docs/USER_GUIDE.md`, `docs/ARCHITECTURE.md`, `.agents/AGENTS.md`)**:
  - 開発者ガイド (`DEVELOPING.md`)、リリース手順書 (`RELEASE.md`)、操作マニュアル (`USER_GUIDE.md`)、アーキテクチャ設計書 (`ARCHITECTURE.md`) を新規追加。
  - 大賢者用のドキュメント自動更新ルール (`AGENTS.md`) に対象ファイルとして上記4点と更新ポリシーを追記。
- **お気に入り（ピン留め）機能の実装 (`src/types.ts`, `src/App.tsx`, `src/components/SnippetList.tsx`, `src/main.rs`)**:
  - 定型文カードにピン留めボタン（📌）を追加し、ピン留めされた定型文がリストの最上部に固定されるように実装。
  - ピン留めされたスニペットのカード全体の枠線と背景をIndigo調で強調表示するUIデザインをReact版およびRust/egui版の双方に導入。
- **使用統計（アナリティクス）機能の実装 (`src/types.ts`, `src/App.tsx`, `src/components/SnippetList.tsx`, `src/components/SnippetMerge.tsx`, `src/components/SnippetCompare.tsx`, `src/components/StatsPanel.tsx`, `src/main.rs`)**:
  - コピー回数 (`copyCount`) と累計短縮時間 (`savedTimeSec`) をスニペット情報に追加。
  - 1文字コピーあたり「0.3秒」の短縮と仮定して統計情報を算出。
  - 「よく使う順（コピー数）」でのソート基準を追加。
  - 性能メーター画面に「使用統計（アナリティクス）」カードを追加し、総コピー回数、累計短縮時間、よく使う定型文トップ3のランキングを表示。
- **多重起動防止機能（Single Instance）の実装 (`Cargo.toml`, `src/main.rs`, `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`)**:
  - アプリケーションが複数同時に起動されることを防止する機能を egui版および Tauri版の双方に導入。
  - egui版では `single-instance` クレートを用い、多重起動時にプロセスを静かに終了する設計を導入。
  - Tauri版では `tauri-plugin-single-instance` プラグインを用い、2つ目のインスタンス起動時に既存のウィンドウを前面に呼び出してフォーカスさせる設計を実装。
- **READMEへのスニペット活用例の追加 (`README.md`, `README.ja.md`)**:
  - アプリケーションの利用イメージを促進するため、日程調整定型文（PlainText）、打合せ議事録（Markdown）、AIリファクタリングプロンプト、Gitコミットテンプレート、SQLクエリテンプレートの具体例を追加。
- **GitHub Releaseバッジの追加 (`README.md`, `README.ja.md`)**:
  - README上部にGitHub最新リリースのステータスバッジを追加。

### Fixed
- **GitHub Actions リリースワークフローのエラー修正 (`.github/workflows/release.yml`)**:
  - `tauri-apps/tauri-action` のバージョン指定を誤って存在しない `@v2` と記述していたため、正式にサポートされている `@v0` に修正。
- **Tauri ビルド設定ファイルのスキーマエラー修正 (`src-tauri/tauri.conf.json`)**:
  - `cargo tauri build` 実行時にスキーマバリデーションエラーを引き起こしていた、Tauri v2 で廃止済みの `bundle > android > debugApplicationIdSuffix` 設定を削除。
- **Tauri 実行バイナリ名（パッケージ名）の競合防止およびドキュメント修正 (`src-tauri/Cargo.toml`, `README.md`, `README.ja.md`, `docs/FOOTPRINTS.md`)**:
  - Windows でのアプリ起動時にデフォルト名（`app.exe`）と競合し、インストーラー起動時にアプリが強制終了してしまう問題を防止するため、パッケージ名を `Snippetflow` に変更。
  - これに伴い、各種ドキュメント（README、FOOTPRINTS）内に残っていた `app.exe` の記述をすべて `Snippetflow.exe` に更新。
- **大賢者向けガイドラインファイルの更新 (`.agents/AGENTS.md`)**:
  - 他プロジェクトとの衝突やインストーラーの誤動作を防ぐため、Tauri のパッケージ名としてデフォルト値 `"app"` の指定を禁止する品質管理ルールを追記。
- **GitHub Actions ワークフローにおける共有ライブラリ依存関係の解決エラー修正 (`ci.yml`, `release.yml`)**:
  - リポジトリのチェックアウトパスを調整し、`SnippetFlow` をルートに直接展開。
  - `actions/checkout` のセキュリティ制約（ワークスペース外への直接チェックアウトの制限）を回避するため、`common_lib` を一旦ワークスペース内にチェックアウト後、PowerShell コマンドを用いて親ディレクトリ `../common_lib` に配置するように修正。
  - これにより、`Cargo.toml` に定義された相対パスと一致しないために発生していた clippy ジョブのビルドエラーを解消。
- **GitHub Actions ワークフロー定義の修正 (`ci.yml`, `release.yml`)**:
  - 共有ライブラリ `common_lib` チェックアウト時のPATトークンにフォールバック (`secrets.PAT || github.token`) を設定し、シークレット未設定時でもエラーで停止しないように改善。
- **リリースアセットのアップロード処理およびパスの修正 (`release.yml`)**:
  - egui単体版のリリースアセット追加ステップにて、従来の `gh` CLIから `softprops/action-gh-release@v2` アクションに変更し、安定版のバージョンを指定。
  - アセットファイルの指定パスを実際の出力先である `SnippetFlow/target/release/...` に修正。

---

## [1.7.0] - 2026-07-03

### Added
- **共有クレート `common_lib` への依存関係の追加**:
  - 隣接する共有ライブラリ `common_lib` を `Cargo.toml` の依存関係に登録。

### Optimized
- **文字列処理および差分計算アルゴリズムの共通化**:
  - `main.rs` から汎用ユーティリティ `count_occurrences`、および LCS 差分計算ロジック（`compute_diff`、`DiffType`）を `common_lib` 側に移行。
  - 重複コードを排除し、コードの再利用性を向上。
- **[FOOTPRINTS.md](docs/FOOTPRINTS.md) の更新**:
  - `common_lib` 導入後のリリースバイナリサイズ（2.88 MB -> 2.92 MB）を実測・反映。
- **Tauri インストーラー日本語化設定の追加 (`tauri.conf.json`)**:
  - Windows でのインストーラービルド時（WiX / NSIS）に日本語のウィザードが表示されるように言語設定を追加。
- **GitHub Actions (CI/Release) ワークフローのビルドエラー修正 (`ci.yml`, `release.yml`)**:
  - 共有クレート `common_lib` も同一CI環境でチェックアウトするように変更。
  - ジョブの作業ディレクトリを `SnippetFlow` に統一し、依存関係が正しく解決されるように修正。

## [1.6.0] - 2026-07-02

### Added
- **Tauri デスクトップ環境における JSON インポート・エクスポートコマンドの実装**:
  - デスクトップ版 (Tauri) でブラウザのダウンロード挙動が制限されることに対応し、ネイティブファイルダイアログ (`rfd` クレート) を用いたインポート/エクスポート用 Rust コマンドを実装。
  - フロントエンドから `invoke` することで安全にバックアップ・復元を行えるように修正。

### Fixed
- **全枠線・グループ要素のテーマ対応カラー修正 (egui)**:
  - `ui.group` がライトモード切り替え時にも一部ダークモードの配色（暗いグレーの枠線など）を維持してしまう問題を修正。
  - すべての枠線付き要素（定型文カード、検索ボックス枠、編集メタ枠、比較/結合枠など）に対し、明示的にライトモードとダークモードで切り替わるカスタム `theme_card_frame` レンダリングを適用。
- **画面の固定ヘッダー・フッター化による UI 崩れの解消**:
  - リストのスクロール時にタイトルヘッダーおよび一括アクションフッターが隠れないよう、画面上下にレイアウトを固定（egui版、React版共通）。
  - egui版では `TopBottomPanel` と `CentralPanel` を組み合わせ、React版では最上位ラッパー `#app-container` に `h-screen overflow-hidden` を指定して全体の縦スクロールを完全に制限した上で、カードリスト領域のみを `flex-1 overflow-y-auto min-h-0` にて部分スクロール化する形で実装。
- **ウィンドウのサイズ変更・操作性の整理およびテキスト見切れの修正 (egui)**:
  - タイトルバー非表示・透過設定によってOS標準のウィンドウリサイズ操作が制限されていたのを解消するため、`eframe::NativeOptions` の `decorated: true` および `resizable: true` を有効化し、ユーザーが端をドラッグしてウィンドウサイズを自由に変更できるように修正。
  - OSタイトルバーの表示に伴い、重複していたアプリ内の「閉じる」ボタン、「ドラッグ移動」ボタン、およびアプリ名ラベルを削除し、ヘッダー領域を「テーマ切り替えボタン」のみに整理。バージョン情報はウィンドウタイトルバーに表示。
  - 起動時の初期ウインドウサイズを `1000 x 900` ピクセルへ拡大し、一覧の視認性を向上。
  - 定型文一覧でタイトルや説明文が長い場合に画面右側に見切れてしまう問題を解決するため、`egui::Label::new(...).wrap(true)` による自動テキスト折り返しを適用。
- **追加・編集フォーム画面の入力欄の整列改善 (egui)**:
  - タイトル、本文、説明文、タグ追加などの各入力項目を `egui::Grid` を用いた表形式レイアウトへ再設計。各項目ラベルの幅と入力フィールドの縦ラインをミリ単位で完璧に整列させ、入力フォームとしての美しさと操作性を向上。
- **Tailwind CSS v4 における OS ダークモード設定との競合回避 (React)**:
  - OS側がダークモードに設定されている際、アプリ側でライトモードを選択してもカード内部等の要素に `dark:` プレフィックスのスタイルが強制適用されてしまう競合を解消。
  - `src/index.css` へ `@variant dark` バリアント定義を追記してクラスベースのダークモードを強制し、`App.tsx` のテーマ切り替え処理から最上位 `html` 要素のクラスリストへ動的に `.dark` クラスを同期・トグルする設計へ修正。

## [1.5.0] - 2026-07-02

### Added
- **検索キーワードのハイライト表示機能**:
  - 検索欄に入力されたテキストに一致する部分を、スニペットのタイトルや本文（プレビュー）内でカラーハイライト表示する機能を Rust (egui)版および React (Vite)版の双方に追加。
  - egui版では `LayoutJob` による動的レンダリング、React版では `<mark>` 要素を用いたハイライト処理を実装。
  - 検索結果に一致した件数をリアルタイムで表示する機能を一覧上部に追加。
- **スニペット一覧の並び替え（ソート）機能**:
  - 選択した基準（更新日が新しい順、更新日が古い順、作成日が新しい順、タイトル順）でスニペットリストを動的に並び替える機能を Rust (egui)版および React (Vite)版の双方に実装。
  - egui版ではコンボボックス、React版ではセレクトボックスによる基準選択UIを追加。
  - 並び替え基準の設定はローカル設定（`settings.json` / `localStorage`）に保存・永続化され、アプリ再起動時にも選択状態が維持されるように修正。

### Fixed
- **ライトモードにおける「しろ基調」デザインの徹底 (egui & React)**:
  - 従来の「背景だけ白くなり、枠線やカード内部のコントラストが中途半端に暗い」というライトモードの問題を解消。
  - 削除された定型文のグレー表示をベースとした、全体的にしろ基調で極めて清潔感と一貫性のあるモダンなライトテーマ（純白の背景、スレート調の淡いグレーの境界線、柔らかなコントラストのフォント）を UI 全体に再設計。
- **UI コンポーネントおよびボタンサイズの一貫性向上 (egui)**:
  - egui版において、機能追加によってズレが生じていた各ボタンのパディング、フォントサイズ、および要素間のスペーシングを調整し、ピクセル単位での整列と洗練された外観を維持。
- **並び替えロジックのユニットテスト追加**:
  - 並び替え機能（`test_sorting_snippets`）を検証するユニットテストを Rust 側テストスイートに追加。

## [1.3.0] - 2026-07-01

### Added
- **テーマ永続化・切り替え機能の移植 (Rust)**: `settings.json` を用いたライト／ダークテーマの選択状態の永続化、およびヘッダーの切り替えボタン（☀ ライト / 🌙 ダーク）による動的描画（背景透過色・テキスト色のライト/ダーク対応）の実装。
- **タグクラウド選択による絞り込み機能の移植 (Rust)**: スニペットから一意なタグを抽出し、一覧画面にボタン形式で並べたタグクラウドUIの実装。トグルによるワンクリック絞り込みに対応。
- **スニペットメタデータおよび復元・永久削除機能の移植 (Rust)**: 編集フォームにおけるユニークナンバー・作成日・更新日の表示、およびアーカイブ済み（論理削除）スニペットに対する「復元する」ボタンと「完全に削除する（物理削除）」ボタンの出し分け処理の実装。
- **設定永続化検証用ユニットテストの追加 (Rust)**: `test_settings_persistence` テストケースを新規追加。
- **ウィンドウサイズ拡大とドラッグハンドル (Rust)**: 初期ウィンドウサイズを 800x850 に拡大し、画面項目切れを解消。タイトルバー非表示でもウィンドウを移動できるようにヘッダーにドラッグハンドル（`⛶ 移動` ボタン）を新設。
- **React(JavaScript)版の復旧**: `npm install` と `npm run build` を実行し、Vite + TS + Reactの開発環境およびビルド環境の正常動作を確認。
- **複数結合（マージ）専用画面の追加 (Rust)**: 選択された複数の定型文をリスト順にマージする専用画面を実装。並び替え（↑/↓）機能、区切り文字の選択（改行1つ/2つ、---、===、読点、区切りなし）、マージされたテキストのライブプレビューおよびコピーに対応。
- **差分比較画面のLCS差分カラー表示 (Rust)**: 選択された2つの定型文の差分を、LCS（最長共通部分列）アルゴリズムに基づき、追加された行は緑、削除された行は赤でカラーハイライト表示するビューアーを実装。
- **性能メーター画面の追加 (Rust)**: 総スニペット数、推定ファイルサイズ、直近の検索クエリ実行時間（ミリ秒）を表示する性能メーター画面を実装。100回平均検索処理のベンチマーク実行機能も追加。
- **大量データ負荷テスト機能 (Rust)**: メモリ検索の速度変化や描画負荷を検証するためのダミーデータ自動生成（+1000, +2000, +5000件）および一括削除機能を実装。
- **ファイルダイアログによるJSONインポート/エクスポート (Rust)**: `rfd` (Rust File Dialogs) クレートを追加し、ネイティブなOSのファイル選択・保存ダイアログを介してスニペットデータベースのJSONインポートおよびバックアップエクスポートを行える機能を実装。
- **ナビゲーションタブの導入 (Rust)**: アプリケーション上部に「定型文一覧」「新規登録」「差分比較」「複数結合」「性能メーター」のナビゲーションタブを新設し、React版と完全に一致する画面遷移システムを実装。

### Fixed
- **Vite サーバーの Watch 除外設定**: Rust 側のビルドやテスト実行中に `target` ディレクトリ内のバイナリ競合による EBUSY ロックエラーで Vite サーバーがクラッシュするのを防ぐため、`vite.config.ts` で `target`, `docs`, `src/main.rs`, `Cargo.toml`, `Cargo.lock` を監視対象から除外。
- **Tauri アプリウィンドウの終了処理 (React)**: フロントエンド `src/App.tsx` において、非推奨の `@tauri-apps/api/window` を Tauri v2 標準の `@tauri-apps/api/webviewWindow` に修正し、`getCurrentWebviewWindow().close()` による正しいウィンドウ終了処理を実装。
- **ウィンドウの常時最前面表示（Always-on-Top）の解除**: ユーザーからのフィードバックに基づき、Tauri版（`tauri.conf.json`）および egui版（`src/main.rs`）のウィンドウ設定において `alwaysOnTop` / `always_on_top` を `false` に変更。

### Optimized
- **検索処理の最適化 (Rust)**: `draw_list_screen` でのフィルタリング処理をループの外に抽出し、計測対象の純粋なクエリ処理速度を向上させ、100%正確な処理時間（ミリ秒）を取得可能に。
- **Clippyおよび警告の完全解消 (Rust)**: 未使用のメソッド削除や `std::mem::swap` の採用など、`-D warnings`（警告をエラーとする Clippy 設定）に完全適合させ、コンパイル警告をゼロに。

## [1.2.0] - 2026-07-01

### Added
- **動的バージョン表示**: `Cargo.toml` のバージョン設定をコンパイル時に動的取得するよう修正 (`env!("CARGO_PKG_VERSION")` の導入)。
- **日本語フォントの自動登録**: `egui` のデフォルトフォントにおける日本語の文字化け（豆腐文字）問題を解決するため、起動時に Windows システム의 標準日本語フォント（メイリオ等）を動的探索し、優先フォントとして登録する処理を追加。
- **ユニットテスト**: `src/main.rs` の末尾に自動テストモジュール (`mod tests`) を追加。`count_occurrences`、初期データ、およびキーワード分析に基づくタグ提案ロジックの動作検証を自動化。
- **各種設計ドキュメントの新規作成**:
  - `docs/SPEC.md`: ウィンドウ仕様、透過性、低リソースなどの機能および技術仕様書。
  - `docs/DIAGRAM.md`: アプリケーション構造やシーケンスフローを示す Mermaid 設計図面。
  - `README.md` / `README.ja.md`: 多言語の製品概要およびビルド手順書（相互リンクおよびステータスバッジの追加）。
  - `docs/FOOTPRINTS.md`: バイナリサイズやリソース消費量を追跡するパフォーマンス記録書。
- **詳細仕様に基づく全面再構築**:
  - `AppScreen` 状態遷移 (List / Add / Edit / Compare) による画面分離設計を導入。
  - アプリケーション起動時に `snippets.json` を動的ロードし、追加・編集・論理削除時に即時保存するローカルファイル永続化処理を実装。
  - 日付（作成日 `created_at`、更新日 `updated_at`、削除日 `deleted_at`、削除フラグ `is_deleted`）の厳密な仕様に準拠するため `chrono` クレートを追加し、論理削除機能を実装。
  - 一覧画面に複数選択用チェックボックスおよび「結合してコピー」機能を追加。
  - 選択された2つの定型文を左右並行して比較・確認できる比較画面を新規追加。
  - タイトル・本文検索とは独立して機能するタグ検索バーの設置、および過去・削除済みデータの表示切り替えチェックボックスの実装。
- **ユニットテストの拡充**: `tests` モジュールに `test_logical_deletion` などを追加し、合計4件の検証テストを実施。

### Fixed
- **eframe コンパイルエラーの修正**:
  - Windowsプラットフォームで `eframe` のビルドに必要な `winapi` フィーチャーが競合等で不足していた問題を、`Cargo.toml` へ明示的に `winapi = { version = "0.3.9", features = ["winuser"] }` を依存関係定義に追加することで解決。
  - `src/main.rs` のウィンドウオプション定義における `..Default::options()` を、正しい `..Default::default()` に修正し、Rustコンパイラによる「トレイトが型として期待された」エラーを解消。
- **UIサイズと文字サイズの最適化**:
  - ウィンドウが小さく文字が見づらい問題に対応するため、ウィンドウ初期サイズを `500x650` に拡大し、フォントサイズ（本文・ボタン・ヘッダー）を全体的に拡大して視認性を向上。
