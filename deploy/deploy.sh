#!/usr/bin/env bash
# QuanterraOS Production Deployment Script
# Governed by HANDOFF.md Section J2
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/quanterraos/app}"
PORT="${PORT:-3102}"

echo "=== [1/5] Changing directory to $APP_DIR ==="
cd "$APP_DIR"

echo "=== [2/5] Fetching origin/main as service user (quanterraos) ==="
sudo -u quanterraos git fetch origin main

if ! sudo -u quanterraos git diff --quiet; then
  echo "ERROR: Local tracked changes detected in $APP_DIR — aborting deployment." >&2
  exit 1
fi

echo "=== [3/5] Updating working tree to origin/main ==="
sudo -u quanterraos git reset --hard origin/main

echo "=== [4/5] Installing production dependencies ==="
sudo -u quanterraos npm ci --omit=dev

echo "=== [5/5] Restarting production services ==="
sudo systemctl restart quanterra-web quanterra-orderbook-watchdog

echo "Waiting for web service to stabilize on port $PORT..."
sleep 3

if curl -fsS "http://localhost:${PORT}/healthz" > /dev/null; then
  echo "=== DEPLOYMENT SUCCESSFUL ==="
  echo "Healthcheck: http://localhost:${PORT}/healthz is OK"
  git log -1 --oneline
else
  echo "ERROR: Healthcheck failed on http://localhost:${PORT}/healthz" >&2
  exit 1
fi
