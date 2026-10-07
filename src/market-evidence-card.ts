/**
 * QuanterraOS Market Evidence Card Component
 *
 * Provides a standardized, auditable decision card for short-duration prediction contracts.
 * Summarizes:
 * - Contract specifications & horizon
 * - Settlement oracle (CME CF BRTI 60s TWAP)
 * - Taker fee formula & IEEE 754 precision round-up
 * - Empirical calibration from 1,316 settled windows
 * - 1-Click action to evaluate in calculator or commit to journal
 */

export interface MarketEvidenceCardOptions {
  ticker?: string;
  venue?: "kalshi-15m" | "kalshi-1h" | "polymarket-15m";
  strikePrice?: number;
  currentAsk?: number;
  assessedProb?: number;
  contractCount?: number;
  compact?: boolean;
}

export function renderMarketEvidenceCardHtml(opts: MarketEvidenceCardOptions = {}): string {
  const ticker = opts.ticker || "KXBTC15M";
  const venue = opts.venue || "kalshi-15m";
  const askPrice = opts.currentAsk !== undefined ? opts.currentAsk : 0.51;
  const count = opts.contractCount || 10;
  const assessedProb = opts.assessedProb !== undefined ? opts.assessedProb : 55.0;

  const isKalshi = venue.startsWith("kalshi");
  const oracle = isKalshi ? "CME CF Bitcoin Real-Time Index (BRTI 60s TWAP)" : "Chainlink / Binance Settlement";
  const horizon = venue === "kalshi-1h" ? "1-Hour Fixed Strike" : "15-Minute Intraday Above/Below";
  
  // Reconciled fee calculation
  const rawFeeUsd = 0.07 * count * askPrice * (1 - askPrice);
  const totalFeeUsd = Math.ceil(Number((rawFeeUsd * 100).toFixed(6))) / 100;
  const feePerContractUsd = totalFeeUsd / count;
  const breakevenPct = Number(((askPrice + feePerContractUsd) * 100).toFixed(2));
  const purchaseCostUsd = Number((askPrice * count).toFixed(2));

  return `
    <div class="market-evidence-card" style="
      background: linear-gradient(180deg, rgba(14, 18, 27, 0.95) 0%, rgba(9, 11, 17, 0.98) 100%);
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
      font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, sans-serif);
      color: #F8FAFC;
    ">
      <!-- Card Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; border-bottom:1px solid rgba(212, 175, 55, 0.12); padding-bottom:12px;">
        <div>
          <div style="font-family:var(--font-mono, monospace); font-size:0.7rem; color:#DFB843; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px;">
            VERIFIED CONTRACT EVIDENCE CARD
          </div>
          <div style="font-size:1.15rem; font-weight:700; color:#FFFFFF;">
            ${ticker} <span style="font-size:0.8rem; font-weight:500; color:#94A3B8;">· ${horizon}</span>
          </div>
        </div>
        <span style="font-family:var(--font-mono, monospace); font-size:0.72rem; padding:3px 8px; border-radius:3px; background:rgba(223, 184, 67, 0.1); border:1px solid rgba(223, 184, 67, 0.3); color:#DFB843;">
          ${isKalshi ? "CFTC REGULATED" : "DECENTRALIZED"}
        </span>
      </div>

      <!-- Grid of Specifications -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:16px;">
        <div style="background:rgba(6, 9, 14, 0.7); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:10px;">
          <div style="font-size:0.68rem; color:#64748B; font-family:var(--font-mono, monospace); text-transform:uppercase;">Executable Ask</div>
          <div style="font-family:var(--font-mono, monospace); font-size:1.1rem; font-weight:700; color:#DFB843; margin-top:2px;">
            ${(askPrice * 100).toFixed(0)}¢ <span style="font-size:0.75rem; color:#94A3B8;">($${askPrice.toFixed(2)})</span>
          </div>
        </div>
        <div style="background:rgba(6, 9, 14, 0.7); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:10px;">
          <div style="font-size:0.68rem; color:#64748B; font-family:var(--font-mono, monospace); text-transform:uppercase;">Order Taker Fee</div>
          <div style="font-family:var(--font-mono, monospace); font-size:1.1rem; font-weight:700; color:#F43F5E; margin-top:2px;">
            $${totalFeeUsd.toFixed(2)} <span style="font-size:0.75rem; color:#94A3B8;">($${feePerContractUsd.toFixed(3)}/ct)</span>
          </div>
        </div>
        <div style="background:rgba(6, 9, 14, 0.7); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:10px;">
          <div style="font-size:0.68rem; color:#64748B; font-family:var(--font-mono, monospace); text-transform:uppercase;">Required Breakeven</div>
          <div style="font-family:var(--font-mono, monospace); font-size:1.1rem; font-weight:700; color:#10B981; margin-top:2px;">
            ${breakevenPct.toFixed(2)}%
          </div>
        </div>
        <div style="background:rgba(6, 9, 14, 0.7); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:10px;">
          <div style="font-size:0.68rem; color:#64748B; font-family:var(--font-mono, monospace); text-transform:uppercase;">Max Dollar Loss</div>
          <div style="font-family:var(--font-mono, monospace); font-size:1.1rem; font-weight:700; color:#FFFFFF; margin-top:2px;">
            $${(purchaseCostUsd + totalFeeUsd).toFixed(2)}
          </div>
        </div>
      </div>

      <!-- Empirical Calibration Reference -->
      <div style="background:rgba(223, 184, 67, 0.04); border-left:3px solid #DFB843; padding:10px 14px; font-size:0.78rem; color:#94A3B8; margin-bottom:16px; border-radius:0 4px 4px 0;">
        <strong style="color:#FFFFFF;">Empirical Calibration Benchmark (N = 1,316 settled windows):</strong><br>
        Contracts in the 45¢–55¢ band resolve YES at <strong>50.8%</strong> (Wilson 95% CI: 48.1%–53.5%). The market Brier score of 0.2001 reflects strong aggregation. At an ask of ${(askPrice * 100).toFixed(0)}¢, your required breakeven is <strong>${breakevenPct.toFixed(2)}%</strong>.
      </div>

      <!-- Settlement Oracle Row -->
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#64748B; margin-bottom:16px; border-top:1px solid rgba(255,255,255,0.06); padding-top:10px;">
        <span>Settlement Oracle:</span>
        <span style="font-family:var(--font-mono, monospace); color:#FFFFFF;">${oracle}</span>
      </div>

      <!-- Action Row -->
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <a href="/calculator" style="
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 14px;
          border-radius: 4px;
          background: linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%);
          color: #07080B;
          font-weight: 700;
          font-size: 0.8rem;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
        ">
          Evaluate in Calculator &rarr;
        </a>
        <a href="/journal" style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          color: #F8FAFC;
          font-size: 0.8rem;
          text-decoration: none;
        ">
          View Decision Journal
        </a>
      </div>
    </div>
  `;
}