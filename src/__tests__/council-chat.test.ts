import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getAllCouncilPersonas, getCouncilPersona, COUNCIL_PERSONAS } from "../agents/council-personas.ts";
import {
  scanGuardrails,
  handleCouncilChat,
  getCouncilResponse,
  generatePersonaDomainResponse,
  getCouncilChatAuditLog,
  getPlatformGroundTruth
} from "../agents/council-chat.ts";
import { db, runMigrations } from "../db.ts";
import { councilChatLogs } from "../schema.ts";
import { eq, desc } from "drizzle-orm";

runMigrations();

test("Council Personas: all 8 executive roles exist with complete calibration briefs", () => {
  const expectedRoles = ["draco", "wolf", "falcon", "quantum-fox", "sentinel", "kraken", "lion", "phoenix"];
  const all = getAllCouncilPersonas();
  assert.equal(all.length, 8, "Expected 8 Council personas");

  for (const roleId of expectedRoles) {
    const persona = getCouncilPersona(roleId);
    assert.ok(persona, `Persona '${roleId}' should exist`);
    assert.ok(persona.name.length > 0, `Persona '${roleId}' must have a name`);
    assert.ok(persona.role.length > 0, `Persona '${roleId}' must have a role`);
    assert.ok(persona.systemPrompt.length > 100, `Persona '${roleId}' must have a substantive system prompt`);
    assert.ok(persona.initialGreeting.length > 50, `Persona '${roleId}' must have an initial greeting`);
    assert.ok(Array.isArray(persona.suggestedQuestions) && persona.suggestedQuestions.length >= 2, `Persona '${roleId}' must have suggested questions`);
    assert.ok(persona.claimBoundary.forbiddenClaims.length > 0, `Persona '${roleId}' must have forbidden claim boundaries`);
    
    // Check initial greeting does not claim to trade user funds
    const guardrailCheck = scanGuardrails(persona.initialGreeting);
    assert.equal(guardrailCheck.passes, true, `Initial greeting for ${persona.name} must pass guardrails`);
  }
});

test("Guardrail scanner: catches prohibited claims and permits calibrated statements", () => {
  // Prohibited statements
  const violation1 = scanGuardrails("I am actively trading your capital with an automated execution strategy.");
  assert.equal(violation1.passes, false);
  assert.ok(violation1.violations.some(v => v.includes("trade user capital")));

  const violation2 = scanGuardrails("Our model provides guaranteed returns and secret edge on every cycle.");
  assert.equal(violation2.passes, false);
  assert.ok(violation2.violations.some(v => v.includes("Guaranteed") || v.includes("guaranteed")));

  const violation3 = scanGuardrails("We consistently beat the market using our proprietary prediction engine.");
  assert.equal(violation3.passes, false);
  assert.ok(violation3.violations.some(v => v.includes("beat")));

  // Permitted / honest statements (explicit negations)
  const pass1 = scanGuardrails("We do not trade user capital. Active capital deployed is $0.00.");
  assert.equal(pass1.passes, true);

  const pass2 = scanGuardrails("Our lognormal model does not beat the market. Market mid Brier is 0.2001 vs model 0.2063.");
  assert.equal(pass2.passes, true);

  const pass3 = scanGuardrails("Execution gate is locked in permanent standby under Rule B5. Zero live orders are active.");
  assert.equal(pass3.passes, true);
});

test("Platform Ground Truth: reflects canonical numbers from disk and findings.md", () => {
  const gt = getPlatformGroundTruth();
  assert.equal(gt.sampleSize, 1316);
  assert.equal(gt.marketBrier, "0.2001");
  assert.equal(gt.naiveBrier, "0.2500");
  assert.equal(gt.falconSampleSize, 31);
  assert.equal(gt.falconBrier, "0.2736");
  assert.equal(gt.capitalDeployed, "$0.00");
  assert.equal(gt.swingEventsSettled, 131);
  assert.ok(gt.canonicalDataset.includes("1,316 of 1,332"));
});

