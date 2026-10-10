import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  OPENAPI_SPEC_V2,
  LLMS_TXT_CONTENT,
  AGENTS_MD_CONTENT,
  WELL_KNOWN_MCP,
  RATE_LIMIT_TIERS,
  validateDeveloperApiKey,
  DATASETS_CATALOG,
} from "../lib/developer-platform.ts";
import { renderDevelopersPageHtml } from "../developers-page.ts";

describe("Phase 7 Task 7.5 Acceptance: Developer Platform, OpenAPI 3.1, llms.txt, agents.md & Rate Limits", () => {
  describe("1. OpenAPI 3.1.0 Specification Schema", () => {
    it("conforms to OpenAPI 3.1.0 standard and metadata", () => {
      assert.equal(OPENAPI_SPEC_V2.openapi, "3.1.0", "Must declare OpenAPI 3.1.0");
      assert.ok(OPENAPI_SPEC_V2.info.title.includes("QuanterraOS"));
      assert.equal(OPENAPI_SPEC_V2.info.version, "2.0.0");
      assert.ok(OPENAPI_SPEC_V2.info.description.includes("Rule B5"));
    });

    it("defines essential telemetry and calculation endpoints", () => {
      const paths = Object.keys(OPENAPI_SPEC_V2.paths);
      assert.ok(paths.includes("/fees/check"), "Must define /fees/check");
      assert.ok(paths.includes("/radar/{ticker}"), "Must define /radar/{ticker}");
      assert.ok(paths.includes("/sensors/trades"), "Must define /sensors/trades");
      assert.ok(paths.includes("/calibration/brier"), "Must define /calibration/brier");
      assert.ok(paths.includes("/mcp"), "Must define /mcp JSON-RPC endpoint");
    });

    it("defines security schemes with BearerAuth", () => {
      assert.ok(OPENAPI_SPEC_V2.components.securitySchemes.BearerAuth);
      assert.equal(OPENAPI_SPEC_V2.components.securitySchemes.BearerAuth.type, "http");
      assert.equal(OPENAPI_SPEC_V2.components.securitySchemes.BearerAuth.scheme, "bearer");
    });
  });

  describe("2. Machine Context Files (/llms.txt & /agents.md)", () => {
    it("validates llms.txt content, guardrails, and machine URLs", () => {
      assert.ok(LLMS_TXT_CONTENT.includes("# QuanterraOS"));
      assert.ok(LLMS_TXT_CONTENT.includes("Rule B5"));
      assert.ok(LLMS_TXT_CONTENT.includes("0.07 × C × P × (1 - P)"));
      assert.ok(LLMS_TXT_CONTENT.includes("CME CF BRTI"));
      assert.ok(LLMS_TXT_CONTENT.includes("0.2001") && LLMS_TXT_CONTENT.includes("0.2063"));
      assert.ok(LLMS_TXT_CONTENT.includes("https://quanterraos.com/openapi.json"));
      assert.ok(LLMS_TXT_CONTENT.includes("https://quanterraos.com/api/mcp"));
      assert.ok(LLMS_TXT_CONTENT.includes("https://quanterraos.com/agents.md"));
    });

    it("validates agents.md system prompt directives and non-advisory boundary", () => {
      assert.ok(AGENTS_MD_CONTENT.includes("Refuse Directional Advice"));
      assert.ok(AGENTS_MD_CONTENT.includes("NEVER recommend buying YES or NO"));
      assert.ok(AGENTS_MD_CONTENT.includes("Coin-Flip Hazard Zone"));
      assert.ok(AGENTS_MD_CONTENT.includes("mcpServers"));
      assert.ok(AGENTS_MD_CONTENT.includes("calculate_true_cost"));
      assert.ok(AGENTS_MD_CONTENT.includes("get_spot_basis"));
      assert.ok(AGENTS_MD_CONTENT.includes("get_calibration_metrics"));
    });

    it("validates .well-known/mcp discovery metadata", () => {
      assert.equal(WELL_KNOWN_MCP.protocol, "mcp");
      assert.equal(WELL_KNOWN_MCP.endpoints.rpc, "https://quanterraos.com/api/mcp");
      assert.equal(WELL_KNOWN_MCP.endpoints.manifest, "https://quanterraos.com/api/mcp/manifest");
      assert.equal(WELL_KNOWN_MCP.auth.free_tier_available, true);
      assert.equal(WELL_KNOWN_MCP.auth.free_quota_requests_per_month, 1000);
    });
  });

  describe("3. API Tiers & Rate Limit Validation", () => {
    it("enforces pricing.ts alignment: Cadet 1k req/mo free, Builder 50k req/mo at $49", () => {
      assert.equal(RATE_LIMIT_TIERS.cadet.monthlyPriceUsd, 0);
      assert.equal(RATE_LIMIT_TIERS.cadet.monthlyRequestLimit, 1000);
      assert.equal(RATE_LIMIT_TIERS.builder.monthlyPriceUsd, 49);
      assert.equal(RATE_LIMIT_TIERS.builder.monthlyRequestLimit, 50000);
      assert.equal(RATE_LIMIT_TIERS.institutional.monthlyPriceUsd, 1500);
    });

    it("validates API keys accurately across tiers", () => {
      const freeKey = validateDeveloperApiKey("qt_free_live_12345678");
      assert.equal(freeKey.valid, true);
      assert.equal(freeKey.tier, "cadet");
      assert.equal(freeKey.limit, 1000);

      const builderKey = validateDeveloperApiKey("qt_builder_live_99887766");
      assert.equal(builderKey.valid, true);
      assert.equal(builderKey.tier, "builder");
      assert.equal(builderKey.limit, 50000);

      const instKey = validateDeveloperApiKey("qt_inst_prod_secret_token");
      assert.equal(instKey.valid, true);
      assert.equal(instKey.tier, "institutional");
      assert.equal(instKey.limit, 10000000);

      const invalidKey = validateDeveloperApiKey("");
      assert.equal(invalidKey.valid, false);
      assert.equal(invalidKey.remaining, 0);
    });
  });

  describe("4. Datasets Catalog & DuckDB Queries", () => {
    it("catalog contains BRTI dispersion tick, calibration corpus, and orderbook snapshots", () => {
      assert.equal(DATASETS_CATALOG.length, 3);
      const ids = DATASETS_CATALOG.map((d) => d.id);
      assert.ok(ids.includes("brti-spot-dispersion"));
      assert.ok(ids.includes("calibration-corpus-1316"));
      assert.ok(ids.includes("kalshi-book-snapshots"));

      for (const ds of DATASETS_CATALOG) {
        assert.ok(ds.s3Uri.startsWith("s3://"));
        assert.ok(ds.duckDbQuery.includes("read_parquet"));
      }
    });
  });

  describe("5. Developers HTML UI Integrity (/developers)", () => {
    it("renders quickstarts, cards, rate limits table, and key sandbox", () => {
      const html = renderDevelopersPageHtml();
      assert.ok(html.includes("<!DOCTYPE html>"));
      assert.ok(html.includes("Programmatic Telemetry &amp; MCP for AI Agents"));

      // Code quickstart tabs
      assert.ok(html.includes("id=\"tab-curl\""));
      assert.ok(html.includes("id=\"tab-python\""));
      assert.ok(html.includes("id=\"tab-ts\""));
      assert.ok(html.includes("id=\"tab-duckdb\""));
      assert.ok(html.includes("id=\"btn-copy-code\""));

      // Feature cards
      assert.ok(html.includes("OpenAPI 3.1 Specification"));
      assert.ok(html.includes("/openapi.json"));
      assert.ok(html.includes("Remote MCP Server"));
      assert.ok(html.includes("/api/mcp/manifest"));
      assert.ok(html.includes("llms.txt &amp; agents.md"));
      assert.ok(html.includes("/llms.txt"));
      assert.ok(html.includes("/agents.md"));

      // MCP config snippet
      assert.ok(html.includes("claude_desktop_config.json"));
      assert.ok(html.includes("https://quanterraos.com/api/mcp"));

      // Rate limits table
      assert.ok(html.includes("1,000 req/mo"));
      assert.ok(html.includes("50,000 req/mo"));
      assert.ok(html.includes("$49/mo"));

      // Key generator
      assert.ok(html.includes("id=\"dev-key-input\""));
      assert.ok(html.includes("Generate New Key"));

      // Compliance
      assert.ok(html.includes("LOCKED_RULE_B5 ($0.00 CAPITAL RISK)"));
      const lower = html.toLowerCase();
      assert.strictEqual(lower.includes("guaranteed profit"), false);
      assert.strictEqual(lower.includes("beat the market"), false);
    });
  });
});
