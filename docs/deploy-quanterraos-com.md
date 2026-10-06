# Production Deployment Guide: QuanterraOS.com (and only QuanterraOS.com)

**Target Scope:** Deploy the working QuanterraOS Foundation app from `localhost:3000` onto `https://quanterraos.com` with real HTTPS.

> [!IMPORTANT]
> **Parked Domains Stance:** Do not configure DNS, redirect, or deploy to `QuanterraOS.ai`, `Quanterratrust.com`, `Quanterra.Systems`, `Quanterragrowth.com`, `Quanterragrowthos.com`, or `QuanterraAgentOS.com`. These six domains remain parked and untouched until `quanterraos.com` accumulates real users and verified commercial signal.

---

## 1. Hosting Architecture & Requirements

- **Runtime:** Node.js 22 LTS with native TypeScript execution (`--experimental-strip-types`).
- **Database:** SQLite with Write-Ahead Logging (`WAL` mode). Requires a **persistent block volume** mounted to `/data` so SQLite files (`quanterraos.db` and `growth.db`) survive machine restarts and redeployments.
- **Port:** Standard container port `3000`.
- **Health Check:** `GET /health` returns HTTP 200 with `{ "status": "ok", "circuit": "LOCKED_RULE_B5" }`.

---

## 2. Option A: Fly.io Deployment (Recommended)

Fly.io natively supports single-region persistent volumes with automatic SSL certificate issuance.

### Step 1: Install Flyctl & Login
```bash
# Windows PowerShell
iwr https://fly.io/install.ps1 -useb | iex

# Login to your Fly.io account
fly auth login
```

### Step 2: Initialize Application
From the repository root (`c:\Users\enseg\OneDrive\Desktop\quanterraos-foundation\quanterraos-foundation`):
```bash
# If app is not yet launched on Fly:
fly launch --no-deploy --copy-config
```
*(The repository already includes [fly.toml](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/fly.toml) configured for `quanterraos`).*

### Step 3: Create Persistent Storage Volume
Create the 1GB persistent volume in the primary region (e.g. `iad` for US East):
```bash
fly volumes create quanterra_data --region iad --size 1
```

### Step 4: Configure Production Secrets
Set production environment variables. Never commit these secrets into git:
```bash
fly secrets set \
  NODE_ENV=production \
  PUBLIC_BASE_URL="https://quanterraos.com" \
  DB_PATH="/data/quanterraos.db" \
  GROWTH_DB_PATH="/data/growth.db" \
  ADMIN_METRICS_KEY="generate_a_secure_random_hex_key" \
  GROWTH_HMAC_SECRET="generate_at_least_32_characters_random_hex" \
  COMPANY_POSTAL_ADDRESS="Quantara Global LLC, Your Physical Address" \
  SENDER_EMAIL="team@quanterraos.com"
```
*(Note: If Stripe business EIN is pending, omit live Stripe keys. The codebase is hard-coded to reject sandbox checkout in production to prevent uncharged access).*

### Step 5: Deploy the App
```bash
fly deploy
```

### Step 6: Verify App Boot on Platform URL
Before touching Porkbun DNS, confirm the Fly-generated URL returns 200:
```bash
curl -i https://quanterraos.fly.dev/health
```

---

## 3. Option B: Railway Deployment (Alternative)

If using Railway:
1. Connect this GitHub repository in Railway dashboard.
2. Under **Service Settings → Storage**, add a **Persistent Volume** mounted at `/data`.
3. Under **Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `DB_PATH`: `/data/quanterraos.db`
   - `GROWTH_DB_PATH`: `/data/growth.db`
   - `PUBLIC_BASE_URL`: `https://quanterraos.com`
   - `ADMIN_METRICS_KEY`: *(Secure 32+ character random string)*
   - `GROWTH_HMAC_SECRET`: *(Secure 32+ character random string)*
4. Under **Settings → Networking → Custom Domains**, input `quanterraos.com`.

---

## 4. Porkbun DNS Configuration (Your Action)

Once your hosting provider gives you the working deployment URL and custom domain DNS targets:

1. **Log in to Porkbun:** Open [Porkbun Domain Management](https://porkbun.com/) → **quanterraos.com** → **DNS Records**.
2. **Canonical Decision:** Decide on `https://quanterraos.com` (bare root) vs `https://www.quanterraos.com` (www). We recommend **bare root canonical** (`quanterraos.com`):
   - **Root Domain:**
     - Type: `ALIAS` or `ANAME` (or `A` records provided by Fly.io / Railway).
     - Host / Name: `@` (blank/root).
     - Answer / Value: Target hostname provided by host (e.g. `quanterraos.fly.dev` or Railway CNAME).
     - TTL: `600`
   - **WWW Subdomain:**
     - Type: `CNAME`
     - Host / Name: `www`
     - Answer / Value: `quanterraos.com` (or the host domain).
     - TTL: `600`
3. **SSL Certificate Provisioning:**
   - Both Fly.io and Railway automatically detect DNS resolution and provision a free Let's Encrypt SSL certificate.
   - Initial DNS propagation typically takes 5–30 minutes.

---

## 5. Production Smoke Test Verification

Once DNS resolves and HTTPS is live, run the built-in automated smoke test:

```bash
# Run against the live domain:
node --experimental-strip-types scripts/smoke-test-prod.ts https://quanterraos.com
```

### What the Smoke Test Verifies:
| Gate | Target | Expected Outcome |
| :--- | :--- | :--- |
| **Platform Health** | `GET /health` | HTTP 200, `{ status: "ok", circuit: "LOCKED_RULE_B5", database: "connected" }` |
| **Public Surface Pages** | `/`, `/predictions`, `/autopilot`, `/calibration`, `/pricing`, `/research`, `/trustos`, `/wallet` | HTTP 200, valid HTML response body |
| **CFTC 4.41 Compliance** | `/pricing`, `/predictions`, `/autopilot` | Contains statutory hypothetical trading disclaimers |
| **Rule B5 Protection** | `/autopilot`, `/predictions` | Strictly displays `$0.00` live capital and `PAPER` trading mode |
| **Test Route Lockout** | `POST /api/billing/simulate-webhook` | **HTTP 404 Not Found** (confirms simulation bypass is dead in production) |
| **Checkout Integrity** | `POST /api/billing/checkout` | Rejects sandbox checkout when `NODE_ENV=production` |