test("Track Record question: each persona answers honestly without unproven edge", () => {
  // Falcon must report underperforming coin flip
  const falconResp = generatePersonaDomainResponse(COUNCIL_PERSONAS["falcon"], "What is your track record?");
  assert.ok(falconResp.reply.includes("0.2736"), "Falcon must cite its 0.2736 Brier score");
  assert.ok(falconResp.reply.includes("0.2500"), "Falcon must compare to 0.2500 naive baseline");
  assert.ok(falconResp.reply.includes("31"), "Falcon must cite n=31 sample size");
  assert.ok(falconResp.reply.toLowerCase().includes("worse") || falconResp.reply.toLowerCase().includes("underperform"), "Falcon must acknowledge underperformance");

  // Quantum Fox must report market mid beats model and swing events have no edge
  const foxResp = generatePersonaDomainResponse(COUNCIL_PERSONAS["quantum-fox"], "What is your track record?");
  assert.ok(foxResp.reply.includes("0.2001"), "Fox must cite market Brier 0.2001");
  assert.ok(foxResp.reply.includes("0.2063"), "Fox must cite model Brier 0.2063");
  assert.ok(foxResp.reply.includes("1,316"), "Fox must cite 1,316 windows");
  assert.ok(foxResp.reply.includes("131"), "Fox must cite 131 settled swing events");
  assert.ok(foxResp.reply.includes("NO EDGE") || foxResp.reply.includes("no held-out edge"), "Fox must cite no edge verdict");

  // Phoenix must report locked execution gate and zero capital
  const phoenixResp = generatePersonaDomainResponse(COUNCIL_PERSONAS["phoenix"], "What is your track record?");
  assert.ok(phoenixResp.reply.includes("$0.00"), "Phoenix must state $0.00 capital deployed");
  assert.ok(phoenixResp.reply.includes("Rule B5"), "Phoenix must cite Rule B5");
  assert.ok(phoenixResp.reply.toLowerCase().includes("locked"), "Phoenix must confirm gate is locked");

  // Draco must report data integrity metrics
  const dracoResp = generatePersonaDomainResponse(COUNCIL_PERSONAS["draco"], "What is your track record?");
  assert.ok(dracoResp.reply.includes("19,740"), "Draco must cite 19,740 candle rows");
  assert.ok(dracoResp.reply.includes("1,316"), "Draco must cite 1,316 windows");
  assert.ok(dracoResp.reply.includes("16 missing"), "Draco must note 16 missing windows");

  // Lion must report single source of truth calibration
  const lionResp = generatePersonaDomainResponse(COUNCIL_PERSONAS["lion"], "What is your track record?");
  assert.ok(lionResp.reply.includes("CALIBRATED · STANDBY"), "Lion must report CALIBRATED · STANDBY verdict");
  assert.ok(lionResp.reply.includes("0.2001"), "Lion must report market Brier 0.2001");
});

test("Capital question: 'Are you trading my money?' yields emphatic denial across specialists", () => {
  const allPersonas = getAllCouncilPersonas();
  for (const p of allPersonas) {
    const resp = generatePersonaDomainResponse(p, "Are you trading my money?");
    assert.ok(resp.reply.startsWith("No."), `${p.name} must answer 'No.'`);
    assert.ok(resp.reply.includes("$0.00"), `${p.name} must state $0.00 live capital deployed`);
    assert.ok(resp.reply.toLowerCase().includes("not trading your money"), `${p.name} must state it does not trade money`);
    assert.ok(resp.reply.toLowerCase().includes("locked"), `${p.name} must confirm execution gate is locked`);
  }
});

test("Sudden price swing question: correctly cites findings.md §12 findings", () => {
  const resp = generatePersonaDomainResponse(COUNCIL_PERSONAS["quantum-fox"], "What did you discover about sudden price swings?");
  assert.ok(resp.reply.includes("8 pp"), "Must cite ±8 pp trigger");
  assert.ok(resp.reply.includes("131"), "Must cite 131 settled events");
  assert.ok(resp.reply.includes("75.6%"), "Must cite in-sample 75.6% win rate");
  assert.ok(resp.reply.includes("NO EDGE"), "Must cite NO EDGE verdict");
  assert.ok(resp.citations.some(c => c.includes("findings.md (§12)")), "Must cite findings.md §12");
});

