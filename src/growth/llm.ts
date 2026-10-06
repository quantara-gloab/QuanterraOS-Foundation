// Minimal Claude Messages API client using fetch (no SDK dependency).

import type { GrowthConfig } from "./config.ts";

export interface Msg {
  role: "user" | "assistant";
  content: string;
}

export type Complete = (system: string, messages: Msg[], maxTokens?: number) => Promise<string>;

export function makeClaude(cfg: GrowthConfig): Complete {
  return async (system, messages, maxTokens = 600) => {
    if (!cfg.anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": cfg.anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: cfg.anthropicModel, max_tokens: maxTokens, system, messages }),
    });
    if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as { content: Array<{ type: string; text?: string }> };
    return data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("")
      .trim();
  };
}

/** Shared product facts every agent speaks from, so no agent invents claims. */
export const PRODUCT_BRIEF = `
QuanterraOS is an explainable intelligence and execution layer built by Quantara Global LLC.
It sits above the AI systems a company already uses and makes their decisions verifiable:
- Rule Attribution: every automated decision is traced to the rule, data and model that produced it.
- Confidence Calibration: the system measures how often its stated confidence matches real outcomes.
- Outcome Resolution: predictions and actions are closed out against what actually happened.
Target buyers: finance, healthcare, government and other regulated teams that need AI they can audit.
Current offers: Quanterra Trust (audit and attribution layer) and INTELLARA Core (decision engine), plus the
Growth Engine (consent-first AI outreach and concierge agents).
Getting started: create an account at quanterraos.com or book a pilot conversation.
Rules for any agent speaking about QuanterraOS:
- Never invent customers, results, revenue figures, certifications, partnerships or guarantees.
- If you don't know something, say a person from the team will follow up.
- Always identify yourself as an AI assistant for QuanterraOS when asked, and at the start of any call.
`.trim();
