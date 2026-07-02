/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Snippet } from './types';

// Simple Word/Character-level Diffing Algorithm (LCS-based)
export interface DiffPart {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

export function computeDiff(oldText: string, newText: string): DiffPart[] {
  // Split by lines for a clean line-by-line comparison
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const dp: number[][] = Array(oldLines.length + 1)
    .fill(null)
    .map(() => Array(newLines.length + 1).fill(0));

  for (let i = 1; i <= oldLines.length; i++) {
    for (let j = 1; j <= newLines.length; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffPart[] = [];
  let i = oldLines.length;
  let j = newLines.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'unchanged', value: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', value: newLines[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'removed', value: oldLines[i - 1] });
      i--;
    }
  }

  return result;
}

// Initial default Japanese templates
export const DEFAULT_SNIPPETS: Snippet[] = [
  {
    id: 1001,
    title: "ビジネスメール：打ち合わせ日程調整",
    content: `〇〇株式会社\n〇〇様\n\nいつもお世話になっております。\n株式会社△△の [あなたの名前] です。\n\n先日に引き続き、新しいプロジェクトに関するお打ち合わせの日程を調整したくご連絡いたしました。\n\n恐れ入りますが、以下の候補日の中でご都合の良い日時がございましたら、ご教示いただけますと幸いです。\n\n【候補日程】\n1. 〇月〇日(月) 10:00 - 12:00\n2. 〇月〇日(水) 13:00 - 15:00\n3. 〇月〇日(金) 15:00 - 17:00\n\n上記以外でのご希望がございましたら、お気軽にお申し付けください。\n何卒よろしくお願い申し上げます。`,
    description: "新規取引先やプロジェクト開始前の打ち合わせ日程調整用メールテンプレートです。",
    createdAt: new Date("2026-06-01T10:00:00Z").toISOString(),
    updatedAt: new Date("2026-06-01T10:00:00Z").toISOString(),
    isDeleted: false,
    tags: ["ビジネス", "日程調整", "メール"]
  },
  {
    id: 1002,
    title: "ビジネスメール：お礼とお見積り送付",
    content: `〇〇株式会社\n〇〇様\n\n平素は格別のご高配を賜り、厚く御礼申し上げます。\n株式会社△△の [あなたの名前] です。\n\n本日はお忙しい中、貴重なお時間をいただき誠にありがとうございました。\n本日ご相談いただきました内容に基づき、お見積書を添付にて送付いたします。\n\n【添付内容】\n・御見積書_〇〇プロジェクト_20260630.pdf\n\n【お見積り概要】\n・総額：￥〇〇,〇〇〇 (税別)\n・納期：〇月〇日まで\n\nご不明な点や、調整のご要望などがございましたら、どうぞお気軽にお問い合わせください。\nご検討のほど、何卒よろしくお願い申し上げます。`,
    description: "商談や打ち合わせ後の迅速なお礼および見積書の送付メールテンプレートです。",
    createdAt: new Date("2026-06-15T11:30:00Z").toISOString(),
    updatedAt: new Date("2026-06-15T11:30:00Z").toISOString(),
    isDeleted: false,
    tags: ["ビジネス", "お見積り", "メール"]
  },
  {
    id: 1003,
    title: "システム障害：お詫びと復旧報告",
    content: `お客様各位\n\n平素は弊社サービスをご利用いただき、誠にありがとうございます。\n[サービス名] 運営事務局です。\n\n本日、弊社サービスにおきまして、一時的なシステム障害が発生し、一部の機能がご利用いただけない状態となっておりました。\n現在は復旧を完了し、通常通りご利用いただけます。\n\n【障害詳細】\n・発生日時：2026年〇月〇日 〇時〇分頃\n・復旧日時：2026年〇月〇日 〇時〇分頃\n・影響範囲：〇〇機能の一部アクセス制限\n・原因：サーバーへの急激なアクセス集中による高負荷\n\nご利用中の皆様には、多大なるご不便とご迷惑をおかけしましたことを、深くお詫び申し上げます。\n今後、再発防止に向けて監視体制の強化およびサーバー負荷対策を進めてまいります。\n\n引き続き弊社サービスを何卒よろしくお願い申し上げます。`,
    description: "システムやWebサービスに障害が発生し、復旧した際のお知らせ・お詫び文章です。",
    createdAt: new Date("2026-06-20T09:00:00Z").toISOString(),
    updatedAt: new Date("2026-06-22T14:20:00Z").toISOString(),
    isDeleted: false,
    tags: ["システム障害", "お詫び", "アナウンス"]
  },
  {
    id: 1004,
    title: "プルリクエスト（PR）テンプレート",
    content: `## 概要\n- [ ] 課題：#〇〇\n- [ ] 対応内容：〇〇機能の追加、および関連バグの修正\n\n## 変更点\n- ` + "`src/components`" + ` 配下に新規コンポーネントを追加\n- 共通フックにエラーハンドリングを追加\n- 不要なスタイルクラスのクリーンアップ\n\n## 動作確認・テスト内容\n- [ ] ローカル環境で一連の動作が問題ないことを確認\n- [ ] ` + "`npm run test`" + ` が全てパスすることを確認\n\n## 影響範囲\n- 設定画面のUIレイアウトに一部変更があります。\n\n## レビュアーへの特記事項\n特にパフォーマンスへの影響について注視していただきたいです。`,
    description: "GitHubなどのプルリクエストで共通して使える仕様説明テンプレートです。",
    createdAt: new Date("2026-06-25T15:00:00Z").toISOString(),
    updatedAt: new Date("2026-06-25T15:00:00Z").toISOString(),
    isDeleted: false,
    tags: ["開発", "GitHub", "PR", "テンプレート"]
  },
  {
    id: 1005,
    title: "[過去ログ] 古い日程調整メール（テスト用削除済）",
    content: `※これはテスト用の削除済み定型文です。\n過去ログ確認のテストとしてご利用ください。\n\n旧オフィスでの面接予約日程の調整です。`,
    description: "過去に削除された定型文のサンプルです。一覧の「削除済みを含む」トグルで表示可能です。",
    createdAt: new Date("2026-05-10T15:00:00Z").toISOString(),
    updatedAt: new Date("2026-05-10T15:00:00Z").toISOString(),
    deletedAt: new Date("2026-05-20T10:00:00Z").toISOString(),
    isDeleted: true,
    tags: ["ビジネス", "アーカイブ", "テスト用"]
  }
];

// Helper to generate large amounts of mock data to test JSON rendering & search speed performance
export function generateMockSnippets(count: number): Snippet[] {
  const baseTags = ["ビジネス", "開発", "サポート", "マーケティング", "プライベート", "テンプレ", "SNS", "重要"];
  const templates = [
    {
      title: "【自動生成】定期週次ミーティングの議事録テンプレート",
      content: "## 週次ミーティング議事録\n日時：毎週月曜 10:00-\n場所：会議室A または オンライン\n出席者：開発チーム全体\n\n### 【議題】\n1. 先週の進捗報告\n2. 今週のタスク・目標\n3. 課題と相談事項\n\n### 【決定事項】\n- \n\n### 【次回タスク】\n- [ ] ",
      description: "定期的に開催される週次ミーティングの議事録用フォーマットです。"
    },
    {
      title: "【自動生成】お客様への問い合わせへの初期対応・自動返信",
      content: "〇〇様\n\nお問い合わせありがとうございます。サポートチームです。\n現在内容を確認しております。通常24時間以内に回答いたしますので、今しばらくお待ちください。",
      description: "ユーザーからの一般的な問い合わせに対するファーストレスポンスです。"
    },
    {
      title: "【自動生成】ブログ記事用：導入挨拶テンプレート",
      content: "こんにちは、[あなたの名前]です！\n今回は〇〇について分かりやすく解説していきます。\n「〇〇について知りたいけれど何から始めればいいか分からない…」とお悩みの方は、ぜひ最後までご覧ください。",
      description: "個人ブログやテックブログのオープニング文章です。"
    }
  ];

  const mockData: Snippet[] = [];
  const startId = 2000;

  for (let i = 0; i < count; i++) {
    const tpl = templates[i % templates.length];
    const itemTags: string[] = [];
    const tagCount = 1 + (i % 3);
    for (let tc = 0; tc < tagCount; tc++) {
      const tag = baseTags[(i + tc * 2) % baseTags.length];
      if (!itemTags.includes(tag)) {
        itemTags.push(tag);
      }
    }

    const createdTime = new Date();
    createdTime.setDate(createdTime.getDate() - (i % 60));

    mockData.push({
      id: startId + i,
      title: `${tpl.title} #${i + 1}`,
      content: `${tpl.content}\n\n[管理用シリアル: SN-${100000 + i}]`,
      description: `${tpl.description} (シミュレーション用データ #${i + 1})`,
      createdAt: createdTime.toISOString(),
      updatedAt: createdTime.toISOString(),
      isDeleted: false,
      tags: itemTags
    });
  }

  return mockData;
}
