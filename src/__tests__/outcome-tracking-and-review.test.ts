import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderJournalPageHtml } from '../journal-page.ts';
import { renderReviewPageHtml } from '../review-page.ts';
import { renderBetaBookingPageHtml } from '../booking-page.ts';
import { renderPilotAuditPageHtml } from '../pilot-audit-page.ts';
import { getFeatureFlags } from '../feature-flags.ts';

describe('Outcome Tracking, Personal Review & Beta Booking Flow', () => {
  it('Task 1: labels incomplete actual trades and renders actual trade outcome controls', () => {
    // 1. Incomplete actual trade
    const incompleteEntry = {
      id: 'jrn_test_1',
      userId: 'usr_1',
      venue: 'kalshi-15m',
      contractTicker: 'KXBTC15M',
      contractType: 'binary_above_below',
      side: 'yes',
      pricingBasis: 'executable_ask',
      contractPrice: 0.51,
      contractCount: 10,
      purchaseCost: 5.10,
      exchangeFee: 0.18,
      halfSpreadDrag: 0.0,
      totalDrag: 0.018,
      breakevenWinProb: 52.80,
      assessedWinProb: 55.0,
      netExpectedValue: 0.22,
      settlementSource: 'CME CF BRTI 60s TWAP',
      decisionAction: 'actual_trade',
      actualQuantity: null,
      actualFillPrice: null,
      actualFees: null,
      exitProceeds: null,
      realizedPnl: null,
      status: 'saved_check',
      createdAt: '2026-10-06T12:00:00Z',
    };

    const htmlIncomplete = renderJournalPageHtml(null, 'free', [incompleteEntry as any]);
    assert.match(htmlIncomplete, /INCOMPLETE/);
    assert.match(htmlIncomplete, /Missing trade details/);
    assert.match(htmlIncomplete, /openActualTradeModal/);
    assert.match(htmlIncomplete, /id="actual-trade-modal"/);

    // 2. Completed actual trade
    const completeEntry = {
      ...incompleteEntry,
      id: 'jrn_test_2',
      actualQuantity: 10,
      actualFillPrice: 0.51,
      actualFees: 0.18,
      exitProceeds: 10.00,
      realizedPnl: 4.72,
      outcome: 'WON',
      outcomeStatus: 'settled',
    };

    const htmlComplete = renderJournalPageHtml(null, 'free', [completeEntry as any]);
    assert.match(htmlComplete, /\+\$4\.72/);
    assert.match(htmlComplete, /10ct @ \$0\.51/);
  });

  it('Task 1: displays capital preserved and zero risk for skipped checks', () => {
    const skippedEntry = {
      id: 'jrn_skipped',
      userId: 'usr_1',
      venue: 'kalshi-15m',
      contractTicker: 'KXBTC15M',
      contractType: 'binary_above_below',
      side: 'yes',
      pricingBasis: 'executable_ask',
      contractPrice: 0.51,
      contractCount: 10,
      purchaseCost: 5.10,
      exchangeFee: 0.18,
      halfSpreadDrag: 0.0,
      totalDrag: 0.018,
      breakevenWinProb: 52.80,
      assessedWinProb: 50.0,
      netExpectedValue: -0.28,
      settlementSource: 'CME CF BRTI 60s TWAP',
      decisionAction: 'skipped',
      status: 'saved_check',
      createdAt: '2026-10-06T12:00:00Z',
    };

    const html = renderJournalPageHtml(null, 'free', [skippedEntry as any]);
    assert.match(html, /SKIPPED/);
    assert.match(html, /\$0 Loss · Preserved/);
  });

  it('Task 2: renders Personal Review Screen with "Not enough information yet" when records are insufficient', () => {
    // Zero complete records
    const emptyHtml = renderReviewPageHtml(null, 'free', []);
    assert.match(emptyHtml, /Not enough information yet/);
    assert.match(emptyHtml, /Your personal review requires at least one completed outcome record/);
    assert.match(emptyHtml, /Run Pre-Trade Check &rarr;/);
  });

  it('Task 2: renders Personal Review Screen showing net results, total fees, and separate paper vs actual metrics', () => {
    const actualEntry = {
      id: 'jrn_act',
      userId: 'usr_1',
      venue: 'kalshi-15m',
      contractTicker: 'KXBTC15M',
      contractType: 'binary_above_below',
      side: 'yes',
      pricingBasis: 'executable_ask',
      contractPrice: 0.51,
      contractCount: 10,
      purchaseCost: 5.10,
      exchangeFee: 0.18,
      breakevenWinProb: 52.80,
      assessedWinProb: 55.0,
      netExpectedValue: 0.22,
      decisionAction: 'actual_trade',
      actualQuantity: 10,
      actualFillPrice: 0.51,
      actualFees: 0.18,
      exitProceeds: 10.00,
      realizedPnl: 4.72,
      outcome: 'WON',
      createdAt: '2026-10-06T12:00:00Z',
    };

    const paperEntry = {
      id: 'jrn_pap',
      userId: 'usr_1',
      venue: 'kalshi-15m',
      contractTicker: 'KXBTC15M',
      contractType: 'binary_above_below',
      side: 'yes',
      pricingBasis: 'executable_ask',
      contractPrice: 0.51,
      contractCount: 10,
      purchaseCost: 5.10,
      exchangeFee: 0.18,
      breakevenWinProb: 52.80,
      assessedWinProb: 55.0,
      netExpectedValue: 0.22,
      decisionAction: 'paper_trade',
      realizedPnl: -5.28,
      outcome: 'LOST',
      createdAt: '2026-10-06T13:00:00Z',
    };

    const skippedEntry = {
      id: 'jrn_skip',
      userId: 'usr_1',
      venue: 'kalshi-15m',
      contractTicker: 'KXBTC15M',
      contractType: 'binary_above_below',
      side: 'yes',
      pricingBasis: 'executable_ask',
      contractPrice: 0.51,
      contractCount: 10,
      purchaseCost: 5.10,
      exchangeFee: 0.18,
      breakevenWinProb: 52.80,
      assessedWinProb: 48.0,
      netExpectedValue: -0.48,
      decisionAction: 'skipped',
      createdAt: '2026-10-06T14:00:00Z',
    };

    const html = renderReviewPageHtml(null, 'free', [actualEntry as any, paperEntry as any, skippedEntry as any]);

    // Net results & fees
    assert.match(html, /Actual Realized Net P&amp;L/);
    assert.match(html, /\+\$4\.72/);
    assert.match(html, /Total Fees Recorded/);
    assert.match(html, /Capital Preserved \(Skipped\)/);
    assert.match(html, /\$5\.28/);

    // Paper vs Actual Outcomes separated
    assert.match(html, /Paper versus Actual Outcomes/);
    assert.match(html, /Actual Trades \(Live Capital\)/);
    assert.match(html, /Paper Trades \(\$0 Live Capital\)/);
    assert.match(html, /Rule B5/);
    assert.match(html, /Actual Trade Audit Trail/);
  });

  it('Task 3: renders consent-based beta booking page with required fields and informed consent', () => {
    const html = renderBetaBookingPageHtml();
    assert.match(html, /Request a 1-on-1 Usability Session/);
    assert.match(html, /15-Minute Usability Pilot Observation/);
    assert.match(html, /id="book-contact"/);
    assert.match(html, /id="book-device"/);
    assert.match(html, /id="book-availability"/);
    assert.match(html, /id="book-consent"/);
    assert.match(html, /Informed Consent/);
    assert.match(html, /Advances to: Interested/);
  });

  it('Task 3: founder observation dashboard distinguishes Interested -> Scheduled -> Observed with zero automatic claims', () => {
    const auditHtml = renderPilotAuditPageHtml({
      customerFunnel: {
        checks_completed: 0,
        signups: 0,
        checks_saved: 0,
        journal_views: 0,
        journal_exports: 0,
      },
      internalFunnel: {
        checks_completed: 0,
        signups: 0,
        checks_saved: 0,
        journal_views: 0,
        journal_exports: 0,
      },
      recentJournalEntries: [],
      recordedSessions: [],
      bookingRequests: [
        {
          id: 'b_1',
          contact: 'alex@example.com',
          deviceType: 'iPhone (iOS Safari)',
          availability: 'Weekday mornings',
          status: 'INTERESTED',
          createdAt: '2026-10-06T10:00:00Z',
        },
        {
          id: 'b_2',
          contact: 'sam@example.com',
          deviceType: 'Mac (Safari)',
          availability: 'Weekday evenings',
          status: 'SCHEDULED',
          scheduledAt: '2026-10-07 18:00 UTC',
          createdAt: '2026-10-06T11:00:00Z',
        }
      ],
    });

    assert.match(auditHtml, /Pilot Participant Pipeline/);
    assert.match(auditHtml, /Zero automatic completion claims/i);
    assert.match(auditHtml, /1\. Interested/);
    assert.match(auditHtml, /2\. Scheduled/);
    assert.match(auditHtml, /3\. Observed/);
    assert.match(auditHtml, /alex@example\.com/);
    assert.match(auditHtml, /sam@example\.com/);
    assert.match(auditHtml, /Schedule &rarr;/);
    assert.match(auditHtml, /Log Observation &rarr;/);
  });

  it('Feature Flags: keeps existing calculator and signup flows stable', () => {
    const flags = getFeatureFlags();
    assert.equal(flags.outcomeTracking, true);
    assert.equal(flags.personalReview, true);
    assert.equal(flags.betaBooking, true);
  });
});
