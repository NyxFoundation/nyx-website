## 0) プロジェクト概要

* プロジェクト名: **nyx-website**
* フレームワーク: **Next.js 14 (App Router)** + **TypeScript**
* スタイリング: **Tailwind CSS** + **shadcn/ui**（Radix UI ベース）
* i18n: **next-intl**（サブドメイン変更なし、同一オリジン）
* CMS/データ: **Notion API** + **react-notion-x**（publications/news を同一 DB で運用、`type` プロパティに `news` / `publication`）
* アイコン/フォント: **BIZ UDP明朝**（近似は `BIZ UDPMincho` / `Noto Serif JP` フォールバック）
* 品質: ESLint, Prettier, Husky, Lint-Staged, Playwright（E2E）
* デプロイ: Vercel 想定（ISR + Edge Runtime 併用）

### 目標

* **白背景・黒文字**のシンプルで可読性の高い研究財団サイト
* **日英対応**（UI トグル）
* **Publication / News** は Notion 1DB 運用 + `react-notion-x` レンダリング
* ヘッダー: 左ロゴ、中央ナビ（Publication / Member / Funding / News / Job / 言語スイッチ）
* モバイル: ハンバーガー + サイドバー
* トップページ: Hero / Activity（2x2 の不均一パネル、クリックでモーダル）

---

## 1) 初期化コマンド（実行用）

```bash
# 1. Next.js + TS
pnpm create next-app nyx-website --ts --eslint --src-dir --app --import-alias @/*
cd nyx-website

# 2. 依存関係
pnpm add tailwindcss postcss autoprefixer class-variance-authority tailwind-merge lucide-react
pnpm add @radix-ui/react-dialog @radix-ui/react-scroll-area
pnpm add next-intl
pnpm add notion-client notion-types react-notion-x katex prismjs
pnpm add zod ky

# 3. 開発・品質
pnpm add -D prettier prettier-plugin-tailwindcss eslint-config-next husky lint-staged
pnpm add -D @types/node @types/react @types/react-dom
pnpm add -D playwright @playwright/test

# 4. Tailwind 初期化
npx tailwindcss init -p
```

---

## 2) ディレクトリ構成（生成指示）

```
nyx-website/
  .husky/
  .vscode/
  app/
    (components)/
      ui/            # shadcn/ui ラップ
      header/
      footer/
      nav/
      hero/
      activity/
      modal/
      notion/
    (i18n)/
      locales/
        en.json
        ja.json
      messages.ts
    api/
      revalidate/route.ts  # ISR 手動再検証
    layout.tsx
    page.tsx               # Home
    publications/
      page.tsx
      [slug]/page.tsx
    news/
      page.tsx
      [slug]/page.tsx
    member/page.tsx
    funding/page.tsx
    job/page.tsx
    contact/page.tsx
  lib/
    notion.ts              # Notion クライアント/クエリ
    content.ts             # 型・取得関数
    i18n.ts
    env.ts                 # zod で env validate
    config.ts
  public/
    logo.svg
    fonts/
  styles/
    globals.css
    tailwind.css
  scripts/
    seed-notion.mjs        # デバッグ用フェッチ・整形
  requirements.md          # ★生成
  ROADMAP.md
  TODO.md                  # 自動更新
```

---

## 3) 環境変数 & 設定（`.env.local`）

```env
NOTION_DATABASE_ID=xxxxx
NOTION_TOKEN=secret_xxx
SITE_URL=https://nyx.foundation
NODE_ENV=development
NEXT_PUBLIC_DEFAULT_LOCALE=ja
NEXT_PUBLIC_SUPPORTED_LOCALES=ja,en
```

* `env.ts` で Zod によるバリデーションを実装
* `NEXT_PUBLIC_*` のみクライアント公開可

---

## 4) Notion スキーマ（同一 DB）

* プロパティ例

  * `type`: select(`news` | `publication`)
  * `slug`: rich\_text（URL 用一意）
  * `title`: title
  * `lang`: select(`ja` | `en`) ※同一記事の多言語を別ページ管理可
  * `published`: checkbox
  * `date`: date
  * `tags`: multi\_select
* クエリ要件

  * `published = true` AND `type = <kind>` のみ取得
  * `lang` は現在のロケール優先、なければフォールバック
  * 並び順: `date` desc

---

## 5) i18n (next-intl)

* ルートはそのまま（サブドメイン/パス前置きなし）
* `middleware` は **導入しない**（明示的トグル UI のみ）
* `app/(i18n)/messages.ts` でロケールメッセージを読み分け
* 言語トグルは `?locale=ja|en` をクエリに持たせ、`cookies` に保存

---

## 6) UI 要件（厳守）

