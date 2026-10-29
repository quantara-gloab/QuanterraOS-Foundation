import { Request, Response } from "express";

export function handleRadarStream(req: Request, res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  if (typeof (res as any).flushHeaders === "function") {
    (res as any).flushHeaders();
  }

  const timer = setInterval(() => {
    const baseSpot = 63420.50;
    const baseBenchmark = 63415.00;
    const jitter = (Math.random() - 0.48) * 12.0;
    const currentSpot = +(baseSpot + jitter).toFixed(2);
    const delta = +(currentSpot - baseBenchmark).toFixed(2);
    const basisBps = +((delta / baseBenchmark) * 10000).toFixed(1);
    const status = Math.abs(basisBps) > 25 ? "CONTESTED" : "SAFE";

    const payload = JSON.stringify({
      spotPriceUsd: currentSpot,
      benchmarkPriceUsd: baseBenchmark,
      basisDeltaUsd: delta,
      basisBps: basisBps,
      status: status,
      timestamp: Date.now()
    });

    res.write("data: " + payload + "\n\n");
  }, 1000);

  req.on("close", () => {
    clearInterval(timer);
  });
}
