const response = await fetch("https://external-api.kalshi.com/trade-api/v2/markets?series_ticker=KXBTC15M&status=open&limit=5");
const data = await response.json();
console.log(JSON.stringify(data, null, 2));