### タイポグラフィ/テーマ

* 背景: 白、本文: 黒
* フォント: BIZ UDP明朝が最優先。なければ `"BIZ UDPMincho", "Noto Serif JP", serif` でフォールバック
* 余白・行間を十分に確保。見出しはやや大きめ。

### ヘッダー

* 左端: ロゴ（`/public/logo.svg`）
* 中央: ナビ（Publication / Member / Funding / News / Job / 言語トグル）
* 右側は余白
* スクロールで薄い下線（sticky）
* モバイル: 左ロゴ、右ハンバーガー → サイドバー（ナビ+言語トグル）

### トップページ

* **Hero**

  * 見出し: `Nyx Foundation`
  * サブコピー: `Building humanity's coordination space securely for open innovation`
  * ボタン横並び: `Publications` / `News`
  * `Contact →` で `/contact` へ
* **Activity パネル**

  * 2x2 の不均一タイル（masonry 風グリッド）。ホバーでわずかに持ち上げ影。
  * 項目: `Research`, `Whitehat Hacking`, `Formal Verification`, `Education`, `House`
  * クリックでモーダル（概要テキスト、多言語、今後リンクを追加可能）
  * スマホは縦並び

### Publications / News ページ

* 一覧: 日付降順。カードにタイトル/日付/タグ
* 詳細: `react-notion-x` で本文レンダリング（コード/数式対応）
* OGP/メタ: `generateMetadata` で設定

---

## 7) データ層

* `lib/notion.ts`: Notion クライアント（`notion-client`）
* `lib/content.ts`: 型/フェッチ（`getList(kind, locale)`, `getBySlug(kind, slug, locale)`）
* ISR: 一覧は `revalidate: 600`、詳細は `force-cache` + 手動再検証エンドポイント（/api/revalidate）
* エラーハンドリング: 404/エンプティの明示

---

## 8) 品質/CI

* ESLint/Prettier 設定（tailwind plugin 有効）
* Husky + lint-staged（pre-commit で `eslint --fix` & `prettier --write`）
* Playwright: 主要フロー（ナビ、言語切替、記事表示）
* Vercel: 環境変数と ISR を有効化

---

## 9) 要件定義ファイル（requirements.md を生成）

**最初に以下内容で `requirements.md` を作成し、以降はここを唯一の要件ソースとすること。**

* 背景/目的
* ペルソナ/情報設計
* 機能要件（ページ/セクション/ナビ/i18n/Notion 連携/Activity モーダル仕様）
* 非機能要件（パフォーマンス/アクセシビリティ/SEO/国際化）
* データモデル（Notion プロパティ、型定義）
* ルーティング（App Router マップ）
* 依存/制約（フォント、白黒テーマなど）
* 検収/受け入れ条件（アクセシビリティ AA 近似、CLS/INP しきい値、E2E 通過）

---

## 10) TODO 優先順位（自動生成・自動更新の指針）

1. **ブートストラップ**: Tailwind、shadcn/ui、フォント導入、ベースレイアウト
2. **i18n**: next-intl 配線、メッセージ辞書、言語トグル
3. **ヘッダー/ナビ**: PC/モバイル、サイドバー
4. **Hero セクション**
5. **Activity グリッド + モーダル**
6. **Notion 連携**: 型/フェッチ/一覧
7. **react-notion-x**: 詳細ページ実装（コード/数式対応）
8. **メタ/OGP/サイトマップ**
9. **E2E/アクセシビリティ修正**
10. **デプロイ/ISR 検証**

> 実装のたびに `TODO.md` を更新し、完了/残件/次の一手を明確化すること。

---

## 11) 受け入れ条件（抜粋）

* 主要ページにて BIZ 明朝系フォントが適用（フォールバック含む）
* 白背景/黒文字、十分なコントラスト
* ヘッダー中央にナビ、言語トグル機能
* モバイルでハンバーガー → サイドバーが操作可能
* Publications/News が Notion から取得・描画・一覧/詳細遷移
* Activity クリックでモーダル表示（文言は en/ja あり）
* Lighthouse: Performance/Best Practices/SEO >= 90 の目安

---

## 12) 実装タスクの自律ループ（必ず守ること）

**各イテレーション**

1. Plan: `requirements.md` と `TODO.md` を読み、1～3タスクを選ぶ
2. Implement: 変更ファイル一覧を提示 → 実装 → 単体テスト
3. Test: dev サーバ起動、主要ユースケース手動/Playwright で検証
4. Update: `TODO.md` と `ROADMAP.md` を更新（完了/次の課題/ブロッカー）
5. Commit: スコープ付き Conventional Commits でコミット

**コミット例**

