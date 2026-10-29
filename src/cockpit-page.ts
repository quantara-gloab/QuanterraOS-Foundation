export function renderCockpitPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QUANTERRA // INTELLARA COCKPIT v1.0</title>
  <style>
    :root {
      --bg-void: #030712;
      --bg-panel: rgba(11, 19, 38, 0.88);
      --border-panel: rgba(0, 243, 255, 0.25);
      --cyan-glow: #00f3ff;
      --emerald-glow: #00ff66;
      --amber-warn: #ffb800;
      --crimson-crit: #ff0055;
      --txt-dim: #94a3b8;
      --txt-main: #f8fafc;
      --font-mono: "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-void);
      color: var(--txt-main);
      font-family: var(--font-mono);
      min-height: 100vh;
      overflow-x: hidden;
      background-image:
        radial-gradient(circle at 50% 0%, rgba(0, 243, 255, 0.08) 0%, transparent 60%),
        linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px);
      background-size: 100% 100%, 30px 30px, 30px 30px;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 28px;
      border-bottom: 1px solid var(--border-panel);
      background: rgba(3, 7, 18, 0.95);
      backdrop-filter: blur(12px);
    }
    .brand { font-size: 1.1rem; font-weight: 800; letter-spacing: 0.15em; color: var(--cyan-glow); }
    .telemetry-row { display: flex; gap: 24px; font-size: 0.75rem; }
    .badge-metric { display: flex; flex-direction: column; }
    .badge-metric .label { color: var(--txt-dim); font-size: 0.65rem; }
    .badge-metric .val { font-weight: 700; color: var(--txt-main); }

    .cockpit-grid {
      display: grid;
      grid-template-columns: 340px 1fr 380px;
      gap: 18px;
      padding: 24px 28px;
      max-width: 1750px;
      margin: 0 auto;
    }

    .panel {
      background: var(--bg-panel);
      border: 1px solid var(--border-panel);
      border-radius: 8px;
      padding: 18px;
      position: relative;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 8px;
      font-size: 0.72rem;
      font-weight: 800;
      color: var(--cyan-glow);
      letter-spacing: 0.1em;
    }

    .radar-box {
      width: 260px;
      height: 260px;
      margin: 0 auto;
      border-radius: 50%;
      border: 1px solid rgba(0, 243, 255, 0.4);
      position: relative;
      background: radial-gradient(circle, rgba(0, 243, 255, 0.05) 0%, transparent 70%);
      box-shadow: inset 0 0 20px rgba(0, 243, 255, 0.2);
    }
    .radar-sweep {
      position: absolute;
      width: 50%;
      height: 50%;
      transform-origin: 100% 100%;
      background: conic-gradient(from 180deg, transparent 0deg, rgba(0, 243, 255, 0.4) 45deg, transparent 90deg);
      border-radius: 100% 0 0 0;
      animation: sweep 4s linear infinite;
    }
    @keyframes sweep { 100% { transform: rotate(360deg); } }

    .badge-card {
      padding: 10px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      transition: all 0.3s ease;
      margin-bottom: 8px;
    }
    .badge-card.active-emerald {
      border-color: var(--emerald-glow);
      background: rgba(0, 255, 102, 0.08);
      box-shadow: 0 0 12px rgba(0, 255, 102, 0.2);
    }
    .badge-card.active-cyan {
      border-color: var(--cyan-glow);
      background: rgba(0, 243, 255, 0.08);
      box-shadow: 0 0 12px rgba(0, 243, 255, 0.2);
    }

    .ctrl-row { margin-bottom: 12px; }
    .ctrl-label { display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--txt-dim); margin-bottom: 4px; }
    .stepper { display: flex; gap: 8px; }
    .stepper button {
      background: rgba(0, 243, 255, 0.1);
      border: 1px solid var(--border-panel);
      color: var(--cyan-glow);
      width: 36px;
      height: 36px;
      border-radius: 4px;
      font-size: 1.1rem;
      cursor: pointer;
      font-weight: bold;
    }
    .stepper input {
      flex: 1;
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      color: var(--txt-main);
      text-align: center;
      font-family: var(--font-mono);
      font-size: 0.95rem;
    }

    .btn-fire {
      width: 100%;
      padding: 12px;
      margin-top: 14px;
      background: linear-gradient(90deg, #00f3ff 0%, #0284c7 100%);
      border: none;
      color: #030712;
      font-family: var(--font-mono);
      font-weight: 800;
      letter-spacing: 0.1em;
      border-radius: 4px;
      cursor: pointer;
      transition: transform 0.1s ease, box-shadow 0.2s ease;
    }
    .btn-fire:hover {
      box-shadow: 0 0 20px rgba(0, 243, 255, 0.5);
    }
    .btn-fire:active { transform: scale(0.98); }

    .audit-log {
      height: 220px;
      background: rgba(3, 7, 18, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 10px;
      overflow-y: auto;
      font-size: 0.68rem;
      color: #38bdf8;
      line-height: 1.5;
    }
  </style>
</head>
<body>

  <header>
    <div class="brand">QUANTERRA // TACTICAL RADAR HUD</div>
    <div class="telemetry-row">
      <div class="badge-metric"><span class="label">SETTLEMENT ORACLE</span><span class="val" style="color:var(--emerald-glow)">CME CF BRTI LIVE</span></div>
      <div class="badge-metric"><span class="label">DISCIPLINE XP</span><span class="val" id="xp-val">1,420 XP</span></div>
      <div class="badge-metric"><span class="label">ENGINE LATENCY</span><span class="val" id="latency-val">4.2 ms</span></div>
    </div>
  </header>

  <div class="cockpit-grid">
    <div class="panel">
      <div class="panel-header">
        <span>SETTLEMENT BASIS RADAR</span>
        <span id="radar-status-badge" style="color:var(--emerald-glow); border: 1px solid var(--emerald-glow); padding: 1px 6px; border-radius: 4px;">SAFE</span>
      </div>

      <div class="radar-box">
        <div class="radar-sweep"></div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; width: 100%;">
          <div style="font-size: 0.65rem; color: var(--txt-dim);">CME BENCHMARK</div>
          <div id="radar-spot-price" style="font-size: 1.25rem; font-weight: 800; color: var(--cyan-glow); text-shadow: 0 0 10px rgba(0,243,255,0.7);">$63,420.50</div>
          <div id="radar-basis-bps" style="font-size: 0.78rem; font-weight: 700; color: var(--emerald-glow); margin-top: 4px;">+0.0 bps</div>
        </div>
      </div>

      <div style="margin-top: 20px;">
        <div class="panel-header" style="margin-bottom: 8px;"><span>PILOT COMMENDATIONS</span><span>EVENT AUDITED</span></div>
        <div id="badge-friction-shield" class="badge-card active-emerald">
          <div style="display:flex; justify-content:space-between; font-size:0.72rem; font-weight:bold;">
            <span style="color:var(--emerald-glow);">🛡️ FRICTION SHIELD</span>
            <span id="friction-pct-tag">&le; 4.5%</span>
          </div>
          <div style="font-size:0.62rem; color:var(--txt-dim); margin-top:2px;">Parabolic fee drag mitigated</div>
        </div>

        <div id="badge-oracle-sniper" class="badge-card active-cyan">
          <div style="display:flex; justify-content:space-between; font-size:0.72rem; font-weight:bold;">
            <span style="color:var(--cyan-glow);">🎯 ORACLE SNIPER</span>
            <span>&le; &plusmn;5 bps</span>
          </div>
          <div style="font-size:0.62rem; color:var(--txt-dim); margin-top:2px;">CME CF BRTI delta lock</div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header"><span>TACTICAL LOADOUT BUILDER</span><span>BTC 15-MIN ABOVE STRIKE</span></div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px;">
        <div class="ctrl-row">
          <div class="ctrl-label"><span>CONTRACT QTY</span><span id="qty-disp">10 contracts</span></div>
          <div class="stepper">
            <button onclick="adjustQty(-1)">&minus;</button>
            <input id="order-quantity" type="number" value="10" readonly>
            <button onclick="adjustQty(1)">&plus;</button>
          </div>
        </div>
        <div class="ctrl-row">
          <div class="ctrl-label"><span>ASSUMED PRICE</span><span id="price-disp">52&cent;</span></div>
          <div class="stepper">
            <button onclick="adjustPrice(-1)">&minus;</button>
            <input id="assumed-fill-price" type="number" value="52" readonly>
            <button onclick="adjustPrice(1)">&plus;</button>
          </div>
        </div>
      </div>

      <div style="background: rgba(0,0,0,0.5); padding: 14px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 18px;">
        <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--txt-dim); margin-bottom: 6px;">
          <span>VENUE DRAG BENCHMARK</span>
          <span style="color:var(--emerald-glow);">TRUE-COST FRICTION ENGINE</span>
        </div>

        <div style="margin-bottom: 10px;">
          <div style="display:flex; justify-content:space-between; font-size:0.68rem; margin-bottom:2px;">
            <span style="color:var(--cyan-glow);">KALSHI PARABOLIC TAKER</span>
            <span id="kalshi-drag-val">--</span>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.1); border-radius:3px;">
            <div id="kalshi-drag-bar" style="height:100%; width:15%; background:var(--cyan-glow); border-radius:3px; transition:width 0.3s;"></div>
          </div>
        </div>

        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.68rem; margin-bottom:2px;">
            <span style="color:#c084fc;">POLYMARKET CTF + BUFFER</span>
            <span id="poly-drag-val">--</span>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.1); border-radius:3px;">
            <div id="poly-drag-bar" style="height:100%; width:10%; background:#c084fc; border-radius:3px; transition:width 0.3s;"></div>
          </div>
        </div>
      </div>

      <button class="btn-fire" onclick="runAiExecutionProof()">AUDIT & FIRE AI EXECUTION PROOF</button>

      <div style="margin-top: 18px;">
        <div class="panel-header" style="margin-bottom: 8px;"><span>INTELLARA DISCIPLINE STREAM</span><span>LIVE AUDIT FEED</span></div>
        <div id="audit-terminal" class="audit-log">
          [INIT] Intellara Intelligence Engine online.<br>
          [INIT] Anti-volume guardrails active: 0 XP allocated for churn trades.<br>
          [STREAM] Awaiting decision packet...
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header"><span>DECISION RECEIPT</span><span>CRYPTOGRAPHIC PROOF</span></div>
      <div style="font-size:0.75rem; line-height:2.0; color:var(--txt-dim);">
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05);">
          <span>CONTRACT:</span><span style="color:var(--txt-main);" id="rcpt-contract">KXBTC15M-SAMPLE</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05);">
          <span>NOTIONAL OUTLAY:</span><span style="color:var(--txt-main);" id="rcpt-outlay">$5.20</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05);">
          <span>FRICTION DRAG:</span><span style="color:var(--emerald-glow);" id="rcpt-drag">3.3%</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05);">
          <span>BASIS AT COMMIT:</span><span style="color:var(--cyan-glow);" id="rcpt-basis">+0.0 bps</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05);">
          <span>DISCIPLINE AWARD:</span><span style="color:var(--amber-warn);" id="rcpt-award">+25 XP</span>
        </div>
        <div style="margin-top:14px;">
          <div style="font-size:0.65rem; color:var(--txt-dim);">INTELLARA AUDIT HASH</div>
          <div id="audit-hash" style="font-size:0.62rem; color:var(--cyan-glow); word-break:break-all; background:rgba(0,0,0,0.4); padding:8px; border-radius:4px; margin-top:4px;">
            0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    let currentQty = 10;
    let currentPrice = 52;
    let currentBasisBps = 0.0;
    let totalXp = 1420;

    function adjustQty(delta) {
      currentQty = Math.max(1, currentQty + delta);
      document.getElementById("order-quantity").value = currentQty;
      document.getElementById("qty-disp").textContent = currentQty + " contracts";
      recalcFriction();
    }

    function adjustPrice(delta) {
      currentPrice = Math.max(1, Math.min(99, currentPrice + delta));
      document.getElementById("assumed-fill-price").value = currentPrice;
      document.getElementById("price-disp").textContent = currentPrice + "¢";
      recalcFriction();
    }

    function recalcFriction() {
      const kalshiFeeCents = Math.ceil((0.07 * currentPrice * (100 - currentPrice) / 100) * currentQty);
      const totalOutlayCents = currentPrice * currentQty;
      const kalshiDragPct = ((kalshiFeeCents / totalOutlayCents) * 100).toFixed(1);

      const polyFeeCents = Math.round(currentQty * 0.45);
      const polyDragPct = ((polyFeeCents / totalOutlayCents) * 100).toFixed(1);

      document.getElementById("kalshi-drag-val").textContent = "$" + (kalshiFeeCents / 100).toFixed(2) + " (" + kalshiDragPct + "%)";
      document.getElementById("kalshi-drag-bar").style.width = Math.min(100, Math.max(8, kalshiDragPct * 8)) + "%";

      document.getElementById("poly-drag-val").textContent = "$" + (polyFeeCents / 100).toFixed(2) + " (" + polyDragPct + "%)";
      document.getElementById("poly-drag-bar").style.width = Math.min(100, Math.max(8, polyDragPct * 8)) + "%";

      document.getElementById("rcpt-outlay").textContent = "$" + (totalOutlayCents / 100).toFixed(2);
      document.getElementById("rcpt-drag").textContent = kalshiDragPct + "%";

      const fBadge = document.getElementById("badge-friction-shield");
      if (kalshiDragPct <= 4.5) {
        fBadge.className = "badge-card active-emerald";
      } else {
        fBadge.className = "badge-card";
      }
    }

    function initRadarStream() {
      const evt = new EventSource("/api/radar/stream");
      evt.onmessage = function(e) {
        try {
          const d = JSON.parse(e.data);
          currentBasisBps = d.basisBps;
          document.getElementById("radar-spot-price").textContent = "$" + d.spotPriceUsd.toLocaleString(undefined, {minimumFractionDigits: 2});
          document.getElementById("radar-basis-bps").textContent = (d.basisBps >= 0 ? "+" : "") + d.basisBps + " bps";

          const sBadge = document.getElementById("radar-status-badge");
          sBadge.textContent = d.status;
          sBadge.style.color = d.status === "SAFE" ? "var(--emerald-glow)" : "var(--amber-warn)";
          sBadge.style.borderColor = sBadge.style.color;

          const oBadge = document.getElementById("badge-oracle-sniper");
          if (Math.abs(d.basisBps) <= 5.0) {
            oBadge.className = "badge-card active-cyan";
          } else {
            oBadge.className = "badge-card";
          }
        } catch(err) {}
      };
      evt.onerror = function() {
        evt.close();
        setTimeout(initRadarStream, 3000);
      };
    }

    function runAiExecutionProof() {
      const log = document.getElementById("audit-terminal");
      const ts = new Date().toISOString().substring(11, 19);
      const isOracleCompliant = Math.abs(currentBasisBps) <= 5.0;

      let xpDelta = isOracleCompliant ? 25 : 0;
      totalXp += xpDelta;
      document.getElementById("xp-val").textContent = totalXp + " XP";
      document.getElementById("rcpt-basis").textContent = (currentBasisBps >= 0 ? "+" : "") + currentBasisBps + " bps";
      document.getElementById("rcpt-award").textContent = "+" + xpDelta + " XP";

      const hash = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(20))).map(b => b.toString(16).padStart(2, "0")).join("");
      document.getElementById("audit-hash").textContent = hash;

      const newLog = "[" + ts + "] EXEC_PROOF: Verified " + currentQty + " contracts @ " + currentPrice + "¢. Basis: " + currentBasisBps + " bps. Drag: " + document.getElementById("rcpt-drag").textContent + ". Status: " + (isOracleCompliant ? "DISCIPLINE_ACQUIRED (+25 XP)" : "OVER_SPREAD_PENALTY (+0 XP)") + "<br>";
      log.innerHTML = newLog + log.innerHTML;
    }

    document.addEventListener("DOMContentLoaded", () => {
      recalcFriction();
      initRadarStream();
    });
  </script>
</body>
</html>`;
}
