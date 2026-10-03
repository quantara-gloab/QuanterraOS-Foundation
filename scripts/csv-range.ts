import fs from "node:fs";

const csvPath = process.env.KALSHI_BACKTEST_CSV ?? "data/kalshi-btc15m-candles.csv";
const content = fs.readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
const [header, ...lines] = content;
const cols = header.split(",");
const tickerIdx = cols.indexOf("ticker");
const openIdx = cols.indexOf("open_time");

const tickers = new Set<string>();
let minOpen = Infinity;
let maxOpen = -Infinity;

for (const line of lines) {
  const parts = line.split(",");
  const ticker = parts[tickerIdx];
  const openTime = Number(parts[openIdx]);
  tickers.add(ticker);
  if (openTime < minOpen) minOpen = openTime;
  if (openTime > maxOpen) maxOpen = openTime;
}

const result = {
  csvPath,
  totalRows: lines.length,
  uniqueTickers: tickers.size,
  earliestOpenTime: new Date(minOpen * 1000).toISOString(),
  latestOpenTime: new Date(maxOpen * 1000).toISOString(),
};

console.log(JSON.stringify(result, null, 2));