* `feat(i18n): add next-intl with locale switcher`
* `feat(ui): header nav + mobile drawer`
* `feat(content): notion fetcher and type guards`
* `feat(notion): publications/news lists and detail pages`
* `feat(home): hero + activity grid with modal`
* `chore(ci): add husky + lint-staged`

---

## 13) 具体的な実装詳細（要約指示）

* **フォント**: Google Fonts から `Noto Serif JP` を先に導入し、将来 `BIZ UDPMincho` を self-host（`public/fonts/`）
* **ヘッダー**: `app/(components)/header/Header.tsx`、`nav` リンクは `next/link`。中央寄せは CSS Grid で `grid-cols-[1fr_minmax(0,640px)_1fr]` の中央に nav。
* **モバイル**: `@radix-ui/react-dialog` で Drawer 実装。フォーカストラップ必須。
* **Activity**: CSS Grid（`auto-rows-[minmax(8rem,auto)]`）+ `grid-row/col` で大小を作る。クリックでモーダル。
* **Notion**: `notion-client` でページブロック取得、`react-notion-x` でレンダリング。`katex`, `prismjs` を `dynamic import`。
* **ISR**: 一覧 `revalidate: 600`、詳細は `force-cache`。Webhook/管理者用に `/api/revalidate` を用意。

---

## 14) 最低限の型（サンプル）

```ts
export type Kind = 'news' | 'publication';
export type Locale = 'ja' | 'en';
export interface PostMeta { slug: string; title: string; date: string; tags: string[]; kind: Kind; locale: Locale; }
```

---

## 15) サンプル i18n メッセージ（`app/(i18n)/locales`）

**ja.json**

```json
{
  "nav": {"publications": "Publication", "member": "Member", "funding": "Funding", "news": "News", "job": "Job", "language": "言語"},
  "hero": {"title": "Nyx Foundation", "subtitle": "Building humanity's coordination space securely for open innovation", "btnPublications": "Publications", "btnNews": "News", "contact": "Contact →"},
  "activity": {"title": "Activity", "items": ["Research","Whitehat Hacking","Formal Verification","Education","House"]}
}
```

**en.json**

```json
{
  "nav": {"publications": "Publication", "member": "Member", "funding": "Funding", "news": "News", "job": "Job", "language": "Language"},
  "hero": {"title": "Nyx Foundation", "subtitle": "Building humanity's coordination space securely for open innovation", "btnPublications": "Publications", "btnNews": "News", "contact": "Contact →"},
  "activity": {"title": "Activity", "items": ["Research","Whitehat Hacking","Formal Verification","Education","House"]}
}
```

---

## 16) 追加の受託タスク（将来）

* 検索（クライアントサイド全文検索）
* メンバー/ファンディング詳細スキーマ
* OGP 画像自動生成（/og）
* 多言語記事の双方向リンク（ja/en）
* RSS/Atom 出力

---

## 17) 最初の出力期待物

1. `requirements.md`（本プロンプトを反映し詳細化）
2. `TODO.md`（優先度付きバックログ）
3. 初期画面（レイアウト + ヘッダー + Hero の骨組み）

> 以降、`TODO.md` を自律的に消化し、各イテレーションの成果物・差分を提示してください。

---

## Phase 2: 自律実装ランブック（localhost:3000 の実体検証を厳守）

> 前提: `requirements.md`, `TODO.md` が存在。以降はこの手順で「実装→起動→**localhost:3000 に自分でアクセスして HTML を確認**→テスト→記録」を 1 サイクルとして反復する。

### 0) 反復ルール（重要）

1. `requirements.md` と `TODO.md` を読み、**最優先の 1〜3 タスク**を選定して宣言。
2. 実装後に **必ず dev サーバを起動**し、**HTTP 200 と想定 HTML（“Nyx Foundation” など）を自動確認**。
3. 200 以外、もしくは想定文字列が見つからない場合は **次のタスクへ進まない**。原因を特定し修正。
4. Playwright スモークを実行（ナビ/言語切替/記事一覧/詳細）。
5. `TODO.md` / `ROADMAP.md` を更新、Conventional Commits でコミット。

---

### 1) ヘルスチェック仕組みの追加

以下のスクリプトを新規作成し、**自動で localhost:3000 を叩いて検証**する。

**`scripts/killport.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
PORT="${1:-3000}"
PIDS=$(lsof -ti tcp:$PORT || true)
if [ -n "$PIDS" ]; then
  echo "kill port $PORT: $PIDS"; kill -9 $PIDS || true
fi
```

