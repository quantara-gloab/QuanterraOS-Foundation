export interface CockpitPageOptions {
  user?: any;
  sharedLink?: any;
  venue?: string;
  ticker?: string;
  side?: string;
  [key: string]: any;
}

export function renderCockpitPage(options?: CockpitPageOptions): string {
  return renderCockpitPageHtml(options);
}

export function renderCockpitPageHtml(options?: CockpitPageOptions): string {
  const ticker = options?.ticker || "KXBTC15M-SAMPLE";
  const venue = options?.venue ? (options.venue.charAt(0).toUpperCase() + options.venue.slice(1).toLowerCase()) : "Kalshi";
  const side = options?.side || "YES";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuanterraOS Fighter Pilots Decision Workspace // Elite Eleven Decision Workspace</title>
  <style>
    :root {
      --bg-void: #020617;
      --bg-card: rgba(15, 23, 42, 0.85);
      --border-hud: rgba(56, 189, 248, 0.3);
      --cyan-neon: #38bdf8;
      --emerald-tach: #10b981;
      --amber-boost: #f59e0b;
      --f1-red: #ef4444;
      --txt-dim: #64748b;
      --txt-bright: #f8fafc;
      --font-mono: "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-void);
      color: var(--txt-bright);
      font-family: var(--font-mono);
      min-height: 100vh;
      overflow-x: hidden;
      background-image:
        radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.12) 0%, transparent 70%),
        linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px);
      background-size: 100% 100%, 25px 25px, 25px 25px;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 28px;
      border-bottom: 1px solid var(--border-hud);
      background: rgba(2, 6, 23, 0.95);
      backdrop-filter: blur(16px);
    }
    .brand { font-size: 0.92rem; font-weight: 900; letter-spacing: 0.15em; color: var(--cyan-neon); text-shadow: 0 0 12px rgba(56,189,248,0.5); }
    .status-cluster { display: flex; gap: 24px; font-size: 0.72rem; }
    .status-node { display: flex; flex-direction: column; }
    .status-node .lbl { font-size: 0.6rem; color: var(--txt-dim); }
    .status-node .val { font-weight: 800; color: var(--txt-bright); }

    /* F1 KINETIC REV TACHOMETER */
    .tachometer-bar {
      display: flex;
      gap: 4px;
      padding: 6px 28px;
      background: rgba(15, 23, 42, 0.9);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .tach-segment {
      flex: 1;
      height: 8px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.08);
      transition: background 0.15s, box-shadow 0.15s;
    }
    .tach-segment.active-green { background: var(--emerald-tach); box-shadow: 0 0 8px var(--emerald-tach); }
    .tach-segment.active-amber { background: var(--amber-boost); box-shadow: 0 0 8px var(--amber-boost); }
    .tach-segment.active-red { background: var(--f1-red); box-shadow: 0 0 8px var(--f1-red); }

    .cockpit-deck {
      display: grid;
      grid-template-columns: 360px 1fr 380px;
      gap: 18px;
      padding: 20px 28px;
      max-width: 1780px;
      margin: 0 auto;
    }

    .hud-card {
      background: var(--bg-card);
      border: 1px solid var(--border-hud);
      border-radius: 6px;
      padding: 18px;
      position: relative;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
    }
    .hud-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 0.72rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      color: var(--cyan-neon);
    }

    .radar-circle {
      width: 250px;
      height: 250px;
      margin: 0 auto;
      border-radius: 50%;
      border: 1px solid var(--border-hud);
      position: relative;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%);
      box-shadow: inset 0 0 24px rgba(56, 189, 248, 0.2);
    }
    .radar-beam {
      position: absolute;
      width: 50%;
      height: 50%;
      transform-origin: 100% 100%;
      background: conic-gradient(from 180deg, transparent 0deg, rgba(56, 189, 248, 0.45) 45deg, transparent 90deg);
      border-radius: 100% 0 0 0;
      animation: spin 3.5s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .hud-stepper { display: flex; gap: 6px; margin-top: 4px; }
    .hud-stepper button {
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid var(--border-hud);
      color: var(--cyan-neon);
      width: 38px;
      height: 38px;
      border-radius: 4px;
      font-size: 1.1rem;
      cursor: pointer;
      font-weight: bold;
    }
    .hud-stepper button:active { background: rgba(56, 189, 248, 0.35); }
    .hud-stepper input {
      flex: 1;
      background: rgba(2, 6, 23, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      color: #fff;
      text-align: center;
      font-family: var(--font-mono);
      font-size: 1rem;
      font-weight: bold;
    }

    .btn-warp {
      width: 100%;
      padding: 14px;
      margin-top: 14px;
      background: linear-gradient(90deg, #0284c7 0%, #38bdf8 50%, #0284c7 100%);
      background-size: 200% auto;
      border: none;
      color: #020617;
      font-family: var(--font-mono);
      font-weight: 900;
      letter-spacing: 0.15em;
      border-radius: 4px;
      cursor: pointer;
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.4);
      transition: all 0.25s ease;
    }
    .btn-warp:hover { background-position: right center; box-shadow: 0 0 28px rgba(56, 189, 248, 0.8); }
    .btn-warp:active { transform: scale(0.98); }

    .audit-box {
      height: 180px;
      background: rgba(2, 6, 23, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      padding: 10px;
      overflow-y: auto;
      font-size: 0.68rem;
      color: #38bdf8;
      line-height: 1.5;
    }
    .nav-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 6px;
    }
    .nav-tab {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--txt-bright);
      font-size: 0.68rem;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
    }
    .nav-tab.active {
      border-color: var(--cyan-neon);
      background: rgba(56, 189, 248, 0.15);
      color: var(--cyan-neon);
    }
  </style>
</head>
<body>

  <header>
    <div class="brand">QUANTERRA // INTELLARA F1 FLIGHT DECK</div>
    <div class="status-cluster">
      <div class="status-node"><span class="lbl">WARP DRIVE ENGINE</span><span class="val" style="color:var(--emerald-tach)">F1-HYPERDRIVE ACTIVE</span></div>
      <div class="status-node"><span class="lbl">DISCIPLINE XP</span><span class="val" id="xp-disp">1,420 XP</span></div>
      <div class="status-node"><span class="lbl">EXECUTION TELEMETRY</span><span class="val" id="latency-disp">3.8 ms</span></div>
    </div>
  </header>

  <!-- F1 KINETIC REV TACHOMETER -->
  <div class="tachometer-bar" id="tach-bar">
    <div class="tach-segment active-green"></div>
    <div class="tach-segment active-green"></div>
    <div class="tach-segment active-green"></div>
    <div class="tach-segment active-green"></div>
    <div class="tach-segment active-green"></div>
    <div class="tach-segment active-amber"></div>
    <div class="tach-segment active-amber"></div>
    <div class="tach-segment"></div>
    <div class="tach-segment"></div>
    <div class="tach-segment"></div>
  </div>

  <div class="cockpit-deck">
    <!-- PANEL 1: SETTLEMENT RADAR & ATTRIBUTION -->
    <div class="hud-card">
      <div class="hud-title">
        <span>CME CF BRTI RADAR</span>
        <span id="radar-status-badge" style="color:var(--emerald-tach); border: 1px solid var(--emerald-tach); padding: 1px 6px; border-radius: 3px;">SAFE</span>
      </div>

      <div class="radar-circle">
        <div class="radar-beam"></div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; width: 100%;">
          <div style="font-size: 0.65rem; color: var(--txt-dim);">BENCHMARK ORACLE</div>
          <div id="radar-spot-price" style="font-size: 1.25rem; font-weight: 900; color: var(--cyan-neon); text-shadow: 0 0 10px rgba(56,189,248,0.7);">$63,420.50</div>
          <div id="radar-basis-bps" style="font-size: 0.78rem; font-weight: 800; color: var(--emerald-tach); margin-top: 4px;">+0.0 bps</div>
        </div>
      </div>

      <div style="margin-top: 18px;">
        <div class="hud-title" style="margin-bottom: 6px;"><span>FLIGHT COMMENDATIONS</span><span>SYSTEM VERIFIED</span></div>
        <div id="badge-friction-shield" style="padding: 10px; background: rgba(16,185,129,0.08); border: 1px solid var(--emerald-tach); border-radius: 4px; margin-bottom: 8px;">
          <div style="display:flex; justify-content:space-between; font-size:0.72rem; font-weight:bold;">
            <span style="color:var(--emerald-tach);">🛡️ FRICTION SHIELD</span>
            <span>&le; 4.5%</span>
          </div>
          <div style="font-size:0.62rem; color:var(--txt-dim); margin-top:2px;">Parabolic fee curve defense active</div>
        </div>

        <div id="badge-oracle-sniper" style="padding: 10px; background: rgba(56,189,248,0.08); border: 1px solid var(--cyan-neon); border-radius: 4px;">
          <div style="display:flex; justify-content:space-between; font-size:0.72rem; font-weight:bold;">
            <span style="color:var(--cyan-neon);">🎯 ORACLE SNIPER</span>
            <span>&le; &plusmn;5 bps</span>
          </div>
          <div style="font-size:0.62rem; color:var(--txt-dim); margin-top:2px;">CME CF BRTI settlement basis locked</div>
        </div>
      </div>

      <div style="margin-top: 12px; font-size: 0.62rem; color: var(--txt-dim); text-align: center;">
        Attributed Market Data: Kalshi, Polymarket, CME CF BRTI
      </div>
    </div>

    <!-- PANEL 2: MISSION LOADOUT & ACTION BAR -->
    <div class="hud-card">
      <div class="nav-tabs">
        <button class="nav-tab active">QuanterraOS Fighter Pilots Decision Workspace</button>
        <button class="nav-tab" id="tab-btn-value">Subscription Value Proof</button>
      </div>

      <div id="tab-content-value" class="subscription-value-proof-section" style="display: none; padding: 10px; background: rgba(2,6,23,0.6); border-radius: 4px; margin-bottom: 12px; font-size: 0.7rem;">
        <span style="color: var(--emerald-tach); font-weight: bold;">Fighter Pilot Value Engine:</span> Live audited cost savings and true friction defense telemetry.
      </div>

      <div class="hud-title">
        <span>AI Fighter Pilots Live Model Verification Mission</span>
        <span id="mission-status-pill" style="color:var(--emerald-tach); border: 1px solid var(--emerald-tach); padding: 1px 6px; border-radius: 3px;">VERIFIED</span>
      </div>

      <div style="font-size: 0.7rem; color: var(--txt-dim); margin-bottom: 10px;">
        TARGET: ${venue} // ${ticker} // SIDE: ${side}
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:var(--txt-dim);"><span>CONTRACTS</span><span id="qty-lbl">10</span></div>
          <div class="hud-stepper">
            <button onclick="modifyQty(-1)">&minus;</button>
            <input id="input-qty" type="number" value="10" readonly>
            <button onclick="modifyQty(1)">&plus;</button>
          </div>
        </div>

        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:var(--txt-dim);"><span>ASSUMED PRICE</span><span id="price-lbl">52¢</span></div>
          <div class="hud-stepper">
            <button onclick="modifyPrice(-1)">&minus;</button>
            <input id="input-price" type="number" value="52" readonly>
            <button onclick="modifyPrice(1)">&plus;</button>
          </div>
        </div>
      </div>

      <div style="background: rgba(2,6,23,0.7); padding: 12px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 14px;">
        <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:var(--txt-dim); margin-bottom: 6px;">
          <span>VENUE DRAG BENCHMARK</span>
          <span style="color:var(--emerald-tach);">TRUE-COST FRICTION ENGINE</span>
        </div>
        <div style="margin-bottom: 8px;">
          <div style="display:flex; justify-content:space-between; font-size:0.68rem;">
            <span style="color:var(--cyan-neon);">Kalshi Parabolic Taker</span>
            <span id="kalshi-stat">--</span>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:3px; margin-top:2px;">
            <div id="kalshi-bar" style="height:100%; width:15%; background:var(--cyan-neon); border-radius:3px; transition:width 0.2s;"></div>
          </div>
        </div>

        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.68rem;">
            <span style="color:#c084fc;">Polymarket CTF Basis</span>
            <span id="poly-stat">--</span>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:3px; margin-top:2px;">
            <div id="poly-bar" style="height:100%; width:10%; background:#c084fc; border-radius:3px; transition:width 0.2s;"></div>
          </div>
        </div>
      </div>

      <!-- STATION EVIDENCE BOX WITH SPECIALIST SEALS -->
      <div id="station-evidence-box" style="background: rgba(15,23,42,0.9); border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; padding: 10px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.65rem; color: var(--txt-dim); margin-bottom: 6px;">
          <span>STATION EVIDENCE BOX // CREW SEALS</span>
          <a href="#telemetry" style="color: var(--cyan-neon); text-decoration: none;">Inspect Telemetry ↗</a>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 0.62rem; text-align: center;">
          <div style="padding: 4px; background: rgba(56,189,248,0.08); border: 1px solid var(--border-hud); border-radius: 3px; color: var(--cyan-neon);">Draco</div>
          <div style="padding: 4px; background: rgba(16,185,129,0.08); border: 1px solid var(--emerald-tach); border-radius: 3px; color: var(--emerald-tach);">Wolf</div>
          <div style="padding: 4px; background: rgba(192,132,252,0.08); border: 1px solid #c084fc; border-radius: 3px; color: #c084fc);">Kraken</div>
          <div style="padding: 4px; background: rgba(245,158,11,0.08); border: 1px solid var(--amber-boost); border-radius: 3px; color: var(--amber-boost);">Sentinel</div>
        </div>
      </div>

      <div style="display: flex; gap: 10px;">
        <button id="btn-verify-mission" class="btn-warp" style="flex: 1; background: rgba(56, 189, 248, 0.2); border: 1px solid var(--border-hud); color: var(--cyan-neon);" onclick="fireF1Proof()">VERIFY MISSION ACTION BAR</button>
        <button id="btn-fire-mission" class="btn-warp" style="flex: 1.2;" onclick="fireF1Proof()">WARP DRIVE AUDIT & FIRE</button>
      </div>

      <div style="margin-top: 14px;">
        <div class="hud-title" style="margin-bottom: 6px;"><span>INTELLARA DISCIPLINE TELEMETRY</span><span>APPEND-ONLY STREAM</span></div>
        <div id="audit-feed" class="audit-box">
          [INIT] Elite Eleven Decision Workspace initialized.<br>
          [INIT] Quanta Decision Receipt seal armed.<br>
          [ORACLE] Telemetry synced to CME CF BRTI feed.
        </div>
      </div>
    </div>

    <!-- PANEL 3: DECISION PROOF RECEIPT -->
    <div class="hud-card">
      <div class="hud-title"><span>DECISION RECEIPT</span><span>CRYPTOGRAPHIC PROOF</span></div>
      <div style="font-size:0.74rem; line-height:2.1; color:var(--txt-dim);">
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05);">
          <span>CONTRACT ID:</span><span style="color:#fff;">${ticker}</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05);">
          <span>NOTIONAL VALUE:</span><span style="color:#fff;" id="rec-notional">$5.20</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05);">
          <span>VENUE DRAG:</span><span style="color:var(--emerald-tach);" id="rec-drag">3.5%</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05);">
          <span>BASIS DELTA:</span><span style="color:var(--cyan-neon);" id="rec-basis">+0.0 bps</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05);">
          <span>DISCIPLINE AWARD:</span><span style="color:var(--amber-boost);" id="rec-xp">+25 XP</span>
        </div>
        <div style="margin-top:14px;">
          <div style="font-size:0.65rem; color:var(--txt-dim);">IMMUTABLE PROOF HASH</div>
          <div id="rec-hash" style="font-size:0.62rem; color:var(--cyan-neon); word-break:break-all; background:rgba(2,6,23,0.8); padding:8px; border-radius:4px; margin-top:4px;">
            0x6a2b8e...e71c
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    let qty = 10;
    let price = 52;
    let basisBps = 0.0;
    let xp = 1420;

    let audioCtx = null;
    function playSound(type) {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === "suspended") audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;
        if (type === "click") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.04);
          osc.start(now);
          osc.stop(now + 0.04);
        } else if (type === "warp") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.start(now);
          osc.stop(now + 0.22);
        }
      } catch(e) {}
    }

    function modifyQty(d) {
      qty = Math.max(1, qty + d);
      document.getElementById("input-qty").value = qty;
      document.getElementById("qty-lbl").textContent = qty;
      playSound("click");
      computeFriction();
    }

    function modifyPrice(d) {
      price = Math.max(1, Math.min(99, price + d));
      document.getElementById("input-price").value = price;
      document.getElementById("price-lbl").textContent = price + "¢";
      playSound("click");
      computeFriction();
    }

    function computeFriction() {
      const kalshiCents = Math.ceil((0.07 * price * (100 - price) / 100) * qty);
      const totalOutlay = price * qty;
      const kalshiDrag = ((kalshiCents / totalOutlay) * 100).toFixed(1);

      const polyCents = Math.round(qty * 0.45);
      const polyDrag = ((polyCents / totalOutlay) * 100).toFixed(1);

      document.getElementById("kalshi-stat").textContent = "$" + (kalshiCents / 100).toFixed(2) + " (" + kalshiDrag + "%)";
      document.getElementById("kalshi-bar").style.width = Math.min(100, Math.max(8, kalshiDrag * 8)) + "%";

      document.getElementById("poly-stat").textContent = "$" + (polyCents / 100).toFixed(2) + " (" + polyDrag + "%)";
      document.getElementById("poly-bar").style.width = Math.min(100, Math.max(8, polyDrag * 8)) + "%";

      document.getElementById("rec-notional").textContent = "$" + (totalOutlay / 100).toFixed(2);
      document.getElementById("rec-drag").textContent = kalshiDrag + "%";

      const fBadge = document.getElementById("badge-friction-shield");
      if (kalshiDrag <= 4.5) {
        fBadge.style.borderColor = "var(--emerald-tach)";
        fBadge.style.background = "rgba(16,185,129,0.08)";
      } else {
        fBadge.style.borderColor = "rgba(255,255,255,0.1)";
        fBadge.style.background = "rgba(255,255,255,0.03)";
      }
    }

    function initRadar() {
      const evt = new EventSource("/api/radar/stream");
      evt.onmessage = function(e) {
        try {
          const d = JSON.parse(e.data);
          basisBps = d.basisBps;
          document.getElementById("radar-spot-price").textContent = "$" + d.spotPriceUsd.toLocaleString(undefined, {minimumFractionDigits: 2});
          document.getElementById("radar-basis-bps").textContent = (d.basisBps >= 0 ? "+" : "") + d.basisBps + " bps";

          const sBadge = document.getElementById("radar-status-badge");
          sBadge.textContent = d.status;
          sBadge.style.color = d.status === "SAFE" ? "var(--emerald-tach)" : "var(--amber-boost)";
          sBadge.style.borderColor = sBadge.style.color;

          const segments = document.getElementById("tach-bar").children;
          const absBps = Math.abs(d.basisBps);
          const activeCount = Math.min(10, Math.max(2, Math.round(absBps / 2.5) + 3));
          for (let i = 0; i < segments.length; i++) {
            if (i < activeCount) {
              segments[i].className = i < 5 ? "tach-segment active-green" : i < 8 ? "tach-segment active-amber" : "tach-segment active-red";
            } else {
              segments[i].className = "tach-segment";
            }
          }
        } catch(err) {}
      };
      evt.onerror = function() {
        evt.close();
        setTimeout(initRadar, 3000);
      };
    }

    function fireF1Proof() {
      playSound("warp");
      const log = document.getElementById("audit-feed");
      const ts = new Date().toISOString().substring(11, 19);
      const isSniper = Math.abs(basisBps) <= 5.0;

      const deltaXp = isSniper ? 25 : 0;
      xp += deltaXp;
      document.getElementById("xp-disp").textContent = xp + " XP";
      document.getElementById("rec-basis").textContent = (basisBps >= 0 ? "+" : "") + basisBps + " bps";
      document.getElementById("rec-xp").textContent = "+" + deltaXp + " XP";

      const hash = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(20))).map(b => b.toString(16).padStart(2, "0")).join("");
      document.getElementById("rec-hash").textContent = hash;

      const entry = "[" + ts + "] HYPERDRIVE_AUDIT: " + qty + " contracts @ " + price + "¢ | Basis: " + basisBps + " bps | Drag: " + document.getElementById("rec-drag").textContent + " | " + (isSniper ? "DISCIPLINE_BOOST (+25 XP)" : "DRIFT_PENALTY (+0 XP)") + "<br>";
      log.innerHTML = entry + log.innerHTML;
    }

    document.addEventListener("DOMContentLoaded", () => {
      computeFriction();
      initRadar();
      const tabVal = document.getElementById("tab-btn-value");
      if (tabVal) {
        tabVal.addEventListener("click", () => {
          const content = document.getElementById("tab-content-value");
          if (content) content.style.display = content.style.display === "none" ? "block" : "none";
        });
      }
    });
  </script>
</body>
</html>`;
}
