/**
 * Live SMS Production Verification Script
 */

async function main() {
  const adminKey = "quanterra_admin_sec_2026_x9k2";
  const baseUrl = "https://quanterraos.com";

  const targets = ["+17472740110", "+13233467072"];
  const message =
    "QuanterraOS: BTC-USD composite spot benchmark active across Coinbase, Kraken, Bitstamp ($0.00 live exposure under Rule B5). Reply STOP to cancel, HELP for help.";

  console.log("=== Testing Live Production SMS Endpoints ===");
  console.log("Base URL:", baseUrl);

  for (const to of targets) {
    console.log(`\nTesting dispatch to: ${to}`);
    const res = await fetch(`${baseUrl}/api/sms/send-test`, {
      method: "POST",
      headers: {
        "x-admin-key": adminKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        message,
        campaignId: "operator_practice_live",
      }),
    });

    const data = await res.json();
    console.log(`HTTP ${res.status}:`, JSON.stringify(data, null, 2));
  }
}

main().catch((err) => {
  console.error("Error running test:", err);
  process.exit(1);
});
