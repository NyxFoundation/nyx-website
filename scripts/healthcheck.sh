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

# 主要パスも軽く確認（まだ実装されていないページは除外）
for p in "/"; do
  curl -fsS "${URL%/}$p" >/dev/null || { echo "[HC] NG $p"; exit 1; }
  echo "[HC] 200 $p"
done