import { test } from "node:test";
import assert from "node:assert/strict";
import type { IncomingMessage } from "node:http";
import { currentPlan, hasFeature, toFetchRequest } from "../plan.ts";

function fakeReq(overrides: Partial<IncomingMessage> & { originalUrl?: string }): IncomingMessage {
  return { method: "GET", url: "/", headers: { host: "example.test" }, ...overrides } as IncomingMessage;
}

test("toFetchRequest builds an absolute URL and copies headers", () => {
  const request = toFetchRequest(fakeReq({
    originalUrl: "/api/calibration/market-price?x=1",
    headers: { host: "example.test", "x-forwarded-proto": "https", cookie: "__session=abc", "x-multi": ["a", "b"] },
  }));
  assert.equal(request.url, "https://example.test/api/calibration/market-price?x=1");
  assert.equal(request.headers.get("cookie"), "__session=abc");
  assert.equal(request.headers.get("x-multi"), "a, b");
});

test("only pro unlocks real-time recompute and the bin table and extended history", () => {
  assert.equal(hasFeature("free", "calibration:realtime"), false);
  assert.equal(hasFeature("free", "calibration:bin-table"), false);
  assert.equal(hasFeature("free", "index:history-extended"), false);
  assert.equal(hasFeature("pro", "calibration:realtime"), true);
  assert.equal(hasFeature("pro", "calibration:bin-table"), true);
  assert.equal(hasFeature("pro", "index:history-extended"), true);
});

test("without Clerk keys every request is free", async () => {
  delete process.env.CLERK_SECRET_KEY;
  delete process.env.CLERK_PUBLISHABLE_KEY;
  assert.equal(await currentPlan(fakeReq({})), "free");
});
