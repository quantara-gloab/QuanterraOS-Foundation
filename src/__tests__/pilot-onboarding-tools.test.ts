import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderLandingPage } from '../landing-page.ts';
import { renderCalculatorPageHtml } from '../calculator-page.ts';
import { renderJournalPageHtml } from '../journal-page.ts';
import { renderPilotAuditPageHtml } from '../pilot-audit-page.ts';

describe('Pilot Onboarding Tools & Arithmetic Unification', () => {
  it('unifies arithmetic across static and dynamic displays', () => {
    const landing = renderLandingPage();
    // Verify exact unified numbers: 10 contracts @ $0.51, $0.18 fee, 1.80¢/ct, $5.10 cost, $5.28 max loss, 52.80% breakeven
    assert.match(landing, /\$0\.18/, 'Landing page should display $0.18 fee');
    assert.match(landing, /1\.80¢/, 'Landing page should display 1.80¢/contract');
    assert.match(landing, /\$5\.28/, 'Landing page should display $5.28 total max loss');
    assert.match(landing, /52\.80%/, 'Landing page should display 52.80% breakeven');

    const calculator = renderCalculatorPageHtml();
    assert.match(calculator, /\$0\.18/, 'Calculator page should display $0.18 fee');
    assert.match(calculator, /\$5\.28/, 'Calculator page should display $5.28 total cost/max loss');
    assert.match(calculator, /52\.80%/, 'Calculator page should display 52.80% breakeven');
  });

  it('renders consumer navigation (Check · Journal · Learn · Sign in) and secondary research/institutional links', () => {
    const landing = renderLandingPage();
    assert.match(landing, />Check<\/a>/);
    assert.match(landing, />Journal<\/a>/);
    assert.match(landing, />Learn<\/a>/);
    assert.match(landing, />Sign in<\/a>/);
    assert.match(landing, /href="\/research"[^>]*>Research<\/a>/);
    assert.match(landing, /href="\/access"[^>]*>Institutional<\/a>/);

    const calculator = renderCalculatorPageHtml();
    assert.match(calculator, />Check<\/a>/);
    assert.match(calculator, />Journal<\/a>/);
    assert.match(calculator, />Learn<\/a>/);

    const journal = renderJournalPageHtml(null, 'free', []);
    assert.match(journal, />Check<\/a>/);
    assert.match(journal, />Journal<\/a>/);
    assert.match(journal, />Learn<\/a>/);
  });

  it('provides First-Use Preview outside customer funnel metrics', () => {
    const landing = renderLandingPage();
    assert.match(landing, /Example Preview/);
    assert.match(landing, /loadExampleWedgeCheck\(\)/);

    const journal = renderJournalPageHtml(null, 'free', []);
    assert.match(journal, /FIRST-USE EXAMPLE PREVIEW/);
    assert.match(journal, /KXBTC15M Example Check/);
    assert.match(journal, /Excluded from customer metrics/);
  });

  it('renders simpler mobile check with price, quantity, fees, total cost first and collapsible advanced options', () => {
    const calculator = renderCalculatorPageHtml();
    assert.match(calculator, /id="slider-price"/);
    assert.match(calculator, /id="input-count"/);
    assert.match(calculator, /id="val-summary-fee"/);
    assert.match(calculator, /id="val-summary-loss"/);
    assert.match(calculator, /id="val-summary-breakeven"/);
    assert.match(calculator, /<details/);
    assert.match(calculator, /Advanced Assumptions/);
  });

  it('integrates beta feedback widget capturing non-sensitive telemetry', () => {
    const landing = renderLandingPage();
    assert.match(landing, /beta-feedback-modal/);
    assert.match(landing, /Report a problem/);

    const calculator = renderCalculatorPageHtml();
    assert.match(calculator, /beta-feedback-modal/);

    const journal = renderJournalPageHtml(null, 'free', []);
    assert.match(journal, /beta-feedback-modal/);
  });

  it('presents Founder Observation Dashboard starting empty until observed', () => {
    const emptyAudit = renderPilotAuditPageHtml({
      customerFunnel: {
        checks_completed: 0,
        signups: 0,
        checks_saved: 0,
        journal_views: 0,
        journal_exports: 0
      },
      internalFunnel: {
        checks_completed: 0,
        signups: 0,
        checks_saved: 0,
        journal_views: 0,
        journal_exports: 0
      },
      recentJournalEntries: [],
      recordedSessions: []
    });

    assert.match(emptyAudit, /Every result starts empty until observed/);
    assert.match(emptyAudit, /0 of 10 participant usability sessions logged/);
    assert.match(emptyAudit, /id="obs-date"/);
    assert.match(emptyAudit, /id="obs-id"/);
    assert.match(emptyAudit, /id="obs-device"/);
    assert.match(emptyAudit, /id="obs-unassisted"/);
    assert.match(emptyAudit, /id="obs-assistance"/);
    assert.match(emptyAudit, /id="obs-comprehension"/);
    assert.match(emptyAudit, /id="obs-defects"/);
  });

  it('provides useful journal details: decision actions, editable reasoning, and weekly recap preview', () => {
    const journal = renderJournalPageHtml(null, 'free', []);
    assert.match(journal, /Weekly Decision & Outcome Recap/);
    assert.match(journal, /action-select/);
    assert.match(journal, /Skipped/);
    assert.match(journal, /Paper trade/i);
    assert.match(journal, /Actual trade/i);
    assert.match(journal, /Saving a check does <strong>never<\/strong> place a trade or commit live capital/);
    assert.match(journal, /reasoning-textarea/);
  });
});
