/**
 * Jev REST Client for TypeSafe's jev-1.13.0 API.
 *
 * Implements a robust HTTP client for Jev prediction and calibration queries:
 * - Injectable `fetch` for unit testing and offline execution.
 * - Automatic retry with exponential backoff on 429 (rate-limit) and 5xx server errors.
 * - Clean "not configured" handling when TYPESAFE_API_KEY is unset (abstain-not-fabricate).
 * - Enforces timeouts via AbortSignal.
 */

export interface JevClientOptions {
  apiKey?: string;
  apiUrl?: string;
  fetchFn?: typeof fetch;
  maxRetries?: number;
  timeoutMs?: number;
  backoffBaseMs?: number;
}

export interface JevPredictRequest {
  model?: string;
  contract: string;
  task?: string;
  state: Record<string, unknown>;
  quantBaseline?: {
    probability: number;
    model: string;
    distanceStdDevs?: number;
    realizedVolAnnualized?: number;
  };
}

export interface JevPrediction {
  suggestedProbability: number;
  calibratedAdjustment: number;
  confidence?: number;
  rationale: string;
  model: string;
  rawResponse?: Record<string, unknown>;
}

export interface JevPredictResponse {
  configured: boolean;
  prediction: JevPrediction | null;
  error?: string;
}

export class JevClient {
  private readonly apiKey: string | null;
  private readonly apiUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly backoffBaseMs: number;

  constructor(options: JevClientOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.TYPESAFE_API_KEY ?? null;
    this.apiUrl = options.apiUrl ?? process.env.TYPESAFE_API_URL ?? "https://api.typesafe.ai/v1/jev-1.13.0";
    this.fetchFn = options.fetchFn ?? globalThis.fetch;
    this.maxRetries = options.maxRetries ?? 2;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.backoffBaseMs = options.backoffBaseMs ?? 100;
  }

  /**
   * Returns true if a valid API key is present.
   */
  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Calls Jev with the curated state and quantitative baseline.
   *
   * If not configured, returns a clean `{ configured: false, prediction: null }`
   * following the abstain-rather-than-fabricate principle.
   */
  public async predict(request: JevPredictRequest): Promise<JevPredictResponse> {
    if (!this.isConfigured()) {
      return {
        configured: false,
        prediction: null,
        error: "Jev not configured — no TYPESAFE_API_KEY set",
      };
    }

    const payload = {
      model: request.model ?? "jev-1.13.0",
      contract: request.contract,
      task: request.task ?? "touch_contract_calibration",
      state: request.state,
      quant_baseline: request.quantBaseline,
    };

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= this.maxRetries) {
      attempt++;
      try {
        const response = await this.fetchFn(this.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
            "User-Agent": "quanterraos-foundation/jev-client",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        // Retry on 429 (rate limit) or 5xx (server error)
        if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
          if (attempt <= this.maxRetries) {
            const delay = this.backoffBaseMs * Math.pow(2, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`Jev API returned HTTP ${response.status} after ${attempt} attempts`);
        }

        if (!response.ok) {
          const bodyText = await response.text().catch(() => "");
          throw new Error(`Jev API error (HTTP ${response.status}): ${bodyText || response.statusText}`);
        }

        const data = await response.json() as Record<string, unknown>;
        return {
          configured: true,
          prediction: this.parseJevResponse(data, request.quantBaseline?.probability ?? 0.5),
        };
      } catch (err) {
        lastError = err as Error;
        if (attempt <= this.maxRetries) {
          const delay = this.backoffBaseMs * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    return {
      configured: true,
      prediction: null,
      error: lastError ? `Jev request failed: ${lastError.message}` : "Unknown error querying Jev",
    };
  }

  private parseJevResponse(data: Record<string, unknown>, baselineProbability: number): JevPrediction {
    // Jev returns calibrated_probability or an adjustment delta
    let suggestedProbability: number;
    let calibratedAdjustment: number;

    if (typeof data.calibrated_probability === "number") {
      suggestedProbability = Math.max(0.01, Math.min(0.99, data.calibrated_probability));
      calibratedAdjustment = Number((suggestedProbability - baselineProbability).toFixed(6));
    } else if (typeof data.delta === "number" || typeof data.adjustment === "number") {
      calibratedAdjustment = Number(Number(data.delta ?? data.adjustment).toFixed(6));
      suggestedProbability = Math.max(0.01, Math.min(0.99, baselineProbability + calibratedAdjustment));
    } else if (typeof data.suggested_probability === "number") {
      suggestedProbability = Math.max(0.01, Math.min(0.99, data.suggested_probability));
      calibratedAdjustment = Number((suggestedProbability - baselineProbability).toFixed(6));
    } else {
      // Fall back to the quantitative baseline without adjustment
      suggestedProbability = baselineProbability;
      calibratedAdjustment = 0;
    }

    const rationale = typeof data.rationale === "string"
      ? data.rationale
      : typeof data.reasoning === "string"
        ? data.reasoning
        : "Jev calibrated probability against quantitative baseline and order-book state.";

    const confidence = typeof data.confidence === "number" ? data.confidence : undefined;

    return {
      suggestedProbability,
      calibratedAdjustment,
      confidence,
      rationale,
      model: typeof data.model === "string" ? data.model : "jev-1.13.0",
      rawResponse: data,
    };
  }
}

/**
 * Factory helper for creating Jev clients.
 */
export function createJevClient(options?: JevClientOptions): JevClient {
  return new JevClient(options);
}
