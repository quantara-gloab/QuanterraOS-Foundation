import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderLandingPage } from '../landing-page.ts';
import { renderCouncilDashboardPage } from '../dashboard-terminal.ts';
import { getCouncilPersona, getAllCouncilPersonas } from '../agents/council-personas.ts';
import { handleCouncilChat } from '../agents/council-chat.ts';

describe('Council Specialist Client-to-Backend Wiring & Interrogation Guardrails', () => {
  const landingHtml = renderLandingPage();
  const dashboardHtml = renderCouncilDashboardPage();
  const canonicalPersonas = getAllCouncilPersonas();
  const canonicalIds = canonicalPersonas.map(p => p.id);

  it('contains exactly the 8 canonical specialists in the landing page query buttons', () => {
    // Regex matching openSpecialistModal('agentId', 'chat')
    const regex = /openSpecialistModal\('([^']+)',\s*'chat'\)/g;
    const matches: string[] = [];
    let m;
    while ((m = regex.exec(landingHtml)) !== null) {
      matches.push(m[1]);
    }

    assert.strictEqual(matches.length, 8, 'Landing page must have exactly 8 specialist query buttons');
    assert.deepStrictEqual(
      [...matches].sort(),
      [...canonicalIds].sort(),
      'Landing page query buttons must match the canonical 8 Council specialist IDs exactly'
    );
  });

  it('contains exactly the 8 canonical specialists in the dashboard console query buttons', () => {
    // Regex matching promptSpecialist('agentId')
    const regex = /promptSpecialist\('([^']+)'\)/g;
    const matches: string[] = [];
    let m;
    while ((m = regex.exec(dashboardHtml)) !== null) {
      matches.push(m[1]);
    }

    assert.strictEqual(matches.length, 8, 'Dashboard console must have exactly 8 specialist query buttons');
    assert.deepStrictEqual(
      [...matches].sort(),
      [...canonicalIds].sort(),
      'Dashboard console query buttons must match the canonical 8 Council specialist IDs exactly'
    );
  });

  it('every rendered interrogation button resolves to an active persona and successfully executes chat', async () => {
    // Test that querying each specialist produces a verified, in-character response without throwing
    for (const agentId of canonicalIds) {
      const persona = getCouncilPersona(agentId);
      assert.ok(persona, `Persona for ${agentId} must exist`);

      const res = await handleCouncilChat({
        agentId,
        message: 'What is your operational role and current track record?'
      });

      assert.strictEqual(res.agentId, agentId);
      assert.strictEqual(res.agentName, persona.name);
      assert.ok(res.reply && res.reply.length > 20, `Specialist ${agentId} must provide substantive reply`);
      assert.ok(Array.isArray(res.citations), `Specialist ${agentId} must return citations array`);
    }
  });

  it('explicitly guarantees Wolf and Kraken are wired and rogue names (Lyra, Orion) are rejected', async () => {
    // Wolf
    const wolf = getCouncilPersona('wolf');
    assert.ok(wolf, 'Wolf persona must exist');
    assert.strictEqual(wolf.name, 'Wolf');
    const wolfChat = await handleCouncilChat({ agentId: 'wolf', message: 'What is your role?' });
    assert.strictEqual(wolfChat.agentName, 'Wolf');

    // Kraken
    const kraken = getCouncilPersona('kraken');
    assert.ok(kraken, 'Kraken persona must exist');
    assert.strictEqual(kraken.name, 'Kraken');
    const krakenChat = await handleCouncilChat({ agentId: 'kraken', message: 'What is your role?' });
    assert.strictEqual(krakenChat.agentName, 'Kraken');

    // Rogue names
    assert.strictEqual(getCouncilPersona('lyra'), null, 'Lyra must not exist in Council personas');
    assert.strictEqual(getCouncilPersona('orion'), null, 'Orion must not exist in Council personas');

    await assert.rejects(
      () => handleCouncilChat({ agentId: 'lyra', message: 'Hello' }),
      /Unknown Council executive persona/i,
      'Querying Lyra must throw Unknown Council executive persona'
    );
    await assert.rejects(
      () => handleCouncilChat({ agentId: 'orion', message: 'Hello' }),
      /Unknown Council executive persona/i,
      'Querying Orion must throw Unknown Council executive persona'
    );
  });
});
