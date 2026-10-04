#!/usr/bin/env bash
set -euo pipefail

project_dir="${PROJECT_DIR:-/opt/quanterraos/app}"
unit_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../deploy/systemd" && pwd)"

if [[ ! -d "$project_dir" || ! -f "$project_dir/.env" ]]; then
  echo "Expected project and .env at $project_dir" >&2
  exit 1
fi

for unit in "$unit_dir"/*.service "$unit_dir"/*.timer; do
  [[ -f "$unit" ]] || continue
  install -o root -g root -m 0644 "$unit" "/etc/systemd/system/$(basename "$unit")"
done

systemctl daemon-reload

units=(
  quanterra-web.service
  quanterra-dashboard.service
  quanterra-kalshi-btc-logger.service
  quanterra-exchange-price-poller.service
  quanterra-outcome-tracker.service
  quanterra-orderbook-watchdog.service
)

systemctl enable --now "${units[@]}"
systemctl enable --now quanterra-falcon-eval.timer
systemctl --no-pager --plain --legend=false list-units --state=active "${units[@]}"
systemctl --no-pager --plain --legend=false list-timers quanterra-falcon-eval.timer