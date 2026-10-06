import { createHmac, timingSafeEqual } from "node:crypto";
import { normEmail } from "./db.ts";

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function makeUnsubToken(secret: string, email: string): string {
  const e = normEmail(email);
  const payload = b64url(Buffer.from(e));
  const sig = b64url(createHmac("sha256", secret).update(e).digest()).slice(0, 32);
  return `${payload}.${sig}`;
}

/** Returns the email if the token is valid, otherwise null. */
export function readUnsubToken(secret: string, token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  let email: string;
  try {
    email = Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = b64url(createHmac("sha256", secret).update(email).digest()).slice(0, 32);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return email;
}

export function unsubUrl(baseUrl: string, secret: string, email: string): string {
  return `${baseUrl}/api/growth/unsubscribe?t=${encodeURIComponent(makeUnsubToken(secret, email))}`;
}
