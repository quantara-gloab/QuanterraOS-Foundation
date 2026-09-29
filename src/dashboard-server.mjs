import http from "node:http";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import { computeSpreadReport, latestQuotes, referenceSourceName } from "./spread-monitor.ts";

dotenv.config();

const port = Number(process.env.DASHBOARD_PORT ?? 3000);
const dbPath = process.env.DB_PATH ?? "quanterraos.db";
const maxMatchDifferenceMs = 5000;

const html = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BRTI Spread Monitor</title>
  <style>
    :root { color-scheme: dark; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #10151b; color: #e8edf2; }
    main { width: min(1100px, calc(100% - 32px)); margin: 0 auto; padding: 40px 0 56px; }
    header { display: flex; justify-content: space-between; gap: 24px; align-items: end; margin-bottom: 30px; }
    .controls { display: flex; align-items: center; gap: 10px; }
    select { background: #171e26; color: #e8edf2; border: 1px solid #2b3641; border-radius: 4px; padding: 8px 10px; font: inherit; }
    h1 { margin: 0; font: 700 clamp(1.5rem, 4vw, 2.4rem)/1.1 Georgia, serif; letter-spacing: 0; }
    .status { color: #91a1af; font-size: .78rem; }
    .quotes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
    .quote, .panel { border: 1px solid #2b3641; background: #171e26; border-radius: 6px; }
    .quote { padding: 20px; min-height: 132px; }
    .label { color: #91a1af; font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; }
    .value { display: block; margin-top: 18px; font-size: clamp(1.6rem, 4vw, 2.6rem); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .time { display: block; color: #71808e; font-size: .7rem; margin-top: 8px; }
    .panel { padding: 20px; }
    h2 { margin: 0 0 16px; font-size: 1rem; color: #c9d3dc; }
    .chart-wrap { margin-top: 24px; }
    canvas { display: block; width: 100%; height: 280px; background: #131a21; border: 1px solid #2b3641; border-radius: 4px; }
    .legend { display: flex; gap: 16px; color: #91a1af; font-size: .72rem; margin-top: 10px; }
    .legend span::before { content: ""; display: inline-block; width: 18px; height: 2px; margin: 0 6px 3px 0; background: currentColor; }
    .legend .coinbase { color: #f0b35c; }
    .legend .kraken { color: #62b7ff; }
    .legend .zero { color: #71808e; }
    .spreads { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
    .spread { padding: 16px; border-left: 4px solid #647484; background: #131a21; }
    .spread.correct { border-left-color: #42d392; }
    .spread.wrong { border-left-color: #f06b6b; }
    .spread-name { color: #91a1af; font-size: .8rem; }
    .spread-value { display: block; margin-top: 8px; font-size: 1.4rem; font-weight: 700; }
    .direction { color: #91a1af; font-size: .72rem; margin-top: 7px; }
    table { width: 100%; border-collapse: collapse; font-size: .82rem; }
    th, td { padding: 12px 8px; text-align: right; border-top: 1px solid #2b3641; }
    th:first-child, td:first-child { text-align: left; }
    th { color: #91a1af; font-size: .7rem; font-weight: 500; text-transform: uppercase; letter-spacing: .06em; }
    .empty { color: #91a1af; padding: 20px 0; }
    @media (max-width: 680px) { main { padding-top: 24px; } header { display: block; } .status { display: block; margin-top: 10px; } .quotes, .spreads { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <header><div><h1>Crypto Spread Monitor</h1><span class="status" id="status">Connecting...</span></div><div class="controls"><label for="asset">Asset</label><select id="asset"><option>BTC</option><option>ETH</option><option>SOL</option><option>XRP</option></select></div></header>
    <section class="quotes" id="quotes"></section>
    <section class="panel">
      <h2>Live spread</h2>
      <div class="spreads" id="spreads"></div>
      <h2>Rolling stats</h2>
      <div id="stats"><p class="empty">Loading...</p></div>
      <div class="chart-wrap">
        <h2>Spread history</h2>
        <canvas id="history-chart" width="1040" height="280" aria-label="Spread history chart"></canvas>
        <div class="legend"><span class="coinbase">Coinbase</span><span class="kraken">Kraken</span><span class="zero">Zero spread</span></div>
      </div>
    </section>
  </main>
  <script>
    const money = value => value == null ? "--" : "$" + Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const timestamp = value => value == null ? "No data" : new Date(Number(value)).toLocaleString();
    const esc = value => String(value).replace(/[&<>\"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
    function render(data) {
      const quotes = [
        ["Kalshi " + data.asset + " RTI", data.latest.brti],
        ["Coinbase", data.latest.coinbase],
        ["Kraken", data.latest.kraken]
      ];
      document.getElementById("quotes").innerHTML = quotes.map(([label, quote]) => "<article class=\"quote\"><span class=\"label\">" + label + "</span><strong class=\"value\">" + money(quote?.value) + "</strong><span class=\"time\">" + timestamp(quote?.timestamp) + "</span></article>").join("");
      document.getElementById("spreads").innerHTML = data.spreads.map(spread => "<article class=\"spread " + (spread.direction === "wrong" ? "wrong" : spread.direction === "correct" ? "correct" : "") + "\"><span class=\"spread-name\">" + esc(spread.exchange) + "</span><strong class=\"spread-value\">" + money(spread.spread) + "</strong><span class=\"direction\">" + (spread.direction === "wrong" ? "Wrong direction" : spread.direction === "correct" ? "Direction aligned" : "Direction unavailable") + "</span></article>").join("");
      document.getElementById("stats").innerHTML = "<table><thead><tr><th>Exchange</th><th>Average spread</th><th>Wrong direction</th><th>Samples</th></tr></thead><tbody>" + data.stats.map(stat => "<tr><td>" + esc(stat.exchange) + "</td><td>" + money(stat.averageSpread) + "</td><td>" + stat.wrongDirectionRate.toFixed(2) + "%</td><td>" + stat.samples + "</td></tr>").join("") + "</tbody></table>";
      document.getElementById("status").textContent = "Updated " + new Date().toLocaleTimeString() + " · " + data.stats.reduce((sum, stat) => sum + stat.samples, 0) + " matched samples";
    }
    function drawHistory(history) {
      const canvas = document.getElementById("history-chart");
      const context = canvas.getContext("2d");
      const width = canvas.clientWidth * window.devicePixelRatio;
      const height = canvas.clientHeight * window.devicePixelRatio;
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      if (!history.length) return;
      const padding = { top: 18, right: 18, bottom: 28, left: 58 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      const spreads = history.flatMap(point => [point.coinbase == null ? null : point.coinbase - point.brti, point.kraken == null ? null : point.kraken - point.brti]).filter(value => value != null);
      const maximum = Math.max(1, ...spreads.map(value => Math.abs(value)));
      const scaleY = value => padding.top + chartHeight / 2 - value / (maximum * 1.1) * (chartHeight / 2);
      const scaleX = index => padding.left + (history.length === 1 ? chartWidth / 2 : index / (history.length - 1) * chartWidth);
      context.font = (11 * window.devicePixelRatio) + "px ui-monospace, monospace";
      context.strokeStyle = "#33404c";
      context.lineWidth = window.devicePixelRatio;
      context.beginPath();
      context.moveTo(padding.left, scaleY(0));
      context.lineTo(width - padding.right, scaleY(0));
      context.stroke();
      context.fillStyle = "#71808e";
      context.fillText((maximum).toFixed(0), 8, scaleY(maximum) + 4);
      context.fillText("0", 38, scaleY(0) + 4);
      context.fillText((-maximum).toFixed(0), 4, scaleY(-maximum) + 4);
      context.fillText(new Date(history[0].timestamp).toLocaleTimeString(), padding.left, height - 8);
      const lastLabel = new Date(history[history.length - 1].timestamp).toLocaleTimeString();
      context.fillText(lastLabel, width - padding.right - context.measureText(lastLabel).width, height - 8);
      for (const [key, color] of [["coinbase", "#f0b35c"], ["kraken", "#62b7ff"]]) {
        context.strokeStyle = color;
        context.lineWidth = 2 * window.devicePixelRatio;
        context.beginPath();
        let started = false;
        history.forEach((point, index) => {
          const price = point[key];
          if (price == null) { started = false; return; }
          const x = scaleX(index);
          const y = scaleY(price - point.brti);
          if (!started) context.moveTo(x, y); else context.lineTo(x, y);
          started = true;
        });
        context.stroke();
      }
    }
    let currentAsset = "BTC";
    async function refresh() {
      try {
        const query = "?asset=" + encodeURIComponent(currentAsset);
        const responses = await Promise.all([fetch("/api/stats" + query), fetch("/api/history" + query)]);
        if (!responses[0].ok || !responses[1].ok) throw new Error("API request failed");
        render(await responses[0].json());
        drawHistory(await responses[1].json());
      }
      catch (error) { document.getElementById("status").textContent = "API unavailable: " + error.message; }
    }
    document.getElementById("asset").addEventListener("change", event => { currentAsset = event.target.value; refresh(); });
    refresh();
    setInterval(refresh, 5000);
  </script>
</body>
</html>`;

function readRows(asset = "BTC") {
  const sqlite = new Database(dbPath, { readonly: true });
  const brti = sqlite.prepare("SELECT received_at AS timestamp, CAST(raw_value AS REAL) AS value FROM btc_index_ticks WHERE raw_value IS NOT NULL AND asset = ? ORDER BY received_at").all(asset);
  const exchanges = sqlite.prepare("SELECT exchange_name AS exchange, fetched_at AS timestamp, price AS value FROM exchange_prices WHERE asset = ? ORDER BY fetched_at").all(asset);
  sqlite.close();
  return { brti, exchanges };
}

function nearestTick(ticks, timestamp) {
  if (ticks.length === 0) return null;
  return ticks.reduce((best, tick) => Math.abs(tick.timestamp - timestamp) < Math.abs(best.timestamp - timestamp) ? tick : best);
}

// Coinbase previously showed a near-coinflip wrong-direction rate because exchange-price-poller
// used the /v2/prices spot endpoint, which is stale ~85% of 5s polls; fixed by switching to the
// live Exchange ticker endpoint. Historical rows collected before that fix will still look noisy.
function computeStats(asset = "BTC") {
  const { brti, exchanges } = readRows(asset);
  const latest = {
    brti: brti.at(-1) ?? null,
    coinbase: [...exchanges].reverse().find(row => row.exchange === "coinbase") ?? null,
    kraken: [...exchanges].reverse().find(row => row.exchange === "kraken") ?? null,
  };
  const previousBrti = brti.at(-2);
  const spreads = [];
  const grouped = new Map();
  let previousByExchange = new Map();
  for (const row of exchanges) {
    const tick = nearestTick(brti, row.timestamp);
    if (!tick || Math.abs(tick.timestamp - row.timestamp) > maxMatchDifferenceMs) continue;
    const sample = { ...row, brti: tick.value, brtiTimestamp: tick.timestamp, spread: row.value - tick.value };
    const samples = grouped.get(row.exchange) ?? [];
    samples.push(sample);
    grouped.set(row.exchange, samples);
  }
  for (const [exchange, samples] of grouped) {
    let spreadTotal = 0;
    let wrongDirection = 0;
    let directionComparisons = 0;
    for (const sample of samples) {
      spreadTotal += sample.spread;
      const previous = previousByExchange.get(exchange);
      if (previous) {
        const brtiMove = Math.sign(sample.brti - previous.brti);
        const exchangeMove = Math.sign(sample.value - previous.value);
        if (brtiMove !== 0 && exchangeMove !== 0) {
          directionComparisons += 1;
          if (brtiMove !== exchangeMove) wrongDirection += 1;
        }
      }
      previousByExchange.set(exchange, sample);
    }
    const latestExchange = samples.at(-1);
    const previousExchange = samples.at(-2);
    let direction = "unknown";
    if (latestExchange && previousExchange && previousBrti) {
      const brtiMove = Math.sign(latest.brti.value - previousBrti.value);
      const exchangeMove = Math.sign(latestExchange.value - previousExchange.value);
      if (brtiMove !== 0 && exchangeMove !== 0) direction = brtiMove === exchangeMove ? "correct" : "wrong";
    }
    spreads.push({ exchange, spread: latestExchange?.spread ?? null, direction });
    latest[exchange] = latest[exchange] ?? null;
    latest[exchange] = latest[exchange] ? { value: latest[exchange].value, timestamp: latest[exchange].timestamp } : null;
  }
  const stats = [...grouped.entries()].map(([exchange, samples]) => {
    let wrongDirection = 0;
    let directionComparisons = 0;
    for (let index = 1; index < samples.length; index += 1) {
      const brtiMove = Math.sign(samples[index].brti - samples[index - 1].brti);
      const exchangeMove = Math.sign(samples[index].value - samples[index - 1].value);
      if (brtiMove !== 0 && exchangeMove !== 0) {
        directionComparisons += 1;
        if (brtiMove !== exchangeMove) wrongDirection += 1;
      }
    }
    let spreadTotal = 0;
    for (const sample of samples) spreadTotal += sample.spread;
    return { exchange, averageSpread: spreadTotal / samples.length, wrongDirectionRate: directionComparisons ? wrongDirection / directionComparisons * 100 : 0, samples: samples.length };
  });
  return { asset, latest, spreads, stats, maxMatchDifferenceMs };
}

function computeHistory(asset = "BTC") {
  const { brti, exchanges } = readRows(asset);
  const grouped = new Map();
  for (const row of exchanges) {
    const tick = nearestTick(brti, row.timestamp);
    if (!tick || Math.abs(tick.timestamp - row.timestamp) > maxMatchDifferenceMs) continue;
    const point = grouped.get(row.timestamp) ?? { timestamp: row.timestamp, brti: tick.value };
    point[row.exchange] = row.value;
    grouped.set(row.timestamp, point);
  }
  return [...grouped.values()].sort((left, right) => left.timestamp - right.timestamp).slice(-200);
}

const server = http.createServer((request, response) => {
  try {
    if (request.url?.startsWith("/api/stats")) {
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      const asset = new URL(request.url, "http://localhost").searchParams.get("asset") ?? "BTC";
      response.end(JSON.stringify(computeStats(asset)));
      return;
    }
    if (request.url?.startsWith("/api/history")) {
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      const asset = new URL(request.url, "http://localhost").searchParams.get("asset") ?? "BTC";
      response.end(JSON.stringify(computeHistory(asset)));
      return;
    }
    if (request.url?.startsWith("/api/spread")) {
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      const asset = new URL(request.url, "http://localhost").searchParams.get("asset") ?? "BTC";
      const quotes = latestQuotes(asset, dbPath);
      const report = quotes.length ? computeSpreadReport(quotes, referenceSourceName) : null;
      response.end(JSON.stringify(report ?? { referenceSource: referenceSourceName, rows: [], note: "No quotes collected yet for this asset." }));
      return;
    }
    if (request.url === "/" || request.url === "/index.html") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(html);
      return;
    }
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Dashboard listening at http://localhost:${port}`);
});
