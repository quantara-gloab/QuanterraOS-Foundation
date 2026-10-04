/**
 * Test suite for Global Edge Telemetry Nodes across continents.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { getGlobalEdgeNodes, renderStatusPageHtml } from "../status-page.ts";

test("getGlobalEdgeNodes covers major cities on every continent", () => {
  const nodes = getGlobalEdgeNodes();
  assert.equal(nodes.length, 9, "Should define 9 edge telemetry nodes");

  const continents = new Set(nodes.map((n) => n.continent));
  assert.ok(continents.has("North America"), "Must have North America node");
  assert.ok(continents.has("Europe"), "Must have Europe node");
  assert.ok(continents.has("Asia"), "Must have Asia node");
  assert.ok(continents.has("South America"), "Must have South America node");
  assert.ok(continents.has("Oceania"), "Must have Oceania node");
  assert.ok(continents.has("Africa"), "Must have Africa node");

  const cities = nodes.map((n) => n.city);
  assert.ok(cities.includes("Chicago"));
  assert.ok(cities.includes("London"));
  assert.ok(cities.includes("Tokyo"));
  assert.ok(cities.includes("Singapore"));
  assert.ok(cities.includes("Frankfurt"));
  assert.ok(cities.includes("São Paulo"));
  assert.ok(cities.includes("Sydney"));
  assert.ok(cities.includes("Johannesburg"));

  for (const node of nodes) {
    assert.ok(node.latencyMs > 0, `Node ${node.id} must have positive latency`);
    assert.ok(node.targetExchanges.length > 0, `Node ${node.id} must have target exchanges`);
    assert.ok(node.facility.length > 0, `Node ${node.id} must specify colocation facility`);
    assert.ok(node.status === "ONLINE" || node.status === "SYNCHRONIZED");
  }
});

test("Status page renders Global Edge Telemetry table with disclaimers", () => {
  const html = renderStatusPageHtml();
  assert.match(html, /Global Edge Telemetry &amp; Exchange Colocation Nodes/i);
  assert.match(html, /Equinix CH4/i);
  assert.match(html, /Equinix LD4/i);
  assert.match(html, /Equinix TY3/i);
  assert.match(html, /QuanterraOS does not operate physical corporate trading offices/i);
});
