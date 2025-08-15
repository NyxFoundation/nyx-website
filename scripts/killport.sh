#!/usr/bin/env bash
set -euo pipefail
PORT="${1:-3000}"
PIDS=$(lsof -ti tcp:$PORT || true)
if [ -n "$PIDS" ]; then
  echo "kill port $PORT: $PIDS"; kill -9 $PIDS || true
fi