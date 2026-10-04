import assert from "node:assert/strict";

const CANONICAL_SPECIALISTS = [
  "draco",
  "wolf",
  "falcon",
  "quantum-fox",
  "sentinel",
  "kraken",
  "lion",
  "phoenix"
];

async function main() {
  console.log("=== Testing all 8 Council Specialist Chat Endpoints ===");
  
  for (const agentId of CANONICAL_SPECIALISTS) {
    const url = `http://localhost:3000/api/executives/${agentId}/chat`;
    console.log(`\nQuerying specialist: ${agentId} at ${url}...`);
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What is your role, track record, and current status?" })
    });
    
    assert.strictEqual(res.status, 200, `Expected 200 OK for ${agentId}, got ${res.status}`);
    const data = await res.json();
    
    assert.ok(data.reply, `Expected non-empty reply for ${agentId}`);
    assert.strictEqual(data.agentId, agentId, `Expected agentId ${agentId}, got ${data.agentId}`);
    console.log(`✓ 200 OK - Name: ${data.agentName}`);
    console.log(`  Reply snippet: "${data.reply.slice(0, 120)}..."`);
    console.log(`  Citations: ${JSON.stringify(data.citations)}`);
    console.log(`  Audit status: ${data.auditStatus}`);
  }

  // Also confirm that old/rogue names (lyra, orion) return 404
  for (const rogue of ["lyra", "orion"]) {
    const res = await fetch(`http://localhost:3000/api/executives/${rogue}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello" })
    });
    assert.strictEqual(res.status, 404, `Expected 404 for rogue agent ${rogue}`);
    console.log(`\n✓ Confirmed rogue agent '${rogue}' properly returns 404`);
  }

  console.log("\n=== ALL 8 SPECIALIST CHATS VERIFIED SUCCESSFULLY ===");
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
