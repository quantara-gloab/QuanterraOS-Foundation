# Production Launch: AWS Lightsail

## Scope

Deploy the existing QuanterraOS foundation app to AWS Lightsail. This is infrastructure and release work, not new feature work. Falcon remains experimental and must not be marketed as a proven signal.

## Current deployment files

- `.nvmrc` pins Node.js 22.23.3; `package.json` restricts Node to major version 22.
- `deploy/systemd/` contains units for the web app, private spread dashboard, BRTI logger, spot poller, outcome tracker, and order-book watchdog. The watchdog is the only process that starts the order-book collector, avoiding duplicate collectors.
- `scripts/install-lightsail-services.sh` installs and enables those six units once the app and `.env` are in `/opt/quanterraos/app`.
- `Caddyfile` serves `quanterraos.com` and `www.quanterraos.com` over automatic HTTPS and proxies to the web app on `127.0.0.1:3102`. The spread dashboard remains bound to loopback on port 3000 and is not exposed publicly.
- `npm run db:init` applies schema migrations once before starting the services.

## Security status

Drizzle ORM was upgraded to 0.45.3 to resolve the SQL-injection advisory affecting versions below 0.45.2. After the upgrade, all 65 tests passed and `npm audit --omit=dev` reported zero production vulnerabilities. Re-run both checks on the Lightsail release candidate before DNS cutover.

## Launch sequence

1. **Create Lightsail host.** Done. `quanterraos-prod-1` runs Ubuntu 24.04 on the `small_3_0` bundle (2 vCPU, 2 GB RAM, 60 GB SSD, $12/month) in `us-east-1a`, with static IP `100.57.177.136` attached as `quanterraos-prod-ip`. The firewall allows HTTP 80 and HTTPS 443 publicly, and port 22 only from the pinned workstation IPv4 plus the `lightsail-connect` alias for console browser SSH; IPv6 SSH is closed and ports 3000 and 3102 are not exposed. Resize the bundle if 2 GB proves tight once all seven processes run under real load.
2. **Install runtime and dependencies.** Host runtime is done: Node v22.23.3 at `/usr/bin/node` (the path the systemd units expect), npm 10.9.9, gcc 13, python3 3.12.3, and Caddy v2.11.4 enabled and active. Verified on the host that the npm registry is reachable and that `better-sqlite3@^11.3.0` installs and executes a real query under Node 22 on x86_64. Installing the project's own dependencies happens with the source deployment in step 3.
3. **Prepare app data and secrets.** Deploy the source and install packages. Copy the current `data/kalshi-btc15m-candles.csv`, `data/orderbook-valid-from-ms.txt`, and SQLite database only if their history is intended for production. Configure `.env` directly on the host with production-only credentials and writable database paths; never commit or paste secrets into chat. Transfer the Kalshi PEM securely to a Linux path, set `KALSHI_PRIVATE_KEY_PATH` to that path, and restrict its permissions to the app user. Ensure the app user owns the database, WAL files, data directory, and `logs/`.
4. **Initialize and start.** Run `npm run db:init`, then install the units with `sudo bash scripts/install-lightsail-services.sh`. Verify the six services with `systemctl status`, inspect `journalctl -u <service>`, and confirm fresh database timestamps for BRTI, Coinbase/Kraken, outcomes, and order-book snapshots. The watchdog owns the seventh runtime process, the order-book collector.
5. **Configure Caddy before DNS cutover.** Install `Caddyfile` at `/etc/caddy/Caddyfile`, validate it, and start/reload Caddy. It can obtain HTTPS certificates only after the public DNS records point to the Lightsail static IP.
6. **Production Clerk checkpoint.** Create/select a Clerk **Production** instance for the real domain. Development instances, keys, plans, and test subscriptions do not transfer. Enable Billing for user subscriptions, connect the production Stripe account, recreate and publish the user Plan with key exactly `pro`, and verify its display name and price. Put the production `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, and `CLERK_AUTHORIZED_PARTIES=https://quanterraos.com,https://www.quanterraos.com` in the host's `.env`; restart the app and test sign-in and free access before DNS cutover.
7. **DNS cutover (site-impacting).** `quanterraos.com` currently serves the enterprise-AI site. Changing its apex and `www` records to Lightsail will take that existing site offline unless it has first been moved or replaced. Confirm a backup/rollback plan and explicit approval, then update DNS to the static IP. Verify Caddy certificates and test the real domain from outside the host.
8. **Verify public app before payments.** Confirm anonymous `/calibration/market-price` returns the daily free-tier result, `/api/calibration/market-price` reports `plan=free`, and no internal service port is reachable publicly. Verify live collector timestamps and watchdog behavior after a reboot.
9. **Separate live-payment approval checkpoint.** Development Billing uses test-mode payments. Before switching the production Clerk/Stripe integration to live mode, inspect the production Plan, amount, billing interval, checkout branding, and cancellation/support policies. Switching to live mode permits real card charges; do not do it without explicit owner approval. After approval, make one controlled subscription test, confirm the Clerk plan check returns `plan=pro`, `realtime=true`, and the full per-bin counts, then confirm cancellation/downgrade returns the expected free access.

## Rollback

Keep the previous enterprise-AI DNS target and its deployment details. If the new site fails, restore the prior DNS records and allow TTL propagation. Preserve a dated backup of the production SQLite database and `.env` outside the web root before upgrades; do not overwrite production data with the laptop database after launch.

## Not in this launch

- Do not expose the internal spread dashboard publicly without a separate authentication decision.
- Do not enable Stripe live mode as part of routine deploy automation.
- Do not claim Falcon profitability or a tradable BTC signal; its order-book sample and validation remain separate research gates.