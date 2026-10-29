export type OracleType = "CF_BENCHMARK_BRTI" | "CHAINLINK_AGGREGATOR" | "UMA_OPTIMISTIC";

export interface SettlementOracleObservation {
  asset: "BTC" | "ETH" | "SOL";
  oracleType: OracleType;
  oraclePriceUsd: number;
  spotPriceUsd: number;
  strikePriceUsd: number;
  oracleTimestampMs: number;
  currentTimestampMs: number;
  maxStalenessToleranceMs: number;
}

export interface OracleDivergenceResult {
  asset: "BTC" | "ETH" | "SOL";
  basisDivergenceUsd: number;
  basisDivergenceBps: number;
  isOracleStale: boolean;
  strikeDistanceUsd: number;
  settlementPrediction: "IN_THE_MONEY" | "OUT_OF_THE_MONEY" | "THRESHOLD_CONVERGENCE";
  actionableSignal: boolean;
  signalReason: string;
}

export function computeOracleDivergence(obs: SettlementOracleObservation): OracleDivergenceResult {
  const stalenessMs = obs.currentTimestampMs - obs.oracleTimestampMs;
  const isOracleStale = stalenessMs > obs.maxStalenessToleranceMs;

  const basisDivergenceUsd = Number((obs.spotPriceUsd - obs.oraclePriceUsd).toFixed(2));
  const basisDivergenceBps = Math.round((basisDivergenceUsd / obs.oraclePriceUsd) * 10000);
  const strikeDistanceUsd = Number((obs.oraclePriceUsd - obs.strikePriceUsd).toFixed(2));

  let settlementPrediction: "IN_THE_MONEY" | "OUT_OF_THE_MONEY" | "THRESHOLD_CONVERGENCE" = "THRESHOLD_CONVERGENCE";
  if (strikeDistanceUsd > 25) {
    settlementPrediction = "IN_THE_MONEY";
  } else if (strikeDistanceUsd < -25) {
    settlementPrediction = "OUT_OF_THE_MONEY";
  }

  // Spot crosses the strike while the settlement benchmark lags
  const spotAboveStrike = obs.spotPriceUsd >= obs.strikePriceUsd;
  const oracleAboveStrike = obs.oraclePriceUsd >= obs.strikePriceUsd;
  const oracleDisconnect = spotAboveStrike !== oracleAboveStrike;

  let actionableSignal = false;
  let signalReason = "Oracle and spot aligned within normal parameters.";

  if (isOracleStale) {
    actionableSignal = false;
    signalReason = "EXECUTION BLOCKED: Oracle heartbeat exceeds staleness threshold.";
  } else if (oracleDisconnect) {
    actionableSignal = true;
    signalReason = "ORACLE ARBITRAGE SIGNAL: Spot crossed strike but settlement index has not converged.";
  }

  return {
    asset: obs.asset,
    basisDivergenceUsd,
    basisDivergenceBps,
    isOracleStale,
    strikeDistanceUsd,
    settlementPrediction,
    actionableSignal,
    signalReason,
  };
}
