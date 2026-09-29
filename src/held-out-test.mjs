function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function fee(price, rate) {
  return rate * price * (1 - price);
}

function bootstrapInterval(samples, iterations, alpha, random) {
  if (!samples.length) return { low: null, high: null };
  const totals = [];
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let total = 0;
    for (let index = 0; index < samples.length; index += 1) {
      total += samples[Math.floor(random() * samples.length)];
    }
    totals.push(total);
  }
  totals.sort((left, right) => left - right);
  return {
    low: totals[Math.floor(iterations * alpha / 2)],
    high: totals[Math.min(iterations - 1, Math.floor(iterations * (1 - alpha / 2)))],
  };
}

function outcomeRate(entries) {
  return entries.length
    ? entries.filter((entry) => String(entry.result).toLowerCase() === "yes").length / entries.length
    : null;
}

export function runHeldOutTest(featureName, data, options = {}) {
  const featureKey = options.featureKey ?? featureName;
  const feeRate = options.feeRate ?? 0.07;
  const iterations = options.bootstrapIterations ?? 1000;
  const familyAlpha = options.alpha ?? 0.05;
  const comparisonCount = Math.max(1, options.comparisonCount ?? 1);
  const random = options.random ?? Math.random;
  const entries = data.filter((entry) => (
    Number.isFinite(entry[featureKey])
    && (String(entry.result).toLowerCase() === "yes" || String(entry.result).toLowerCase() === "no")
    && Number.isFinite(entry.yesAsk)
    && Number.isFinite(entry.noAsk)
    && entry.yesAsk >= 0 && entry.yesAsk <= 1
    && entry.noAsk >= 0 && entry.noAsk <= 1
  ));
  const splitIndex = Math.floor(entries.length / 2);
  const training = entries.slice(0, splitIndex);
  const heldOut = entries.slice(splitIndex);
  const threshold = median(training.map((entry) => entry[featureKey]));
  if (threshold === null || !training.length || !heldOut.length) {
    return { featureName, eligibleMarkets: entries.length, trainingMarkets: training.length, heldOutMarkets: heldOut.length, threshold: null, reason: "Insufficient eligible data for a chronological train/held-out split." };
  }

  const groups = { low: [], high: [] };
  for (const entry of training) groups[entry[featureKey] < threshold ? "low" : "high"].push(entry);
  const trainingGroups = Object.fromEntries(Object.entries(groups).map(([name, members]) => [name, {
    markets: members.length,
    yesRate: outcomeRate(members),
  }]));
  if (!groups.low.length || !groups.high.length) {
    return { featureName, eligibleMarkets: entries.length, trainingMarkets: training.length, heldOutMarkets: heldOut.length, threshold, trainingGroups, reason: "Training data did not form two populated feature groups." };
  }

  const predictions = {
    low: trainingGroups.low.yesRate >= trainingGroups.high.yesRate ? "yes" : "no",
    high: trainingGroups.high.yesRate > trainingGroups.low.yesRate ? "yes" : "no",
  };
  let wins = 0;
  const profits = heldOut.map((entry) => {
    const group = entry[featureKey] < threshold ? "low" : "high";
    const prediction = predictions[group];
    const entryPrice = prediction === "yes" ? entry.yesAsk : entry.noAsk;
    const won = prediction === String(entry.result).toLowerCase();
    if (won) wins += 1;
    return (won ? 1 : 0) - entryPrice - fee(entryPrice, feeRate);
  });
  const totalProfit = profits.reduce((sum, profit) => sum + profit, 0);
  const adjustedAlpha = familyAlpha / comparisonCount;
  const bootstrap95 = bootstrapInterval(profits, iterations, 0.05, random);
  const bonferroniAdjusted = bootstrapInterval(profits, iterations, adjustedAlpha, random);

  return {
    featureName,
    eligibleMarkets: entries.length,
    trainingMarkets: training.length,
    heldOutMarkets: heldOut.length,
    threshold,
    trainingGroups,
    heldOut: {
      markets: heldOut.length,
      wins,
      winRate: wins / heldOut.length * 100,
      averageProfitPerContract: totalProfit / heldOut.length,
      totalProfit,
    },
    bootstrap: {
      iterations,
      confidenceInterval95: bootstrap95,
      familyAlpha,
      comparisonCount,
      bonferroniAlpha: adjustedAlpha,
      bonferroniAdjustedConfidenceInterval: bonferroniAdjusted,
    },
  };
}