# Nyx Foundation Website - 要件定義書

## 1. プロジェクト概要

### 1.1 基本情報
- **プロジェクト名**: nyx-website
- **目的**: Nyx Foundation研究財団の公式ウェブサイト構築
- **コンセプト**: 白背景・黒文字のシンプルで可読性の高い研究財団サイト

### 1.2 技術スタック
- **フレームワーク**: Next.js 14 (App Router) + TypeScript
- **スタイリング**: Tailwind CSS + shadcn/ui（Radix UIベース）
- **国際化**: next-intl（サブドメイン変更なし、同一オリジン）
- **CMS/データ**: Notion API + react-notion-x
- **フォント**: BIZ UDP明朝（優先）/ Noto Serif JP（フォールバック）
- **品質管理**: ESLint, Prettier, Husky, Lint-Staged, Playwright（E2E）
- **デプロイ**: Vercel（ISR + Edge Runtime併用）

## 2. ペルソナ・情報設計

### 2.1 想定ユーザー
- 研究者・学術関係者
- イノベーション・技術開発に関心のある企業
- 資金提供を検討する投資家・助成団体
- セキュリティ・形式検証の専門家
- 教育機関関係者

### 2.2 サイトゴール
- 財団の活動・研究成果の発信
- メンバー・資金調達情報の透明な公開
- ニュース・求人情報の適時更新
- 国際的な訴求（日英対応）

## 3. 機能要件

### 3.1 ページ構成
1. **ホーム** (`/`)
   - Heroセクション（タイトル、サブコピー、CTAボタン）
   - Activityグリッド（5項目の不均一パネル）

2. **Publications** (`/publications`)
   - 研究成果・出版物の一覧
   - 詳細ページ（`/publications/[slug]`）

3. **News** (`/news`)
   - ニュースの一覧
   - 詳細ページ（`/news/[slug]`）

4. **Member** (`/member`)
   - メンバー情報の表示

5. **Funding** (`/funding`)
   - 資金調達・助成情報

6. **Job** (`/job`)
   - 求人情報

7. **Contact** (`/contact`)
   - お問い合わせフォーム

### 3.2 ナビゲーション要件

#### デスクトップ
- **ヘッダー構成**:
  - 左端: ロゴ（SVG）
  - 中央: メインナビ（Publication / Member / Funding / News / Job）
  - 言語切替トグル
  - スクロール時: sticky + 薄い下線

#### モバイル
- 左端: ロゴ
- 右端: ハンバーガーメニュー
- サイドバー: ナビゲーション + 言語切替

### 3.3 国際化（i18n）
- 対応言語: 日本語（ja）、英語（en）
- デフォルト: 日本語
- 実装: next-intl（middlewareなし）
- 言語切替: クエリパラメータ（`?locale=ja|en`）+ Cookie保存

### 3.4 Notion連携
- **データベース構造**:
  - 単一DBで`news`と`publication`を管理
  - `type`プロパティで区別
- **必須プロパティ**:
  ```
  - type: select (news | publication)
  - slug: rich_text（一意のURL用）
  - title: title
  - lang: select (ja | en)
  - published: checkbox
  - date: date
  - tags: multi_select
  ```
- **取得条件**:
  - `published = true`
  - 現在のロケールに対応する`lang`を優先
  - 日付降順でソート

### 3.5 Activityモーダル仕様
- **項目**: Research, Whitehat Hacking, Formal Verification, Education, House
- **動作**: クリックでモーダル表示
- **内容**: 多言語対応の概要テキスト
- **レイアウト**: 2x2の不均一グリッド（masonry風）

## 4. 非機能要件

### 4.1 パフォーマンス
- Lighthouse Performance: >= 90
- Core Web Vitals:
  - LCP: < 2.5s
  - FID: < 100ms
  - CLS: < 0.1
- ISR: 一覧ページ600秒、詳細ページforce-cache

### 4.2 アクセシビリティ
- WCAG 2.1 レベルAA準拠
- キーボードナビゲーション完全対応
- スクリーンリーダー対応
- 十分なコントラスト比（白背景・黒文字）

### 4.3 SEO
- メタタグ自動生成
- OGP対応
- サイトマップ生成
- 構造化データ（JSON-LD）

### 4.4 セキュリティ
- 環境変数の適切な管理（Zodバリデーション）
- Notion APIキーのサーバーサイド限定
- CSPヘッダー設定

## 5. データモデル

### 5.1 型定義
```typescript
export type Kind = 'news' | 'publication';
export type Locale = 'ja' | 'en';

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  kind: Kind;
  locale: Locale;
}

export interface Post extends PostMeta {
  content: any; // Notion blocks
}

export interface Activity {
  id: string;
  title: { [key in Locale]: string };
  description: { [key in Locale]: string };
  icon?: string;
  link?: string;
}
```

