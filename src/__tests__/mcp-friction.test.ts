import { describe, it } from "node:test";
import assert from "node:assert";
import {
  simulateOrderFriction,
  executeMcpTool,
  MCP_SERVER_MANIFEST,
} from "../mcp-server.ts";

describe("MCP Pre-Trade Risk Coprocessor & Friction Simulator", () => {
  it("includes simulate_order_friction in MCP tool manifest", () => {
    const tool = MCP_SERVER_MANIFEST.tools.find((t) => t.name === "simulate_order_friction");
    assert.ok(tool, "simulate_order_friction should be registered in MCP manifest");
    const props = tool.parameters.properties as Record<string, any>;
    assert.strictEqual(props.price?.type, "number");
    assert.strictEqual(props.orderType?.type, "string");
  });

  it("calculates non-linear Kalshi taker fee drag and breakeven hurdle correctly", () => {
    // 100 contracts at 50¢ ($0.50)
    // Total notional = $50.00
    // Taker fee = ceil(0.07 * 100 * 0.5 * 0.5 * 100) / 100 = ceil(175) / 100 = $1.75
    // Maker fee = ceil(0.0175 * 100 * 0.5 * 0.5 * 100) / 100 = ceil(43.75) / 100 = $0.44
    const simTaker = simulateOrderFriction({
      price: 0.50,
      size: 100,
      assessedProbability: 0.55,
      orderType: "taker",
    });

    assert.strictEqual(simTaker.price, 0.50);
    assert.strictEqual(simTaker.size, 100);
    assert.strictEqual(simTaker.totalNotional, 50.00);
    assert.strictEqual(simTaker.takerFeeDollars, 1.75);
    assert.strictEqual(simTaker.makerFeeDollars, 0.44);
    assert.strictEqual(simTaker.effectiveFeeDollars, 1.75);
    assert.strictEqual(simTaker.feeSavingsIfMaker, 1.31); // $1.75 - $0.44
    assert.strictEqual(simTaker.feePercentOfCost, 3.5); // $1.75 / $50.00 * 100%
    assert.strictEqual(simTaker.breakevenWinRate, 0.5175); // 50¢ + 1.75¢
    assert.strictEqual(simTaker.feeDragBps, 350);

    // Expected gross profit with assessed prob 0.55 = 100 * (0.55 - 0.50) = $5.00
    assert.strictEqual(simTaker.expectedGrossProfit, 5.00);
    // Net profit = $5.00 - $1.75 = $3.25
    assert.strictEqual(simTaker.expectedNetProfit, 3.25);
    assert.strictEqual(simTaker.isPositiveEv, true);
    assert.strictEqual(simTaker.netEvRoiPercent, 6.5); // $3.25 / $50 * 100%
  });

  it("detects when fee drag destroys marginal gross alpha", () => {
    // Trader thinks probability is 51% (gross edge +1%), price is 50¢, taker fee is 1.75¢
    // Breakeven is 51.75%, so net EV is negative
    const simEatenByFees = simulateOrderFriction({
      price: 0.50,
      size: 100,
      assessedProbability: 0.51,
      orderType: "taker",
    });

    assert.strictEqual(simEatenByFees.expectedGrossProfit, 1.00);
    assert.strictEqual(simEatenByFees.effectiveFeeDollars, 1.75);
    assert.strictEqual(simEatenByFees.expectedNetProfit, -0.75);
    assert.strictEqual(simEatenByFees.isPositiveEv, false);
    assert.ok(simEatenByFees.verdict.includes("NEGATIVE EV (FEE DRAG)"));
  });

  it("proves Maker resting order restores positive EV by cutting fee drag by 75%", () => {
    // Same 51% assessed probability, but with maker order (fee $0.44 instead of $1.75)
    // Gross edge = +$1.00, Maker fee = $0.44 -> Net EV = +$0.56!
    const simMaker = simulateOrderFriction({
      price: 0.50,
      size: 100,
      assessedProbability: 0.51,
      orderType: "maker",
    });

    assert.strictEqual(simMaker.orderType, "maker");
    assert.strictEqual(simMaker.effectiveFeeDollars, 0.44);
    assert.strictEqual(simMaker.expectedGrossProfit, 1.00);
    assert.strictEqual(simMaker.expectedNetProfit, 0.56);
    assert.strictEqual(simMaker.isPositiveEv, true);
    assert.ok(simMaker.verdict.includes("POSITIVE EV"));
  });

  it("executes simulate_order_friction through executeMcpTool dispatcher", async () => {
    const result = await executeMcpTool("simulate_order_friction", {
      price: 0.40,
      size: 50,
      assessedProbability: 0.45,
      orderType: "taker",
    });

    assert.strictEqual(result.price, 0.40);
    assert.strictEqual(result.size, 50);
    assert.strictEqual(result.totalNotional, 20.00);
    // Taker fee = ceil(0.07 * 50 * 0.4 * 0.6 * 100) / 100 = ceil(84) / 100 = $0.84
    assert.strictEqual(result.effectiveFeeDollars, 0.84);
  });

  it("executes get_spot_basis through executeMcpTool and maintains BRTI disclaimer", async () => {
    const basis = await executeMcpTool("get_spot_basis", { asset: "BTC" });
    assert.ok(basis.referenceIndex.includes("Quanterra BTC Spot Composite"));
    assert.ok(basis.disclaimer.includes("does not represent its composite index as the official CME CF BRTI benchmark"));
  });

  it("executes benchmark_competitor_claim through executeMcpTool and returns 64-char SHA-256 hash", async () => {
    const teardown = await executeMcpTool("benchmark_competitor_claim", {
      nominalPriceCents: 51,
      userStatedWinRatePct: 55,
      contracts: 100,
    });

    assert.strictEqual(teardown.nominalPriceCents, 51);
    assert.strictEqual(teardown.userStatedWinRatePct, 55);
    assert.strictEqual(teardown.competitorClaimedEdgePct, 4);
    assert.strictEqual(teardown.competitorNominalGrossEV, 4.00);
    assert.strictEqual(teardown.exactTakerFeeUsd, 1.75);
    assert.strictEqual(teardown.trueBreakevenHurdlePct, 52.75);
    assert.strictEqual(teardown.netRealizedExpectedProfitUsd, 2.25);
    assert.strictEqual(teardown.dangerZoneRiskFlag, true);
    assert.strictEqual(teardown.provenanceHash.length, 64);
  });

  it("executes get_competitive_battlecard through executeMcpTool and returns 6 dimensions", async () => {
    const battlecard = await executeMcpTool("get_competitive_battlecard", {});
    assert.strictEqual(battlecard.status, "ACTIVE_INDEPENDENT_REFEREE");
    assert.strictEqual(battlecard.dimensions.length, 6);
    assert.ok(battlecard.dimensions.some((d: any) => d.dimension.includes("Venue Neutrality")));
  });

  it("executes search_prediction_market_knowledge_base through executeMcpTool", async () => {
    const search = await executeMcpTool("search_prediction_market_knowledge_base", { query: "kalshi fee formula" });
    assert.strictEqual(search.query, "kalshi fee formula");
    assert.ok(search.totalMatches >= 1, "Should find at least 1 guide");
    assert.strictEqual(search.results[0].slug, "kalshi-fee-formula");
    assert.ok(search.results[0].canonicalUrl.includes("/guides/kalshi-fee-formula"));
  });

  it("executes get_cme_settlement_explainer through executeMcpTool", async () => {
    const explainer = await executeMcpTool("get_cme_settlement_explainer", {});
    assert.strictEqual(explainer.benchmark, "CME CF Bitcoin Real-Time Index (BRTI)");
    assert.strictEqual(explainer.administrator, "CF Benchmarks Ltd (FCA authorized)");
    assert.ok(explainer.constituentExchanges.includes("Coinbase"));
    assert.ok(explainer.averagingRule.includes("60-Second"));
  });

  it("executes teardown_cross_venue_spread through executeMcpTool", async () => {
    const cross = await executeMcpTool("teardown_cross_venue_spread", {
      priceKalshiCents: 48,
      pricePolymarketCents: 49,
      contracts: 1000,
    });
    assert.strictEqual(cross.claimedNominalSpreadCents, 3);
    assert.strictEqual(cross.claimedGrossProfitUsd, 30);
    assert.strictEqual(cross.venueATakerFeeUsd, 17.5);
    assert.strictEqual(cross.netRealizedProfitUsd, 6);
    assert.strictEqual(cross.feeDragRatioPct, 80);
    assert.strictEqual(cross.provenanceHash.length, 64);
  });

  it("executes calculate_calibration_adjusted_kelly through executeMcpTool", async () => {
    const kelly = await executeMcpTool("calculate_calibration_adjusted_kelly", {
      nominalPriceCents: 50,
      userStatedWinRatePct: 60,
      bankrollUsd: 1000,
      shrinkageFactor: 0.35,
    });
    assert.strictEqual(kelly.nominalPriceCents, 50);
    assert.strictEqual(kelly.userStatedWinRatePct, 60);
    assert.strictEqual(kelly.calibratedWinRatePct, 53.5);
    assert.strictEqual(kelly.competitorNaiveFullKellyPct, 20);
    assert.strictEqual(kelly.circuitBreakerStatus, "LOCKED_RULE_B5_ZERO_LIVE_RISK");
    assert.strictEqual(kelly.provenanceHash.length, 64);
  });

  it("executes decode_whale_flow through executeMcpTool", async () => {
    const whale = await executeMcpTool("decode_whale_flow", {
      priceCents: 51,
      contracts: 5000,
      venue: "kalshi",
    });
    assert.strictEqual(whale.priceCents, 51);
    assert.strictEqual(whale.contracts, 5000);
    assert.strictEqual(whale.notionalUsd, 2550);
    assert.strictEqual(whale.takerFeePaidUsd, 87.5);
    assert.strictEqual(whale.intentClassification, "DELTA_NEUTRAL_BASIS_HEDGE");
    assert.strictEqual(whale.provenanceHash.length, 64);
  });

  it("executes generate_trustos_audit_dossier through executeMcpTool", async () => {
    const dossier = await executeMcpTool("generate_trustos_audit_dossier", {
      institutionName: "Acme Risk Analytics",
      modelDomain: "algorithmic_underwriting",
    });
    assert.strictEqual(dossier.institutionName, "Acme Risk Analytics");
    assert.strictEqual(dossier.modelDomain, "algorithmic_underwriting");
    assert.strictEqual(dossier.statutoryCompliance.naicModelBulletin, "PASS");
    assert.strictEqual(dossier.statutoryCompliance.coloradoSb26189, "PASS");
    assert.strictEqual(dossier.commercialPilotTerms.fixedFeeUsd, 20000);
    assert.strictEqual(dossier.auditSealSha256.length, 64);
  });
});