**`scripts/healthcheck.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
URL=${1:-http://localhost:3000}
DEADLINE=$((SECONDS+120))
EXPECT=${2:-"Nyx Foundation"}

while true; do
  if (( SECONDS > DEADLINE )); then
    echo "[HC] timeout waiting for $URL" >&2
    exit 1
  fi
  STATUS=$(curl -s -o /tmp/nyx_home.html -w "%{http_code}" "$URL" || true)
  if [ "$STATUS" = "200" ] && grep -q "$EXPECT" /tmp/nyx_home.html; then
    echo "[HC] OK $URL contains '$EXPECT'"
    break
  fi
  sleep 2
done

# 主要パスも軽く確認
for p in "/" "/publications" "/news"; do
  curl -fsS "${URL%/}$p" >/dev/null || { echo "[HC] NG $p"; exit 1; }
  echo "[HC] 200 $p"
done
```

**`scripts/dev_up.mjs`**

```js
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const run = (cmd, args, opts={}) => new Promise((resolve, reject) => {
  const p = spawn(cmd, args, { stdio: 'inherit', ...opts })
  p.on('exit', code => code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} -> ${code}`)))
})

try {
  await run('bash', ['scripts/killport.sh', '3000'])
  const dev = spawn('pnpm', ['dev'], { stdio: 'inherit' })
  // 待機: Next.js の起動猶予
  await sleep(4000)
  await run('bash', ['scripts/healthcheck.sh', 'http://localhost:3000', 'Nyx Foundation'])
  console.log('[dev_up] server healthy')
} catch (e) {
  console.error('[dev_up] failed:', e)
  process.exit(1)
}
```

**`package.json` 追記**（抜粋）

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "dev:up": "node scripts/dev_up.mjs",
    "check:hc": "bash scripts/healthcheck.sh http://localhost:3000 'Nyx Foundation'",
    "smoke": "playwright test --config=playwright.config.ts --project=chromium --grep @smoke"
  }
}
```

> 以降、**必ず `pnpm dev:up` で起動→自己ヘルスチェック**を通すこと。落ちたらタスク続行禁止。

---

### 2) Playwright スモーク（@smoke）

**`tests/smoke.spec.ts`** に最低限の検証を追加:

```ts
import { test, expect } from '@playwright/test'

const base = process.env.BASE_URL || 'http://localhost:3000'

test.describe('smoke @smoke', () => {
  test('home renders hero', async ({ page }) => {
    await page.goto(base)
    await expect(page.locator('text=Nyx Foundation')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Publications' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'News' })).toBeVisible()
  })

  test('nav works', async ({ page }) => {
    await page.goto(base)
    await page.getByRole('link', { name: /Publication/i }).click()
    await expect(page).toHaveURL(/\/publications/)
    await page.getByRole('link', { name: /News/i }).click()
    await expect(page).toHaveURL(/\/news/)
  })

  test('locale toggle', async ({ page }) => {
    await page.goto(base)
    const hasJa = await page.locator('text=言語').count()
    expect(hasJa).toBeGreaterThan(0)
  })
})
```

---

### 3) 反復サイクル（テンプレ）

1. **Plan**: `TODO.md` の top 3 を宣言（例: `feat(header)`, `feat(i18n)`, `feat(activity)`）。
2. **Implement**: コード変更 → `pnpm dev:up` → **ヘルスチェックが通るまで修正**。
3. **Test**: `pnpm smoke` を実行。落ちた箇所を修正。
4. **Record**: `TODO.md` を「完了/着手中/未着手」に更新し、阻害要因を追記。必要なら `requirements.md` をバージョンアップ。
5. **Commit**: Conventional Commits（例: `feat(home): hero CTA and layout grid`）。

---

### 4) よくある失敗と対処

* **Port 3000 が埋まっている**: `scripts/killport.sh 3000` を先に実行。
* **起動直後に HC 失敗**: Next 起動待ち時間を `dev_up.mjs` で延長、あるいはログの "ready -" 行を待ってから HC 実行するロジックに改善。
* **Notion 未設定で 500**: `lib/notion.ts` でトークン未設定時は **スタブ JSON** に自動フォールバック（`data/stubs/{kind}.{locale}.json`）。
* **i18n 切替が効かない**: `next-intl` の `messages.ts` が `?locale=` と Cookie の両方を見ているかを確認。

---

### 5) 本フェーズの DOD（Definition of Done）

* `pnpm dev:up` が安定して **200 + “Nyx Foundation” を含む HTML** を返す。
* Header ナビとモバイルドロワーが動作、言語トグルが Cookie 持続。
* Home の Hero / Activity（モーダル含む）が可視。
* Publications / News 一覧ページが表示（Notion or スタブ）。
* `pnpm smoke` がグリーン。
* `TODO.md` に次フェーズのトップ 5 が記載。
