import { Request, Response } from 'express';
import { calculateBasisDivergence } from '../lib/oracle-divergence.js';

export function handleRadarStream(req: Request, res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Synthetic live basis stream anchored to CME CF BRTI benchmark
  const timer = setInterval(() => {
    const baseSpot = 63420.50;
    const baseBenchmark = 63415.00;
    const jitter = (Math.random() - 0.48) * 12.0;
    const currentSpot = +(baseSpot + jitter).toFixed(2);

    const divergence = calculateBasisDivergence({
      spotPriceUsd: currentSpot,
      benchmarkPriceUsd: baseBenchmark,
      timestampMs: Date.now(),
      toleranceBps: 25
    });

    const payload = JSON.stringify({
      spotPriceUsd: divergence.spotPriceUsd,
      benchmarkPriceUsd: divergence.benchmarkPriceUsd,
      basisDeltaUsd: divergence.basisDeltaUsd,
      basisBps: divergence.basisBps,
      status: divergence.status, // "SAFE" | "CONTESTED" | "CRITICAL"
      timestamp: Date.now()
    });

    res.write(`data: ${payload}\n\n`);
  }, 1000);

  req.on('close', () => {
    clearInterval(timer);
  });
}
