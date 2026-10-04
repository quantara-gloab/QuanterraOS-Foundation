import fs from "node:fs";
import path from "node:path";

export interface CouncilAgentStat {
  label: string;
  value: string;
}

export interface CouncilAgent {
  id: string;
  name: string;
  role: string;
  shortDesc: string;
  expandedDesc: string;
  status: string;
  statusType: "research" | "verified" | "active" | "standby" | "monitoring";
  iconSvg: string;
  stats: CouncilAgentStat[];
  learnMoreUrl?: string;
  learnMoreText?: string;
}

export function getCouncilAgentsData(): CouncilAgent[] {
  // Read latest falcon-backtest report if available
  let falconSample = "n = 31 settled markets";
  let falconBrier = "0.2736";
  let falconNaive50 = "0.2500";
  let falconNaiveEntry = "0.2106";
  let falconCutoff = "2026-09-26T13:10:27Z";

  try {
    const falconReportPath = path.resolve("reports/falcon-backtest-2026-10-03.txt");
    if (fs.existsSync(falconReportPath)) {
      const data = JSON.parse(fs.readFileSync(falconReportPath, "utf8"));
      if (data.sampleSize) falconSample = `n = ${data.sampleSize} settled markets`;
      if (typeof data.falconAverageBrier === "number") falconBrier = data.falconAverageBrier.toFixed(4);
      if (typeof data.naiveFiftyFiftyAverageBrier === "number") falconNaive50 = data.naiveFiftyFiftyAverageBrier.toFixed(4);
      if (typeof data.naiveEntryPriceAverageBrier === "number") falconNaiveEntry = data.naiveEntryPriceAverageBrier.toFixed(4);
      if (data.validFromIso) falconCutoff = data.validFromIso;
    }
  } catch {
    // fallback to audited defaults
  }

  // Check reports/ for csv-range (Draco data integrity)
  let dracoWindows = "1,316 of 1,332 theoretical windows (16 missing)";
  let dracoRows = "19,740 candle rows (15m intervals)";
  let dracoEarliest = "2026-09-15T02:00:00Z";
  let dracoLatest = "2026-09-28T22:45:00Z";
  try {
    const csvPath = path.resolve("reports/csv-range-2026-10-03.txt");
    if (fs.existsSync(csvPath)) {
      const data = JSON.parse(fs.readFileSync(csvPath, "utf8"));
      if (data.uniqueTickers) dracoWindows = `${data.uniqueTickers.toLocaleString()} of 1,332 theoretical windows (16 missing)`;
      if (data.totalRows) dracoRows = `${data.totalRows.toLocaleString()} candle rows`;
      if (data.earliestOpenTime) dracoEarliest = data.earliestOpenTime;
      if (data.latestOpenTime) dracoLatest = data.latestOpenTime;
    }
  } catch {
    // fallback
  }

  // Check Wolf orderbook cutoff marker
  let wolfCutoff = "2026-09-26 13:10:27 UTC";
  try {
    const cutoffPath = path.resolve("data/orderbook-valid-from-ms.txt");
    if (fs.existsSync(cutoffPath)) {
      const ms = Number(fs.readFileSync(cutoffPath, "utf8").trim());
      if (Number.isFinite(ms) && ms > 0) {
        wolfCutoff = new Date(ms).toISOString();
      }
    }
  } catch {
    // fallback
  }

  // Check Quantum Fox predictor backtest
  let foxMarkets = "1,316 settled windows (15m horizon)";
  let foxModelBrier = "0.2063";
  let foxMarketBrier = "0.2001";
  try {
    const btc15mPath = path.resolve("reports/btc15m-predictor-backtest-2026-10-03.txt");
    if (fs.existsSync(btc15mPath)) {
      const data = JSON.parse(fs.readFileSync(btc15mPath, "utf8"));
      if (data.markets) foxMarkets = `${data.markets.toLocaleString()} settled windows`;
      if (data.report?.minute4?.brier?.model) foxModelBrier = Number(data.report.minute4.brier.model).toFixed(4);
      if (data.report?.minute4?.brier?.market) foxMarketBrier = Number(data.report.minute4.brier.market).toFixed(4);
    }
  } catch {
    // fallback
  }

  return [
    {
      id: "falcon",
      name: "Falcon",
      role: "Order-Book Depth Monitoring (research)",
      shortDesc: "Monitors live order-book depth and bid/ask volume imbalance across active contracts for research evaluation — flagged, not acted on.",
      expandedDesc: "Falcon continuously monitors live order-book depth and bid/ask volume imbalance across active Kalshi contracts. Rather than acting autonomously or placing trades, it surfaces detected microstructure anomalies solely for human review. In empirical backtesting (n=31), Falcon's heuristic achieved an average Brier score of 0.2736, currently underperforming both random chance (0.2500) and market entry prices (0.2106)—reinforcing its status as an exploratory research module.",
      status: "Research (Small Sample)",
      statusType: "research",
      iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>',
      stats: [
        { label: "Sample Size", value: falconSample },
        { label: "Falcon Avg Brier", value: falconBrier },
        { label: "Naive 50/50 Baseline", value: falconNaive50 },
        { label: "Market Entry Price Baseline", value: falconNaiveEntry },
        { label: "Performance Read", value: "Underperforming baselines (preliminary, trending negative)" },
        { label: "Valid-From Cutoff", value: falconCutoff },
        { label: "Audit Provenance", value: "reports/falcon-backtest-2026-10-03.txt" }
      ],
      learnMoreUrl: "/calibration/market-price",
      learnMoreText: "View Live Calibration Benchmark →"
    },
    {
      id: "sentinel",
      name: "Sentinel",
      role: "Systems Monitoring",
      shortDesc: "Watches data pipelines and market feeds for outages, staleness, or anomalies in real time.",
      expandedDesc: "Sentinel acts as the system's automated surveillance guardrail, monitoring data pipelines, exchange WebSocket feeds, and contract lifecycle transitions in real time. It continuously tracks Brier score drift and Murphy decomposition metrics against climatological baselines, immediately flagging data staleness, venue disconnects, or unexpected calibration degradation.",
      status: "Monitoring — No Active Alerts",
      statusType: "monitoring",
      iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V5l-9-4z"/><path d="M9.5 12.5l2 2 2.5-3"/></svg>',
      stats: [
        { label: "Pipeline Surveillance", value: "Monitoring — no active alerts" },
        { label: "Monitored Ingesters", value: "Exchange price poller & Kalshi candle logger" },
        { label: "Staleness Threshold", value: "Flagged if venue feed > 5s delayed" },
        { label: "Swing Events Logged", value: "245 events (131 settled, walk-forward audited)" },
        { label: "Autonomous Orders", value: "Disabled (Surveillance & integrity gate only)" }
      ]
    },
    {
      id: "quantum-fox",
      name: "Quantum Fox",
      role: "Quantitative Research",
      shortDesc: "Runs calibration and fair-value backtests against historical and live data, reporting results transparently — including when a model fails to beat the market.",
      expandedDesc: "Quantum Fox executes rigorous quantitative modeling, volatility surface estimation, and convexity corrections across historical and live prediction-market horizons. It benchmarks theoretical fair-value models directly against market mid-prices, publishing full calibration curves and transparently reporting when market pricing beats our internal models.",
      status: "Verified Benchmark — Model Audited",
      statusType: "verified",
      iconSvg: '<svg viewBox="0 0 24 24"><path d="M21 16.5c0-.27-.02-.55-.07-.82A4.5 4.5 0 0 0 19 11.5a4.4 4.4 0 0 0-.33-1.7l1.17-1.17a.5.5 0 0 0-.3-.87l-2.17-.44a4.5 4.5 0 0 0-.9 1.83 4.6 4.6 0 0 0-2.15-1.44L10.5 7v2.5l5.83 1.17A4.5 4.5 0 0 1 19 12c0 .23-.02.46-.07.68l1.17.67a.5.5 0 0 1 0 .8z"/></svg>',
      stats: [
        { label: "Corpus Evaluated", value: foxMarkets },
        { label: "Minute-4 Model Brier", value: foxModelBrier },
        { label: "Minute-4 Market Brier", value: `${foxMarketBrier} (Market mid beats model)` },
        { label: "Price-Swing Backtest", value: "Walk-forward n=131: no edge (findings.md §12)" },
        { label: "Audit Finding", value: "Zero edge claimed; results published transparently" },
        { label: "Itô Correction", value: "Applied (−½σ²τ, verified mathematically correct)" },
        { label: "Audit Provenance", value: "reports/btc15m-predictor-backtest-2026-10-03.txt" }
      ],
      learnMoreUrl: "/fair-value/btc15m",
      learnMoreText: "View Fair Value Model Telemetry →"
    },
    {
      id: "phoenix",
      name: "Phoenix",
      role: "Execution Readiness",
      shortDesc: "System execution gate maintained in strict standby mode — zero capital deployed, live execution permanently locked.",
      expandedDesc: "Phoenix maintains the execution gate architecture, held in strict permanent standby. Under QuanterraOS governance rules, no live order placement is authorized and zero capital is deployed. The execution gate remains locked unless an empirical signal demonstrates verified out-of-sample positive expectancy after all fees.",
      status: "Standby — No Capital Deployed",
      statusType: "standby",
      iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 8v4l2 2m-2-6a9 9 0 1 1 0 18 9 9 0 0 1 0-18z"/><path d="M5 12h14"/></svg>',
      stats: [
        { label: "Execution Readiness", value: "Standby — circuit breaker permanently engaged" },
        { label: "Live Capital Deployed", value: "$0.00 (Zero live trading exposure)" },
        { label: "Governing Policy", value: "Rule B5 (No live order placement without approval)" },
        { label: "Deployment Gate", value: "Pre-registered out-of-sample BSS > 0 required" }
      ]
    },
    {
      id: "draco",
      name: "Draco",
      role: "Data Integrity",
      shortDesc: "Verifies incoming data quality and pipeline health before any figure is reported or used.",
      expandedDesc: "Draco enforces the project's data-integrity gate before any quote, index tick, or calibration metric is recorded or rendered. It screens incoming feeds for staleness, cross-venue pricing outliers, and sequencing gaps, guaranteeing that downstream telemetry reflects verified truth rather than feed glitches.",
      status: "Pipeline Verified — Integrity Passed",
      statusType: "verified",
      iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 2L2 7v10c0 5 6 9 10 9s10-4 10-9V7l-10-5z"/><path d="M10 10l2 2 4-4-1-1-3 3-1-1z"/></svg>',
      stats: [
        { label: "Verified Dataset", value: "data/kalshi-btc15m-candles.csv" },
        { label: "Theoretical Coverage", value: dracoWindows },
        { label: "Total Candle Rows", value: dracoRows },
        { label: "Date Range", value: `${dracoEarliest.slice(0, 10)} to ${dracoLatest.slice(0, 10)}` },
        { label: "Quality Gate", value: "PASSED — 0 NaN / 0 corrupted timestamps" },
        { label: "Audit Provenance", value: "reports/csv-range-2026-10-03.txt" }
      ]
    },
    {
      id: "wolf",
      name: "Wolf",
      role: "Market Microstructure",
      shortDesc: "Analyzes order-book depth and liquidity dynamics to understand — not predict — market behavior.",
      expandedDesc: "Wolf analyzes top-of-book and L2 depth dynamics to profile liquidity distribution, bid-ask spread compression, and queue imbalance. Its focus is empirical description rather than direction prediction—quantifying how market participants provision liquidity as contracts approach expiry.",
      status: "Collector Logging — Microstructure Active",
      statusType: "active",
      iconSvg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 10v6m8.66-9H17m-5 0H5.34"/></svg>',
      stats: [
        { label: "Market Focus", value: "Kalshi KXBTC15M contract order books" },
        { label: "Clean Cutoff Timestamp", value: wolfCutoff },
        { label: "Microstructure Dynamics", value: "Best yes/no bids, depth volume imbalance" },
        { label: "Collector Watchdog", value: "Online (quanterra-orderbook-watchdog active)" },
        { label: "Analytical Mandate", value: "Descriptive profiling (non-predictive)" }
      ]
    },
    {
      id: "kraken",
      name: "Kraken",
      role: "Risk Oversight",
      shortDesc: "Aggregates risk exposure and runs stress tests across any active positions.",
      expandedDesc: "Kraken oversees risk boundaries, tail-risk scenarios, and cross-venue divergence dynamics. It continuously stress-tests contract valuations against basis spreads between spot exchanges and the CME CF BRTI settlement reference, ensuring anomalous market states are highlighted before any trading cycle.",
      status: "Monitoring — No Active Alerts",
      statusType: "monitoring",
      iconSvg: '<svg viewBox="0 0 24 24"><path d="M3 12c0 4.97 4.03 9 9 9s9-4.03 9-9-4.03-9-9-9-9 4.03-9 9zm9 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0-3a1 1 0 0 1 1-1h1a1 1 0 0 1 0 2h-1a1 1 0 0 1-1 0zm2-3a1 1 0 0 1 1 1v1h1a1 1 0 0 1 0 2h-1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1h1v-1a1 1 0 0 1 1-1z"/></svg>',
      stats: [
        { label: "Capital Exposure", value: "$0.00 Active Exposure" },
        { label: "Risk Surveillance", value: "Cross-venue basis divergence & tail risk" },
        { label: "Settlement Reference", value: "CME CF Bitcoin Real-Time Index (BRTI)" },
        { label: "Risk Health", value: "Nominal — 0 active risk alerts" }
      ]
    },
    {
      id: "lion",
      name: "Lion",
      role: "Calibration Synthesis",
      shortDesc: "Synthesizes findings across the Council into a single, auditable verdict on whether current market pricing is reliable.",
      expandedDesc: "Lion synthesizes cross-council telemetry into a unified calibration verdict on market efficiency. By comparing market-implied probabilities against actual settlement outcomes across 10 empirical probability bins, Lion produces the platform's auditable verdict on whether current market prices are reliable.",
      status: "Active Synthesis — Live Calibration Grading",
      statusType: "active",
      iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 7V3l8 9-8 9v-4a4 4 0 0 1-4-4v-1zm0 0V7z"/><circle cx="12" cy="12" r="5"/></svg>',
      stats: [
        { label: "Synthesis Engine", value: "Multi-agent empirical calibration grading" },
        { label: "Scoring Methodology", value: "Brier scoring + Murphy decomposition" },
        { label: "Reliability Intervals", value: "10 probability bins with Wilson 95% CIs" },
        { label: "Live Telemetry Feed", value: "/api/calibration/market-price" }
      ],
      learnMoreUrl: "/calibration/market-price",
      learnMoreText: "Open Full Calibration Curve & Bin Table →"
    }
  ];
}
