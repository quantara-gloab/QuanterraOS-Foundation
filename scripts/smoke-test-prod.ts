/**
 * Production Smoke Test for QuanterraOS.com
 *
 * Runs non-destructive health, security, and rendering checks against
 * the live deployment URL (e.g. https://quanterraos.com or platform dev URL).
 *
 * Usage:
 *   node --experimental-strip-types scripts/smoke-test-prod.ts https://quanterraos.com
 *   node --experimental-strip-types scripts/smoke-test-prod.ts http://localhost:3000
 */

const targetUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");

console.log(`\n======================================================`);
console.log(` QuanterraOS Production Smoke Test: ${targetUrl}`);
console.log(` Timestamp: ${new Date().toISOString()}`);
console.log(`======================================================\n`);

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

async function runCheck(name: string, checkFn: () => Promise<{ passed: boolean; details: string }>) {
  try {
    const res = await checkFn();
    results.push({ name, passed: res.passed, details: res.details });
    const mark = res.passed ? "✔ PASS" : "✖ FAIL";
    console.log(`[${mark}] ${name} — ${res.details}`);
  } catch (err) {
    results.push({ name, passed: false, details: (err as Error).message });
    console.log(`[✖ FAIL] ${name} — Error: ${(err as Error).message}`);
  }
}

async function main() {
  // 1. Health Endpoint
  await runCheck("Health Check Endpoint (/health)", async () => {
    const res = await fetch(`${targetUrl}/health`);
    if (!res.ok) return { passed: false, details: `HTTP status ${res.status}` };
    const json = await res.json() as any;
    if (json.status !== "ok" || json.circuit !== "LOCKED_RULE_B5") {
      return { passed: false, details: `Unexpected health payload: ${JSON.stringify(json)}` };
    }
    return { passed: true, details: `200 OK (uptime: ${Math.round(json.uptime)}s, db: ${json.database}, circuit: ${json.circuit})` };
  });

  // 2. Core Surface Pages
  const pages = [
    { path: "/", name: "Homepage (/)" },
    { path: "/predictions", name: "Predictions Ledger (/predictions)" },
    { path: "/autopilot", name: "Autopilot Console (/autopilot)" },
    { path: "/calibration", name: "Calibration Terminal (/calibration)" },
    { path: "/pricing", name: "Pricing & Plans (/pricing)" },
    { path: "/research", name: "Research Directory (/research)" },
    { path: "/trustos", name: "TrustOS Pilot Offer (/trustos)" },
    { path: "/wallet", name: "Subscriber Sandbox Wallet (/wallet)" },
  ];

  for (const page of pages) {
    await runCheck(`Page Render: ${page.name}`, async () => {
      const res = await fetch(`${targetUrl}${page.path}`);
      if (!res.ok) return { passed: false, details: `HTTP status ${res.status}` };
      const text = await res.text();
      if (!text.includes("<!doctype html>") && !text.includes("<html")) {
        return { passed: false, details: "Response does not appear to be valid HTML" };
      }
      return { passed: true, details: `200 OK (${text.length.toLocaleString()} bytes)` };
    });
  }

  // 3. CFTC Rule 4.41 Statutory Disclaimer Verification
  await runCheck("Regulatory Compliance: CFTC 4.41 Disclosure", async () => {
    const res = await fetch(`${targetUrl}/pricing`);
    const text = await res.text();
    const hasCftc = text.includes("CFTC") || text.includes("HYPOTHETICAL") || text.includes("SIMULATED");
    if (!hasCftc) {
      return { passed: false, details: "CFTC 4.41 hypothetical trading disclosure missing from pricing" };
    }
    return { passed: true, details: "Verified present in rendered HTML" };
  });

  // 4. Rule B5 $0.00 Capital Protection Lock
  await runCheck("Rule B5 Capital Protection Lock ($0.00 Live)", async () => {
    const res = await fetch(`${targetUrl}/autopilot`);
    const text = await res.text();
    const hasLock = text.includes("Rule B5") || text.includes("$0.00") || text.includes("PAPER");
    if (!hasLock) {
      return { passed: false, details: "Rule B5 capital lock indicator missing from autopilot" };
    }
    return { passed: true, details: "Verified present in rendered HTML" };
  });

  // 5. Test/Sandbox Route Lockout
  await runCheck("Security: /api/billing/simulate-webhook Disabled", async () => {
    const res = await fetch(`${targetUrl}/api/billing/simulate-webhook`, { method: "POST" });
    if (res.status === 404 || res.status === 403) {
      return { passed: true, details: `Successfully blocked with HTTP ${res.status} (Not Found)` };
    }
    return { passed: false, details: `Expected 404/403, received HTTP ${res.status}` };
  });

  // 6. Summary Report
  console.log(`\n------------------------------------------------------`);
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`Summary: ${passed}/${total} Passed (${failed} Failed)`);
  console.log(`------------------------------------------------------\n`);

  if (failed > 0) {
    console.error("✖ Production smoke test failed. Resolve flagged items before cutover.");
    process.exit(1);
  } else {
    console.log("✔ All production smoke test gates passed successfully!");
  }
}

main().catch((err) => {
  console.error("Fatal smoke test execution error:", err);
  process.exit(1);
});
