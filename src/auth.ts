/**
 * TEMPORARY auth stub.
 *
 * There is no real user system yet — right now there's exactly one
 * user (you), so this hardcodes an owner id instead of pretending to
 * have login/sessions it doesn't have. This is the honest version of
 * "auth" for a pre-launch MVP with one founder using it.
 *
 * When you have real users, replace `getChatGPTUser` with something
 * that reads an actual session/token from the request — e.g. a
 * library like Auth.js/NextAuth or Clerk if you want to avoid writing
 * password/session handling yourself. Nothing else in this codebase
 * needs to change: every route already takes the owner id as a plain
 * string, so swapping this one function is the whole migration.
 */
import type { IncomingMessage } from "node:http";

export interface AuthedUser {
  ownerId: string;
}

export function getChatGPTUser(_req: IncomingMessage): AuthedUser {
  return { ownerId: process.env.OWNER_ID ?? "alex" };
}
