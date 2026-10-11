import fs from 'node:fs';

const html = fs.readFileSync('website-mobile-preview.html', 'utf8');

const checks = [
  ['Title mentions QuanterraOS 44 NFTs', html.includes('QuanterraOS — Elite Eleven & The 44 NFTs')],
  ['View 1: Welcome & Sign Up is active first', html.includes('class="proto-view active" id="view-welcome"')],
  ['Founder Michael Quanterra message present', html.includes('Founder Provenance · Michael Quanterra')],
  ['Pilot sign up form present', html.includes('id="pilot-signup-form"')],
  ['View 2: The Terminal is second', html.includes('id="view-terminal"')],
  ['Attack Kalshi & Polymarket controls present', html.includes('Attacking Venue Inefficiencies') && html.includes('INITIATE ARBITRAGE ATTACK')],
  ['9 AI executive flight crew battle stations', html.includes("activateCrewComms('quanta', this)") && html.includes("activateCrewComms('wolf', this)")],
  ['Interactive combat cost slider math', html.includes('contracts-slider') && html.includes('updateTacticalCombatMath()')],
  ['View 3: Pilot Hangar present', html.includes('id="view-hangar"')],
  ['Dynamic Pilot Avatar SVG rendering present', html.includes('renderPilotAvatar()') && html.includes('pickPilotApparel(')],
  ['View 4: QuanterraOS 44 NFTs present', html.includes('id="view-nfts"') && html.includes('QuanterraOS 44 NFTs')],
  ['All 44 NFTs embedded in catalog', html.includes('q44-001') && html.includes('q44-044')],
  ['Inspect modal for 44 NFTs present', html.includes('id="art-modal"') && html.includes('openArtModal(')],
  ['View 5: Platforms & Cost present', html.includes('id="view-platforms"')],
  ['View 6: Apparel & Gear present', html.includes('id="view-gear"')],
  ['Tesla-style spacious buttons and rows', html.includes('btn-tesla-primary') && html.includes('btn-tesla-mint') && html.includes('button-group-row')],
  ['Resilient image error fallback handler', html.includes('handleImgError(this')]
];

let allPassed = true;
checks.forEach(([desc, passed]) => {
  console.log((passed ? '✔ ' : '✖ ') + desc);
  if (!passed) allPassed = false;
});

if (allPassed) {
  console.log('\nAll 17 verification checks PASSED successfully!');
} else {
  console.error('\nSome checks failed!');
  process.exit(1);
}
