# Nyx Foundation Website - タスクリスト

## 進捗状況
- 総タスク数: 65
- 完了: 35
- 進行中: 0
- 未着手: 30

---

## Phase 1: 基盤構築 (優先度: 最高) ✅ 完了

### 初期セットアップ
- [x] requirements.md作成
- [x] TODO.md作成（本ファイル）
- [x] Next.js + TypeScriptプロジェクト初期化
- [x] 依存パッケージインストール
- [x] ディレクトリ構造作成
- [x] 環境変数設定（.env.local）
- [x] globals.cssビルドエラー修正
- [x] ヘルスチェックスクリプト実装（killport.sh, healthcheck.sh, dev_up.mjs）
- [x] Playwright smoke test実装
- [x] 開発サーバー動作確認

### 設定ファイル
- [x] Tailwind CSS基本設定
- [ ] TypeScript設定最適化（tsconfig.json）
- [ ] ESLint設定（.eslintrc.json）
- [x] Prettier設定（.prettierrc）
- [ ] Husky + lint-staged設定

---

## Phase 2: UI基盤 (優先度: 最高) ✅ ほぼ完了

### デザインシステム
- [x] **BIZ UDP明朝フォント導入**（Google Fonts）
- [x] Noto Serif JPフォールバック設定
- [x] 白背景・黒文字テーマ確立
- [ ] shadcn/ui初期設定
- [ ] UIコンポーネント基盤（Button, Card, Dialog等）

### レイアウト
- [x] ルートレイアウト実装（app/layout.tsx）
- [x] ヘッダーコンポーネント（PC版）
- [x] モバイルナビゲーション（ハンバーガー + サイドバー）
- [x] フッターコンポーネント
- [ ] ページレイアウトラッパー

---

## Phase 3: 国際化 (優先度: 高)

### i18n設定
- [x] next-intl基本設定
- [x] ロケールメッセージファイル作成（ja.json, en.json）
- [x] メッセージローダー実装
- [x] 言語切替コンポーネント
- [ ] **Cookie管理実装**（言語設定の永続化）
- [ ] ?locale=ja|enクエリパラメータ対応

---

## Phase 4: ホームページ (優先度: 高)

### Heroセクション
- [x] Heroコンポーネント実装
- [x] タイトル・サブコピー表示
- [x] CTAボタン（Publications / News）
- [x] Contact リンク
- [x] レスポンシブ対応

### Activityセクション
- [x] Activityグリッドレイアウト（2x2不均一）
- [x] アクティビティカード実装
- [x] **モーダルコンポーネント**（@radix-ui/react-dialog）
- [x] **モーダル内コンテンツ**（多言語対応）
- [x] ホバーエフェクト

---

## Phase 5: Notion連携 (優先度: 中)

### 環境設定
- [ ] Notion APIトークン取得
- [ ] データベースID設定
- [ ] Zod環境変数バリデーション（lib/env.ts）

### データ層
- [ ] Notionクライアント実装（lib/notion.ts）
- [ ] 型定義（lib/types.ts）
- [ ] コンテンツ取得関数（lib/content.ts）
- [ ] **スタブデータフォールバック**（data/stubs/）
- [ ] エラーハンドリング

### 一覧ページ
- [x] **Publications一覧ページ**
- [x] **News一覧ページ**
- [ ] ページネーション実装
- [ ] フィルター・ソート機能

### 詳細ページ
- [ ] react-notion-x設定
- [ ] Publications詳細ページ
- [ ] News詳細ページ
- [ ] コードハイライト（Prism.js）
- [ ] 数式レンダリング（KaTeX）

---

## Phase 6: 静的ページ (優先度: 中) ✅ ほぼ完了

- [x] Memberページ実装
- [x] Fundingページ実装
- [x] Jobページ実装
- [x] Contactページ実装
- [ ] 404ページカスタマイズ
- [ ] エラーページカスタマイズ

---

## Phase 7: SEO・メタデータ (優先度: 中)

- [ ] メタタグ生成（generateMetadata）
- [ ] OGP設定
- [ ] サイトマップ生成
- [ ] robots.txt設定
- [ ] 構造化データ（JSON-LD）

---

## Phase 8: パフォーマンス最適化 (優先度: 低)

- [ ] 画像最適化（next/image）
- [ ] フォント最適化
- [ ] ISR設定
- [ ] Edge Runtime設定
- [ ] キャッシュ戦略

---

## Phase 9: テスト・品質保証 (優先度: 低)

### テスト
- [x] Playwright E2Eテスト設定
- [x] smoke test作成
- [ ] 主要フローE2Eテスト作成
- [ ] アクセシビリティテスト
- [ ] レスポンシブテスト

### 品質チェック
- [ ] Lighthouse監査（Performance/Best Practices/SEO >= 90）
- [ ] WCAG 2.1準拠チェック
- [ ] ブラウザ互換性テスト
- [ ] パフォーマンス測定（CLS/INP基準）

---

## Phase 10: デプロイ・運用 (優先度: 最低)

### デプロイ準備
- [ ] Vercel設定
- [ ] 環境変数設定（本番）
- [ ] ドメイン設定
- [ ] SSL証明書確認

### 運用準備
- [ ] 再検証エンドポイント実装（/api/revalidate）
- [ ] エラー監視設定
- [ ] アナリティクス設定
- [ ] バックアップ戦略

---

## 将来の拡張機能（Phase 11+）

- [ ] クライアントサイド検索
- [ ] RSS/Atomフィード
- [ ] OGP画像自動生成
- [ ] ニュースレター購読
- [ ] 多言語記事リンク
- [ ] PWA対応
- [ ] ダークモード（オプション）

---

## ブロッカー・課題

### 現在のブロッカー
- なし

### 要確認事項
- BIZ UDP明朝フォントのライセンス確認
- Notion APIトークン取得
- ドメイン（nyx.foundation）の準備状況

---

## 次のアクション（優先度順）

1. **言語切替のCookie永続化**
2. **Publications/News詳細ページ実装**
3. **Notion API連携**（環境変数設定、クライアント実装）
4. **メタデータ最適化**（generateMetadata）
5. **404/エラーページカスタマイズ**

---

## 更新履歴

- 2025-08-15: 初版作成
- 2025-08-15: requirements.md完了、TODO.md作成中
- 2025-08-15: Phase 1完了、ヘルスチェック・smoke test実装
- 2025-08-15: prompt.mdの要件に合わせて全面改訂
- 2025-08-15: Phase 2,4,6ほぼ完了、全静的ページ実装済み