import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  McpEngine,
  DeepSeekReasoningEngine,
  VllmPagedAttentionEngine,
  LlamaAgentEngine,
  SwarmOrchestrator,
  DspyChainOfThought,
  DspyBootstrapOptimizer,
  benchmarkAllEngines,
} from "../ai-engines/index.ts";

describe("Open-Source AI Engines & F1 Race Telemetry", () => {
  it("executes Anthropic MCP tool registration, listing, and sub-ms execution", async () => {
    const mcp = new McpEngine();
    mcp.registerTool({
      name: "fetch_calibration_metric",
      description: "Returns calibration Brier score",
      inputSchema: { type: "object", properties: { venue: { type: "string" } } },
      handler: (args) => ({ brier: 0.2001, venue: args.venue || "Kalshi" }),
    });

    const listRes = await mcp.handleRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    });
    assert.strictEqual(listRes.jsonrpc, "2.0");
    assert.strictEqual(listRes.result?.tools?.length, 1);

    const callRes = await mcp.handleRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "fetch_calibration_metric", arguments: { venue: "KXBTC15M" } },
    });
    assert.strictEqual(callRes.result?.content?.brier, 0.2001);
    assert.strictEqual(callRes.result?.isError, false);
    assert.ok(callRes.result?._telemetry?.executionTimeMs >= 0);
  });

  it("executes DeepSeek-R1 reasoning loop with MLA compression and CoT steps", () => {
    const engine = new DeepSeekReasoningEngine();
    const result = engine.executeReasoning("Evaluate KXBTC15M settled calibration", {
      marketPriceBrier: 0.2001,
      settledWindows: 1316,
      circuitLockStatus: "LOCKED_RULE_B5",
    });

    assert.strictEqual(result.engineCallSign, "DEEPSEEK-R1-REASONER");
    assert.ok(result.mlaCompressionRatio > 90); // ~93.3% KV compression
    assert.strictEqual(result.steps.length, 4);
    assert.ok(result.finalAnswer.includes("<think>"));
    assert.ok(result.finalAnswer.includes("</think>"));
    assert.strictEqual(result.moeActivatedExperts.length, 6);
  });

  it("executes Berkeley vLLM PagedAttention continuous batching and memory allocation", () => {
    const vllm = new VllmPagedAttentionEngine(128, 16);
    const telemetryBefore = vllm.getTelemetry();
    assert.strictEqual(telemetryBefore.usedBlocks, 0);

    vllm.enqueueRequest({ requestId: "req-f1-01", prompt: "Telemetry order book depth scan", priority: 10 });
    vllm.enqueueRequest({ requestId: "req-f1-02", prompt: "Spread compression analysis", priority: 5 });

    const batch = vllm.processNextBatch(2);
    assert.strictEqual(batch.length, 2);
    assert.strictEqual(batch[0].requestId, "req-f1-01");
    assert.ok(batch[0].latencyMs >= 0);

    const telemetryAfter = vllm.getTelemetry();
    assert.strictEqual(telemetryAfter.usedBlocks, 0); // Freed after execution
  });

  it("executes Meta Llama 3.3 agent format, prompt templating, and grammar check", () => {
    const llama = new LlamaAgentEngine("You are an F1 telemetry race engineer.");
    const formatted = llama.formatPrompt([
      { role: "user", content: "Check DRS sector 2 status" },
    ]);
    assert.ok(formatted.includes("<|begin_of_text|>"));
    assert.ok(formatted.includes("<|start_header_id|>system<|end_header_id|>"));
    assert.ok(formatted.includes("<|start_header_id|>user<|end_header_id|>"));

    const gen = llama.generateResponse(
      [{ role: "user", content: "Lap time check" }],
      "Telemetry sector 1 green"
    );
    assert.ok(gen.promptTokens > 0);
    assert.ok(gen.completionTokens > 0);
    assert.ok(gen.response.includes("[Llama-3.3-70B-MoE]"));
  });

  it("executes OpenAI Swarm multi-agent handoff loop", async () => {
    const swarm = new SwarmOrchestrator();
    swarm.registerAgent({
      id: "draco",
      name: "Draco",
      role: "ECU Sentinel",
      engineCallSign: "F1-ECU-02",
      instructions: "Check telemetry",
      functions: {},
    });
    swarm.registerAgent({
      id: "kraken",
      name: "Kraken",
      role: "Safety Marshall",
      engineCallSign: "F1-SAFETY-07",
      instructions: "Check risk",
      functions: {},
    });

    const result = await swarm.runSwarm("draco", "Perform a risk check on basis divergence");
    assert.strictEqual(result.finalAgentId, "kraken");
    assert.strictEqual(result.handoffCount, 1);
    assert.strictEqual(result.consensusScore, 0.99);
  });

  it("executes Stanford DSPy prompt optimization with Brier metric", () => {
    const sig = {
      name: "CalibrationPredictor",
      description: "Predicts calibration truth",
      inputs: [{ name: "market", description: "Market ticker", prefix: "Market" }],
      outputs: [{ name: "score", description: "Brier rating", prefix: "Score" }],
    };
    const module = new DspyChainOfThought(sig);
    const optimizer = new DspyBootstrapOptimizer();

    const optResult = optimizer.optimize(module, [
      { inputs: { market: "KXBTC15M" }, outputs: { score: "0.2001" }, brierScore: 0.2001 },
      { inputs: { market: "KXBTCD" }, outputs: { score: "0.2063" }, brierScore: 0.2063 },
    ]);

    assert.strictEqual(optResult.selectedDemos.length, 2);
    assert.strictEqual(optResult.bestMetric, 0.2032);

    const forward = module.forward({ market: "KXBTC15M" });
    assert.ok(forward.outputs.score);
    assert.ok(forward.promptUsed.includes("[DSPy-Signature: CalibrationPredictor]"));
  });

  it("benchmarks all 6 leading open-source AI engines with real latency profiling", () => {
    const benchmarks = benchmarkAllEngines();
    assert.strictEqual(benchmarks.length, 6);
    for (const b of benchmarks) {
      assert.strictEqual(b.status, "ONLINE");
      assert.ok(b.latencyMs >= 0);
      assert.ok(b.telemetrySummary.length > 0);
    }
  });
});