## 6. ルーティング構造

```
/                     # ホーム
/publications         # Publication一覧
/publications/[slug]  # Publication詳細
/news                 # News一覧
/news/[slug]          # News詳細
/member               # メンバー
/funding              # 資金調達
/job                  # 求人
/contact              # お問い合わせ
/api/revalidate       # ISR手動再検証
```

## 7. デザイン仕様

### 7.1 カラーパレット
- 背景: #FFFFFF（白）
- 本文: #000000（黒）
- リンク: #0000EE（青）→ hover: #551A8B（紫）
- ボーダー: #E5E5E5（薄グレー）

### 7.2 タイポグラフィ
- 本文フォント: "BIZ UDPMincho", "Noto Serif JP", serif
- 見出し: 同上（ウェイト調整）
- 本文サイズ: 16px（base）
- 行間: 1.7
- 余白: 十分に確保

### 7.3 レスポンシブブレークポイント
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 8. 環境変数

```env
NOTION_DATABASE_ID=xxxxx
NOTION_TOKEN=secret_xxx
SITE_URL=https://nyx.foundation
NODE_ENV=development
NEXT_PUBLIC_DEFAULT_LOCALE=ja
NEXT_PUBLIC_SUPPORTED_LOCALES=ja,en
```

## 9. 品質保証

### 9.1 テスト戦略
- 単体テスト: コンポーネント・ユーティリティ
- E2Eテスト: Playwright（主要フロー）
- アクセシビリティテスト: axe-core

### 9.2 CI/CD
- Pre-commit: ESLint + Prettier
- PR時: ビルド + テスト実行
- デプロイ: Vercel自動デプロイ

## 10. 受け入れ条件

### 10.1 必須要件
- [ ] 全ページが白背景・黒文字で表示される
- [ ] BIZ UDP明朝フォントが適用される（フォールバック含む）
- [ ] 日英切替が正常に動作する
- [ ] Notionから記事が取得・表示される
- [ ] モバイルでハンバーガーメニューが動作する
- [ ] Activityクリックでモーダルが表示される

### 10.2 品質基準
- [ ] Lighthouse Performance >= 90
- [ ] Lighthouse Accessibility >= 90
- [ ] Lighthouse Best Practices >= 90
- [ ] Lighthouse SEO >= 90
- [ ] E2Eテスト全項目PASS
- [ ] WCAG 2.1 レベルAA準拠

### 10.3 納品物
- ソースコード（Gitリポジトリ）
- 環境構築手順書
- デプロイ手順書
- 運用マニュアル

## 11. 制約事項

1. **フォント制約**: BIZ UDP明朝の商用利用ライセンス確認要
2. **Notion API制限**: レート制限に注意（ISRで緩和）
3. **画像最適化**: next/imageの使用必須
4. **ブラウザサポート**: Chrome, Firefox, Safari, Edge最新版

## 12. 今後の拡張予定

- クライアントサイド全文検索
- メンバー/ファンディング詳細スキーマ
- OGP画像自動生成
- 多言語記事の双方向リンク
- RSS/Atom配信
- ニュースレター購読機能

## 13. リスクと対策

| リスク | 影響度 | 対策 |
|-------|--------|------|
| Notion APIダウン | 高 | ISRキャッシュ + 静的生成フォールバック |
| フォントライセンス問題 | 中 | Noto Serif JPへのフォールバック |
| SEOインデックス遅延 | 中 | サイトマップ提出 + 構造化データ |
| モバイル表示崩れ | 高 | レスポンシブファースト開発 |

## 14. スケジュール目安

1. **Phase 1** (1-2日): 基盤構築
   - プロジェクト初期化
   - 基本レイアウト・ヘッダー
   - i18n設定

2. **Phase 2** (2-3日): コアページ実装
   - Heroセクション
   - Activityグリッド
   - 基本ページ（Member, Funding, Job）

3. **Phase 3** (3-4日): Notion連携
   - API接続
   - 一覧・詳細ページ
   - react-notion-x統合

4. **Phase 4** (1-2日): 品質向上
   - E2Eテスト
   - パフォーマンス最適化
   - アクセシビリティ改善

5. **Phase 5** (1日): デプロイ
   - Vercel設定
   - 本番環境構築
   - 動作確認

## 15. 成功指標

- ページロード時間: 3秒以内
- 月間ページビュー: 10,000PV以上
- 直帰率: 40%以下
- 平均滞在時間: 2分以上
- モバイルトラフィック比率: 30%以上