# QuanterraOS — foundation

This is the starting skeleton for the "edge gate" product: a live,
cross-venue currency index that computes a cost-adjusted breakeven
probability for short-duration (15min/1hr/1day) contracts, and
publicly scores itself against real outcomes over time.

## What's real vs. what's a stub

**Real, tested logic:**
- `src/index-engine.ts` — composite index from multi-venue ticks, with
  outlier rejection (a venue too far from the cross-venue median is
  dropped rather than skewing the composite).
- `src/edge-score.ts` — the fair-value-vs-breakeven calculation.
- `src/scoring.ts` — carried over unchanged from the 2026-09-20 merge
  patch: Brier score, calibration curve, streak.
- All three have `__tests__` files. The math in `index-engine.ts` and
  `edge-score.ts` was hand-verified against a plain-JS reimplementation
  in this sandbox (no network access here to `npm install`, so the
  TypeScript test suite itself needs `npm install && npm test` run
  wherever you have registry access — see below).

**Now wired up (as of the latest pass):**
- `src/db.ts` — a real local SQLite database (via `better-sqlite3`),
  auto-running the migration on startup. One file on your computer,
  no server to pay for or manage.
- `src/auth.ts` — a **temporary, single-owner auth stub**. There's no
  real user system yet because there's only one user (you) — this
  hardcodes your owner id rather than pretending to have login it
  doesn't have. Read the comment at the top of that file before you
  have real users.
- `src/server.ts` — an actual Express server wiring `db.ts` + `auth.ts`
  into the `/api/workspace/resolve` and `/api/workspace/edge-score`
  routes from `workspace.ts`. It also exposes
  `/api/workspace/calibration`, which returns the performance summary,
  calibration bins, and observation streak. Run it with `npm run dev`.
- `src/plan.ts` — subscription gating through **Clerk Billing**
  (`@clerk/backend`, an external dependency and hosted service).
  `currentPlan(req)` calls `authenticateRequest(...).toAuth().has({ plan: "pro" })`
  on every request. With no Clerk keys set, every request is treated as the free plan.
  Needs `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` in `.env`. You can also set
  `CLERK_AUTHORIZED_PARTIES` (comma-separated origins). Plans themselves are created in
  the Clerk dashboard; this code never calls Stripe.
  `/calibration/market-price` stays public: free users get a once-daily cached result, and Pro adds
  live recomputation and the full per-bin table.

**Still a stub:**
- `src/schema.ts` — `founderAudit`, `founderControls`, and
  `researchObservations` are *reconstructed* from column names in the
  merge patch's SQL comments, not copied from a real `schema.ts` you
  had before this project existed. Low-risk since this project now
  owns its own schema, but worth knowing the provenance.
- Data ingestion from a licensed aggregator (CoinAPI/Kaiko/CMC) —
  not written yet. `exchangeTicks` in the schema is where it lands.

**Honesty note:** this sandbox has no network access, so I could not
run `npm install` or actually start this server end-to-end here. The
logic was hand-verified piece by piece, but "type-checks and reads
correctly" is not the same as "ran successfully" — treat the first
real `npm install && npm run dev` on your machine as the actual test.

**A real bug that got caught and fixed:** every internal import in
this project originally used the "compiled" convention (`from
"./db.js"` pointing at a file that's actually `db.ts`) — the standard
way to write TypeScript imports when a build step compiles `.ts` to
`.js` first. This project has no build step; `npm run dev`/`ingest`/
`test` all run the raw `.ts` files directly via Node's
`--experimental-strip-types`, which does **not** resolve a `.js`
import specifier to a same-named `.ts` file (a real, documented Node
limitation, not a mistake in the setup). Every import in this repo
now says `.ts` explicitly instead, and `tsconfig.json` has
`allowImportingTsExtensions: true` to match. If you ever add a real
build step later, you'd flip these back to `.js`.

## Known modeling caveat — read before trusting `edge-score.ts`

`estimateFairProbability` uses a simple momentum-drift-over-volatility
heuristic. Tested against clean synthetic data (a perfectly steady
trend with no noise), it saturates to 0 or 1 almost immediately —
because with near-zero variance, the standardized drift `z` explodes.
Real market data has enough noise that this shouldn't happen in
practice, but **do not treat this model's output as validated until
it's been backtested against real composite-index history and scored
against real `research_resolutions` outcomes.** The calibration curve
from `scoring.ts` is the actual source of truth on whether this model
has any edge at all — not the code itself. Budget real time for this
before it drives real recommendations.

`estimateFee` approximates Kalshi's fee formula (peaks near 50/50
odds). Verify against Kalshi's current published fee schedule — fee
schedules change, and getting this wrong means the "breakeven"
number shown to users is wrong.

