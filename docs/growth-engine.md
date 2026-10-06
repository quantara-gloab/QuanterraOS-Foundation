# QuanterraOS Growth Engine

Five AI agents that drive sign-ups to quanterraos.com — with every message, call and consent written to a tamper-evident ledger.

| Agent | Job | Hard guardrail |
|---|---|---|
| **Scout** | Imports and screens B2B prospects (`import-prospects`) | Drops invalid, suppressed and duplicate records |
| **Herald** | Writes and sends outreach email + up to 2 follow-ups | Country allow-list, company domains only, one-click unsubscribe, daily cap, stops on reply |
| **Concierge** | AI chat on `/growth` | Speaks only from the product brief; never collects personal data in chat |
| **Callback** | AI voice agent via Twilio | **Opt-in only.** Discloses it's an AI, local hours only, "stop calling" revokes instantly |
| **Sentinel** | Supervisor tick every 15 min | Verifies the consent ledger; halts all outbound if config is incomplete or the ledger is altered |

Zero npm dependencies: Node ≥ 22.18 built-ins only (`node:sqlite`, `fetch`, `crypto`, native TypeScript).

## Drop into quanterraos-foundation

1. Copy `src/growth/` → `src/growth/`, `public/growth.html` → wherever your static files live, and `scripts/` + `test/` alongside.
2. Add the variables from `.env.example` to the server's environment (systemd `EnvironmentFile=` for `quanterra-web.service`).
3. Mount it in `src/server.ts`:

```ts
import { startGrowthEngine } from "./growth/index.ts";
const growth = startGrowthEngine({ pagePath: "public/growth.html" });

// express
app.use(growth.handler);
```

4. Caddy already routes quanterraos.com → :3102, so `/growth` and `/api/growth/*` work with no proxy change.
5. Run `npm test` (12 tests) and `npm run verify-ledger`.

## Going live — in this order

1. **Dry run first.** Leave `EMAIL_PROVIDER=console` and Twilio blank. Import a small list, watch the log, check `/api/growth/metrics`.
2. **Email.** Use a sending subdomain (e.g. `mail.quanterraos.com`) with SPF, DKIM and DMARC. Postmark and Resend are good for signup/welcome mail, but **both prohibit cold outreach in their terms** — for Herald's cold sends use a provider that permits B2B prospecting, or add an adapter in `email.ts` (`makeSender`). Warm the domain up: start `DAILY_EMAIL_CAP` at 20–30 and raise it gradually.
3. **Webhooks.** Point your provider's reply / bounce / complaint events at `POST /api/growth/email-events` with `Authorization: Bearer $GROWTH_ADMIN_TOKEN` and body `{ "type": "reply|bounce|complaint|unsubscribe", "email": "..." }` (or `{ "events": [...] }`).
4. **Voice.** Buy a Twilio number, register it (A2P/STIR-SHAKEN as Twilio requires), set the three `TWILIO_*` vars. Twilio calls back to `/api/growth/voice/*`; signatures are verified.

## Rules you can't configure away

- **No cold AI calls.** Under the TCPA (and the FCC's 2024 ruling that AI-generated voices count as "artificial"), AI calls need prior express consent; penalties are $500–$1,500 *per call*. Callback only dials numbers with a `grant` in the ledger.
- **Cold email defaults to US only** (CAN-SPAM permits B2B outreach with opt-out). The EU/UK (GDPR/PECR), Canada (CASL) and many others require consent or a documented legitimate-interest assessment. Add a country to `COLD_EMAIL_COUNTRIES` only after you have that.
- **Only import contacts you have the right to use.** Don't scrape, and don't buy consumer data (credit, net worth, etc.) — using it to target consumers triggers FCRA.
- **Calls create transcripts.** California requires all-party consent to record; the agent discloses the transcript at the start of every call. Keep that line.

Not legal advice — have counsel review the disclosures in `src/growth/signup.ts` before launch.

## API

| Route | Who | Purpose |
|---|---|---|
| `GET /growth` | public | Product page with signup form and Concierge |
| `GET /api/growth/disclosures` | public | Consent wording (single source of truth) |
| `POST /api/growth/signup` | public | Create account, record consent, schedule callback |
| `POST /api/growth/chat` | public | Concierge (rate-limited) |
| `GET/POST /api/growth/unsubscribe?t=` | public | Confirm page / one-click unsubscribe (RFC 8058) |
| `POST /api/growth/email-events` | bearer | Reply / bounce / complaint webhook |
| `POST /api/growth/voice/{answer,turn,status}` | Twilio | Voice webhooks (signature-checked) |
| `GET /api/growth/metrics` | bearer | Funnel, send/block counts, ledger status |

## Scripts

```bash
npm run dev                                  # local preview at :3102/growth
npm run growth:import -- list.csv "crm-oct"  # columns: email,country[,name,company,title,phone,timezone,source]
npm run growth:supervisor                    # one tick (for cron), if not running in-process
npm run growth:verify                        # verify consent ledger chain
npm run test:growth                          # run the 12 growth engine tests
```
