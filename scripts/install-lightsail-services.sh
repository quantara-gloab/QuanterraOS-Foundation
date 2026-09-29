#!/usr/bin/env bash
set -euo pipefail

project_dir="${PROJECT_DIR:-/opt/quanterraos/app}"
unit_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../deploy/systemd" && pwd)"

if [[ ! -d "$project_dir" || ! -f "$project_dir/.env" ]]; then
  echo "Expected project and .env at $project_dir" >&2
  exit 1
fi

for unit in "$unit_dir"/*.service; do
  install -o root -g root -m 0644 "$unit" "/etc/systemd/system/$(basename "$unit")"
done

systemctl daemon-reload
systemctl enable --now \
  quantterra-web.service \
  quantterra-dashboard.service \
  quantterra-kalshi-btc-logger.service \
  quantterra-exchange-price-poller.service \
  quantterra-outcome-tracker.service \
  quantterra-orderbook-watchdog.service

systemctl --no-pager --full status \
  quantterra-web.service \
  quantterra-dashboard.service \
  quantterra-kalshi-btc-logger.service \
  quantterra-exchange-price-poller.service \
  quantterra-outcome-tracker.service \
  quantterra-orderbook-watchdog.service