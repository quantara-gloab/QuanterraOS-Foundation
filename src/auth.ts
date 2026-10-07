/**
 * User accounts, session management, and feature tier resolution.
 *
 * Implements lightweight, secure local authentication (email + scrypt-hashed password),
 * session cookie / bearer token verification, and tier resolution ('free' | 'pro' | 'institutional').
 */
import type { IncomingMessage } from "node:http";
import { scryptSync, randomBytes, timingSafeEqual, randomUUID, createHash } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { db } from "./db.ts";
import { users, sessions, apiKeys } from "./schema.ts";

export type UserTier = "free" | "plus" | "pro" | "institutional";

export interface UserRecord {
  id: string;
  email: string;
  phone: string | null;
  tier: UserTier;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserAuthContext {
  user: UserRecord | null;
  tier: UserTier;
  sessionId: string | null;
}

export interface AuthedUser {
  ownerId: string;
}

/** Legacy stub for workspace routes. Preserves backward compatibility. */
export function getChatGPTUser(req: IncomingMessage): AuthedUser {
  const auth = getUserAuth(req);
  if (auth.user) {
    return { ownerId: auth.user.email };
  }
  return { ownerId: process.env.OWNER_ID ?? "alex" };
}

// ---------------------------------------------------------------------------
// Password Hashing (scrypt)
// ---------------------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, keyHex] = storedHash.split(":");
    if (!salt || !keyHex) return false;
    const key = Buffer.from(keyHex, "hex");
    const derivedKey = scryptSync(password, salt, 64);
    return timingSafeEqual(key, derivedKey);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// User Operations
// ---------------------------------------------------------------------------

export function createUser(email: string, password: string, tier: UserTier = "free", phone: string | null = null): UserRecord {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.select().from(users).where(eq(users.email, normalizedEmail)).get();
  if (existing) {
    throw new Error("Email already registered");
  }

  const id = `usr_${randomUUID().slice(0, 16)}`;
  const now = new Date().toISOString();
  const passwordHash = hashPassword(password);

  db.insert(users)
    .values({
      id,
      email: normalizedEmail,
      phone: phone || null,
      passwordHash,
      tier,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return {
    id,
    email: normalizedEmail,
    phone: phone || null,
    tier,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function authenticateUser(email: string, password: string): UserRecord | null {
  const normalizedEmail = email.trim().toLowerCase();
  const row = db.select().from(users).where(eq(users.email, normalizedEmail)).get();
  if (!row) return null;
  if (!verifyPassword(password, row.passwordHash)) return null;

  return {
    id: row.id,
    email: row.email,
    phone: row.phone ?? null,
    tier: row.tier as UserTier,
    stripeCustomerId: row.stripeCustomerId,
    stripeSubscriptionId: row.stripeSubscriptionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function getUserById(userId: string): UserRecord | null {
  const row = db.select().from(users).where(eq(users.id, userId)).get();
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    phone: row.phone ?? null,
    tier: row.tier as UserTier,
    stripeCustomerId: row.stripeCustomerId,
    stripeSubscriptionId: row.stripeSubscriptionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function getUserByEmail(email: string): UserRecord | null {
  const normalizedEmail = email.trim().toLowerCase();
  const row = db.select().from(users).where(eq(users.email, normalizedEmail)).get();
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    phone: row.phone ?? null,
    tier: row.tier as UserTier,
    stripeCustomerId: row.stripeCustomerId,
    stripeSubscriptionId: row.stripeSubscriptionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function updateUserTier(userId: string, tier: UserTier, stripeCustomerId?: string | null, stripeSubscriptionId?: string | null): void {
  const now = new Date().toISOString();
  const updateValues: Record<string, unknown> = { tier, updatedAt: now };
  if (stripeCustomerId !== undefined) updateValues.stripeCustomerId = stripeCustomerId;
  if (stripeSubscriptionId !== undefined) updateValues.stripeSubscriptionId = stripeSubscriptionId;

  db.update(users)
    .set(updateValues)
    .where(eq(users.id, userId))
    .run();
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function createSession(userId: string): { sessionId: string; expiresAt: string } {
  const sessionId = `sess_${randomUUID()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();

  db.insert(sessions)
    .values({
      id: sessionId,
      userId,
      createdAt: now.toISOString(),
      expiresAt,
    })
    .run();

  return { sessionId, expiresAt };
}

export function deleteSession(sessionId: string): void {
  db.delete(sessions).where(eq(sessions.id, sessionId)).run();
}

export function getUserFromSession(sessionId: string): UserRecord | null {
  const sessionRow = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  if (!sessionRow) return null;

  if (new Date(sessionRow.expiresAt).getTime() < Date.now()) {
    deleteSession(sessionId);
    return null;
  }

  return getUserById(sessionRow.userId);
}

// ---------------------------------------------------------------------------
// API Keys (Institutional Tier)
// ---------------------------------------------------------------------------

export function generateApiKey(userId: string, tier: UserTier = "institutional"): { rawKey: string; keyPrefix: string } {
  const randomSecret = randomBytes(24).toString("hex");
  const rawKey = `qos_${tier === "institutional" ? "inst" : "pro"}_${randomSecret}`;
  const keyPrefix = rawKey.slice(0, 13); // e.g. qos_inst_1234
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const now = new Date().toISOString();

  db.insert(apiKeys)
    .values({
      id: `key_${randomUUID().slice(0, 16)}`,
      userId,
      keyPrefix,
      keyHash,
      tier,
      createdAt: now,
    })
    .run();

  return { rawKey, keyPrefix };
}

export function getUserFromApiKey(rawKey: string): UserRecord | null {
  if (!rawKey.startsWith("qos_")) return null;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const row = db.select().from(apiKeys).where(and(eq(apiKeys.keyHash, keyHash))).get();
  if (!row || row.revokedAt) return null;
  return getUserById(row.userId);
}

// ---------------------------------------------------------------------------
// Request Auth Context Parser
// ---------------------------------------------------------------------------

function parseCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match && match[2] ? decodeURIComponent(match[2]) : null;
}

export function getUserAuth(req: IncomingMessage): UserAuthContext {
  // 1. Check Bearer token (API Key or Session ID)
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token.startsWith("qos_")) {
      const user = getUserFromApiKey(token);
      if (user) return { user, tier: user.tier, sessionId: null };
    } else if (token.startsWith("sess_")) {
      const user = getUserFromSession(token);
      if (user) return { user, tier: user.tier, sessionId: token };
    }
  }

  // 2. Check Session Cookie
  const cookieHeader = req.headers["cookie"];
  const sessionId = parseCookie(cookieHeader, "quanterraos_session");
  if (sessionId) {
    const user = getUserFromSession(sessionId);
    if (user) {
      return { user, tier: user.tier, sessionId };
    }
  }

  // Default: Unauthenticated visitor has 'free' tier
  return { user: null, tier: "free", sessionId: null };
}

// ---------------------------------------------------------------------------
// Founder Clearance & Elevated Privilege Protection
// ---------------------------------------------------------------------------

let activeFounderSecretKey: string = process.env.FOUNDER_SECRET_KEY || "";
if (!activeFounderSecretKey) {
  // Ephemeral, cryptographically rotated key generated on boot if not explicitly injected
  activeFounderSecretKey = `qk_sec_${randomBytes(24).toString("hex")}`;
}

export function getActiveFounderSecretKeyPrefix(): string {
  return activeFounderSecretKey.slice(0, 10) + "...";
}

export function isFounderAuthorized(req: IncomingMessage): boolean {
  // 1. Direct header token check (x-founder-key)
  const directKey = (req.headers["x-founder-key"] as string | undefined)?.trim();
  if (directKey && directKey.length === activeFounderSecretKey.length) {
    try {
      const a = Buffer.from(directKey);
      const b = Buffer.from(activeFounderSecretKey);
      if (timingSafeEqual(a, b)) return true;
    } catch (_) {}
  }

  // 2. Bearer token matching founder key
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearer = authHeader.slice(7).trim();
    if (bearer.length === activeFounderSecretKey.length) {
      try {
        const a = Buffer.from(bearer);
        const b = Buffer.from(activeFounderSecretKey);
        if (timingSafeEqual(a, b)) return true;
      } catch (_) {}
    }
  }

  // 3. User session with founder email or institutional clearance
  const auth = getUserAuth(req);
  if (auth.user) {
    const founderEmail = (process.env.FOUNDER_EMAIL || "founder@quanterraos.com").toLowerCase();
    if (auth.user.email.toLowerCase() === founderEmail) return true;
    if (auth.tier === "institutional") return true;
  }

  return false;
}

export function requireFounderAuth(req: any, res: any, next: any): void {
  if (isFounderAuthorized(req)) {
    return next();
  }
  res.status(401).json({
    error: "Unauthorized: Founder or operator clearance required",
    code: "FOUNDER_AUTH_REQUIRED",
  });
}

