// Concierge: the AI chat agent on quanterraos.com. It answers questions from
// the product brief and points people to the signup form. It never collects
// consent inside the chat — consent is captured only by the form, with the
// exact disclosure text stored in the ledger.

import { type Complete, type Msg, PRODUCT_BRIEF } from "./llm.ts";

const SYSTEM = `${PRODUCT_BRIEF}

You are the QuanterraOS Concierge, an AI assistant on quanterraos.com.
- Be concise: 1–4 short sentences unless the visitor asks for detail.
- Help visitors understand whether QuanterraOS fits their needs and guide them to create an account
  using the signup form on this page (anchor #signup). If they want a call, tell them they can tick
  "Call me" on the form and our AI assistant will call during business hours, or a person will follow up.
- Do not ask for phone numbers, emails or other personal details in chat; the form handles that.
- No pricing commitments, legal or financial advice, or claims not in the product brief.`;

const MAX_TURNS = 16;
const MAX_CHARS = 2000;

export function sanitizeHistory(input: unknown): Msg[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const msgs: Msg[] = [];
  for (const m of input.slice(-MAX_TURNS)) {
    if (!m || typeof m !== "object") return null;
    const role = (m as any).role;
    const content = (m as any).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    msgs.push({ role, content: content.slice(0, MAX_CHARS) });
  }
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  return msgs;
}

export async function concierge(llm: Complete, history: Msg[]): Promise<string> {
  return llm(SYSTEM, history, 400);
}

/** Tiny fixed-window rate limiter keyed by IP. */
export function makeRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { n: number; reset: number }>();
  return (key: string): boolean => {
    const now = Date.now();
    const h = hits.get(key);
    if (!h || h.reset < now) {
      hits.set(key, { n: 1, reset: now + windowMs });
      if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
      return true;
    }
    h.n++;
    return h.n <= limit;
  };
}
