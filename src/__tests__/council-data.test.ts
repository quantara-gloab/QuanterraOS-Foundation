import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getCouncilAgentsData } from "../agents/council-data.ts";

describe("Council Specialists Calibration-First Data", () => {
  const agents = getCouncilAgentsData();

  test("contains exactly eight Council specialists", () => {
    assert.equal(agents.length, 8);
    const ids = agents.map((a) => a.id);
    assert.deepEqual(ids, [
      "falcon",
      "sentinel",
      "quantum-fox",
      "phoenix",
      "draco",
      "wolf",
      "kraken",
      "lion",
    ]);
  });

  test("matches exact updated card copy and roles from spec", () => {
    const map = new Map(agents.map((a) => [a.name, a]));

    const falcon = map.get("Falcon")!;
    assert.equal(falcon.role, "Order-Book Depth Monitoring (research)");
    assert.equal(
      falcon.shortDesc,
      "Monitors live order-book depth and bid/ask volume imbalance across active contracts for research evaluation — flagged, not acted on.",
    );

    const sentinel = map.get("Sentinel")!;
    assert.equal(sentinel.role, "Systems Monitoring");
    assert.equal(
      sentinel.shortDesc,
      "Watches data pipelines and market feeds for outages, staleness, or anomalies in real time.",
    );

    const quantumFox = map.get("Quantum Fox")!;
    assert.equal(quantumFox.role, "Quantitative Research");
    assert.equal(
      quantumFox.shortDesc,
      "Runs calibration and fair-value backtests against historical and live data, reporting results transparently — including when a model fails to beat the market.",
    );

    const phoenix = map.get("Phoenix")!;
    assert.equal(phoenix.role, "Execution Readiness");
    assert.equal(
      phoenix.shortDesc,
      "System execution gate maintained in strict standby mode — zero capital deployed, live execution permanently locked.",
    );

    const draco = map.get("Draco")!;
    assert.equal(draco.role, "Data Integrity");
    assert.equal(
      draco.shortDesc,
      "Verifies incoming data quality and pipeline health before any figure is reported or used.",
    );

    const wolf = map.get("Wolf")!;
    assert.equal(wolf.role, "Market Microstructure");
    assert.equal(
      wolf.shortDesc,
      "Analyzes order-book depth and liquidity dynamics to understand — not predict — market behavior.",
    );

    const kraken = map.get("Kraken")!;
    assert.equal(kraken.role, "Risk Oversight");
    assert.equal(
      kraken.shortDesc,
      "Aggregates risk exposure and runs stress tests across any active positions.",
    );

    const lion = map.get("Lion")!;
    assert.equal(lion.role, "Calibration Synthesis");
    assert.equal(
      lion.shortDesc,
      "Synthesizes findings across the Council into a single, auditable verdict on whether current market pricing is reliable.",
    );
  });

  test("wires empirical backing stats for Falcon, Draco, and Wolf", () => {
    const map = new Map(agents.map((a) => [a.id, a]));

    const falcon = map.get("falcon")!;
    assert.ok(falcon.stats.some((s) => s.label === "Sample Size" && s.value.includes("31")));
    assert.ok(falcon.stats.some((s) => s.label === "Falcon Avg Brier" && s.value.includes("0.2736")));
    assert.ok(falcon.stats.some((s) => s.label === "Naive 50/50 Baseline" && s.value.includes("0.2500")));
    assert.ok(falcon.stats.some((s) => s.label === "Market Entry Price Baseline" && s.value.includes("0.2106")));

    const draco = map.get("draco")!;
    assert.ok(draco.stats.some((s) => s.label === "Theoretical Coverage" && s.value.includes("1,316")));
    assert.ok(draco.stats.some((s) => s.label === "Total Candle Rows" && s.value.includes("19,740")));

    const wolf = map.get("wolf")!;
    assert.ok(wolf.stats.some((s) => s.label === "Clean Cutoff Timestamp" && s.value.includes("2026-09-26")));
  });

  test("presents honest monitoring/standby status for agents without live trade execution", () => {
    const map = new Map(agents.map((a) => [a.id, a]));

    const sentinel = map.get("sentinel")!;
    assert.match(sentinel.status, /monitoring/i);

    const phoenix = map.get("phoenix")!;
    assert.match(phoenix.status, /standby/i);

    const kraken = map.get("kraken")!;
    assert.match(kraken.status, /monitoring/i);
  });
});