## Running this

```bash
npm install         # needs registry access — none in this sandbox
npm test            # node's built-in test runner, once deps are in
npx tsc --noEmit    # type-check
npm run dev         # starts the real server on http://localhost:3000
```

## Testing the server (once `npm run dev` is running)

Open a **second** terminal (leave the server running in the first)
and paste these one at a time. `curl` is a tool for sending a web
request from the terminal instead of a browser — it comes pre-installed
on Mac and Linux; on Windows, use these in PowerShell or install
`curl` via `winget install curl`.

```bash
# 1. Confirm the server is alive
curl http://localhost:3000/health
# expect: {"ok":true}

# 2. Record a resolution for a made-up contract
curl -X POST http://localhost:3000/api/workspace/resolve \
  -H "Content-Type: application/json" \
  -d '{"contract":"KXBTCUP-TEST","outcome":"YES","officialSource":"manual-test"}'
# expect: a JSON object echoing back what you sent, with owner: "alex"

# 3. Try recording it again WITHOUT isCorrection — should be rejected
curl -X POST http://localhost:3000/api/workspace/resolve \
  -H "Content-Type: application/json" \
  -d '{"contract":"KXBTCUP-TEST","outcome":"NO","officialSource":"manual-test"}'
# expect: {"error":"already_resolved", ...} — this is the
# recordResolution-vs-correctResolution rule from the merge patch working

# 4. Compute an edge score for a made-up contract
curl -X POST http://localhost:3000/api/workspace/edge-score \
  -H "Content-Type: application/json" \
  -d '{"contract":"KXBTCUP-TEST","bucket":"15min","marketAsk":0.5,"recentCompositePrices":[100,101,102,103,104,105,106]}'
# expect: a JSON object with fairProbability, breakevenProbability, edge, flagged

# 5. Correct the resolution explicitly; this appends history and links the
#    new row to the previous resolved_at value via correctionOf.
curl -X POST http://localhost:3000/api/workspace/resolve \
  -H "Content-Type: application/json" \
  -d '{"contract":"KXBTCUP-TEST","outcome":"NO","officialSource":"manual-correction","isCorrection":true,"correctionReason":"Official source corrected the result"}'

# 6. Read Brier summary, calibration bins, and streak data
curl http://localhost:3000/api/workspace/calibration
```

If step 1 fails, the server didn't start — check the first terminal
for an error. If steps 2-4 fail, copy the exact error text back into
this conversation and we'll debug it together.

## Foundation checklist (business side, do in parallel)

- [ ] Confirm entity structure (LLC vs. Delaware C-corp) with a
      startup attorney if outside investment is part of the plan
- [ ] Sign a commercial data-license agreement before ingesting any
      exchange data at scale (raw exchange APIs are free but licensed
      for personal/internal use only — see prior conversation)
- [ ] Decide explicitly: data/analytics company, or advisory company —
      this changes what registration you may need before scaling past
      a personal tool
- [ ] Draft the one public claim you're comfortable defending with the
      calibration page's real numbers, not marketing copy

## Suggested build order from here

1. ~~Wire `src/routes/workspace.ts` into your real server + DB~~ — done (`src/server.ts`, `src/db.ts`, `src/auth.ts`)
2. Get one real feed flowing into `exchange_ticks` — run `npm run ingest`.
   This pulls live BTC price from Coinbase + Kraken's free public
   endpoints (fine for local testing; the licensed-aggregator
   requirement from the README's licensing section kicks in once real
   customers see this data, not before)
3. Run `computeCompositeIndex` on a schedule instead of once by hand —
   turn `npm run ingest` into something that repeats (a `setInterval`
   loop, or a cron job) once step 2 works
4. Build the public calibration/track-record page from `scoring.ts`
   output — this is the trust asset, prioritize it early
5. Only then wire `edge-score.ts` into a live recommendation surface
6. Before real customers see any of this: replace the public-endpoint
   ingest with a real commercially-licensed aggregator (CoinAPI/Kaiko/
   CoinMarketCap)
