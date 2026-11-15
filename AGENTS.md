# AGENTS.md

Instructions for coding agents working on the Nyx Foundation website.

## Stack

- Next.js 15 (App Router, Turbopack dev), React 19, TypeScript strict.
- Tailwind CSS v4 via `@tailwindcss/postcss` with a CSS-first theme in `src/app/globals.css`: `:root` tokens mapped through `@theme inline` (colors `background`/`foreground`/`muted`/`muted-foreground`/`border`/`card`), `--font-serif` wired to the next/font variables, and `--animate-fade-in`. There is no `tailwind.config.ts` — Tailwind v4 does not auto-load JS configs; extend the theme only in CSS.
- Path alias `@/*` → `src/*`.
- `next.config.ts` webpack-aliases `pino-pretty` and `@react-native-async-storage/async-storage` to stubs under `src/lib/stubs/` (WalletConnect/AppKit requirements under webpack). Do not remove these.

## Commands

All are npm scripts from `package.json` (inspected, not executed):

- `npm run dev` — dev server on port 3000. `npm run dev:up` kills port 3000, starts dev, then healthchecks the homepage for "Nyx Foundation".
- `npm run lint` — ESLint (`next/core-web-vitals` + `next/typescript`).
- `npm run build` / `npm start` — production build and serve.
- `npm run smoke` — Playwright, Chromium only, tests tagged `@smoke` in `tests/`. Config auto-starts `npm run dev` unless a server already listens on port 3000; `BASE_URL` targets another host. There is no unit-test framework.
- `npm run check:hc` — `scripts/healthcheck.sh` against localhost:3000.

No CI runs lint/build/tests; the only workflow (`.github/workflows/fetch-db.yml`, manual `workflow_dispatch`) refreshes Notion data and commits it directly. Verify changes locally with lint + build + smoke.

## Notion CMS snapshot architecture

- Content is baked into the repo: `npm run fetch:db` (`scripts/fetch-notion-data.mjs`) snapshots four Notion databases into `src/data/notion/*.json` (members, news, publications, projects, open-positions) and downloads images into `public/notion-assets`.
- `src/lib/notion.ts` reads only these local JSON files; page content never queries Notion at request time. Notion edits reach the site only after re-running the fetch and committing the regenerated JSON/assets.
- Notion blocks (publications/news/recruit) render through the custom `src/components/NotionBlockRenderer.tsx`, including KaTeX for equations. Not react-notion-x, not MDX.
- Runtime (server-side) integrations are the exception:
  - `/api/donations` — writes donation submissions to Notion (`NOTION_TOKEN`, `NOTION_DONATIONS_DATABASE_ID`).
  - `/api/apply` — recruit applications to Notion (`NOTION_RECRUIT_FORM_DATABASE_ID`) plus a Discord notification.
  - `/api/contact` — Discord webhook (`DISCORD_WEBHOOK_URL`); skipped in dev when unset.
  - `/api/debug-blocks`, `/api/test-notion`, `/api/test-page` — dev/debug routes that query Notion directly.

## Donations & wallet flow

- `/donate` uses wagmi + viem + Reown AppKit: `src/lib/appkit/config.ts` and `src/providers/AppKitProvider.tsx`; wallet/chain config in `src/data/donate.json` and `src/app/donate/constants.ts`.
- Requires `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`; falls back to `"demo"` and treats wallets as unconfigured in production when unset.

## i18n (cookie-based, non-default)

- next-intl with locales `ja` (default) and `en`; messages in `src/i18n/locales/{ja,en}.json`.
- Locale comes from a `locale` cookie set by the server action `src/app/actions/locale.ts`. There is no `/en/` URL prefix and no middleware — all routes are locale-less. New UI strings need `useTranslations`/`getTranslations` and updates to both locale JSON files.

## Environment variables

`.env*` is gitignored and there is no committed example file.

- Data fetch (`npm run fetch:db`, loads dotenv): `NOTION_TOKEN`, `NOTION_DATABASE_ID`, `NOTION_MEMBER_DATABASE_ID`, `NOTION_PROJECTS_DATABASE_ID`, `NOTION_OPEN_POSITION_DATABASE_ID`.
- Runtime: `NOTION_TOKEN`, `NOTION_DONATIONS_DATABASE_ID`, `NOTION_RECRUIT_FORM_DATABASE_ID`, `DISCORD_WEBHOOK_URL`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_SITE_URL` / `SITE_URL`, `NEXT_PUBLIC_DEFAULT_TIME_ZONE` (default `Asia/Tokyo`). `npm run build` runs without env vars — Notion clients are created lazily at request time; missing runtime envs fail the relevant API route.

## Conventions

- Prettier: double quotes, semicolons, printWidth 80, trailing comma `es5`, plus `prettier-plugin-tailwindcss` class sorting.
- husky and lint-staged are installed as devDependencies but not configured (no `.husky/` directory, no lint-staged config) — nothing runs automatically; run `npm run lint` before handing off.
- Before finishing a change: lint, then build, then run smoke tests if pages/flows changed.