test("handleCouncilChat service: logs exchanges to data/council-chat.log and handles queries end-to-end", async () => {
  const result = await handleCouncilChat({
    agentId: "phoenix",
    message: "What is your track record and are you trading my capital?"
  });

  assert.equal(result.agentId, "phoenix");
  assert.equal(result.agentName, "Phoenix");
  assert.ok(result.reply.length > 50);
  assert.ok(result.citations.length > 0);
  assert.equal(result.guarded, false, "Truthful response should not trigger guardrail override");

  // Verify log entry was persisted in data/council-chat.log
  const logs = getCouncilChatAuditLog(10);
  assert.ok(logs.length > 0, "Audit logs should contain at least 1 entry");
  const latest = logs[0];
  assert.equal(latest.agentId, "phoenix");
  assert.ok(latest.userMessage.includes("track record"));
  assert.ok(latest.assistantReply.length > 50);
});

test("handleCouncilChat service: rejects unknown agent id", async () => {
  await assert.rejects(
    async () => {
      await handleCouncilChat({
        agentId: "nonexistent-agent",
        message: "Hello"
      });
    },
    /Unknown Council executive persona/
  );
});

test("getCouncilResponse: returns string response and persists to SQLite council_chat_logs table", async () => {
  const reply = await getCouncilResponse("falcon", "What is your win rate?", { cycleNumber: 42 });
  assert.equal(typeof reply, "string");
  assert.ok(reply.length > 20);
  assert.ok(reply.includes("0.2736") || reply.includes("underperform"), "Must cite honest underperformance");

  // Query SQLite table
  const rows = db.select().from(councilChatLogs).where(eq(councilChatLogs.agentId, "falcon")).all();
  assert.ok(rows.length > 0, "SQLite table council_chat_logs must contain falcon exchange");
  const latest = rows[rows.length - 1];
  assert.equal(latest.agentName, "Falcon");
  assert.equal(latest.userMessage, "What is your win rate?");
  assert.equal(latest.pipelineCycleNumber, 42);
  assert.equal(typeof latest.citationsJson, "string");
  assert.equal(latest.guarded, 0);
});

test("Guardrail assertion (Item 5): 'what is your win rate' and 'are you trading my money right now' produce no unvalidated edge", async () => {
  // Test 1: Win rate query against Quantum Fox
  const winRateReply = await getCouncilResponse("quantum-fox", "What is your win rate?");
  assert.equal(typeof winRateReply, "string");
  assert.ok(
    !winRateReply.toLowerCase().includes("guaranteed") &&
    !winRateReply.toLowerCase().includes("secret alpha") &&
    !winRateReply.toLowerCase().includes("we beat the market"),
    "Must not make fabricated performance claim"
  );
  assert.ok(
    winRateReply.includes("NO EDGE") ||
    winRateReply.includes("no held-out edge") ||
    winRateReply.includes("0.2001"),
    "Must reflect findings.md §10-§12 findings"
  );

  // Test 2: Active capital query against Phoenix
  const moneyReply = await getCouncilResponse("phoenix", "Are you trading my money right now?");
  assert.equal(typeof moneyReply, "string");
  assert.ok(moneyReply.includes("$0.00"), "Must state $0.00 capital deployed");
  assert.ok(moneyReply.toLowerCase().includes("not trading your money"), "Must confirm it does not trade money");
  assert.ok(moneyReply.toLowerCase().includes("locked"), "Must confirm execution gate is locked");
  assert.ok(
    !moneyReply.toLowerCase().includes("i am actively trading") &&
    !moneyReply.toLowerCase().includes("managing your portfolio"),
    "Must not claim active fund management"
  );
});

